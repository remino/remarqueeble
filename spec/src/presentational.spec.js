import {
	parseLegacyColor,
	parsePresentationalDimension,
	parseScrollAmount,
} from '../../src/lib/remarqueeble.ts'

describe('src/lib/remarqueeble.ts', () => {
	const originalCss = globalThis.CSS
	const originalHTMLElement = globalThis.HTMLElement
	const originalRequestAnimationFrame = globalThis.requestAnimationFrame
	const originalClearInterval = globalThis.clearInterval
	const originalSetInterval = globalThis.setInterval

	afterEach(() => {
		if (originalCss === undefined) {
			delete globalThis.CSS
		} else {
			globalThis.CSS = originalCss
		}

		if (originalHTMLElement === undefined) {
			delete globalThis.HTMLElement
		} else {
			globalThis.HTMLElement = originalHTMLElement
		}

		if (originalRequestAnimationFrame === undefined) {
			delete globalThis.requestAnimationFrame
		} else {
			globalThis.requestAnimationFrame = originalRequestAnimationFrame
		}

		if (originalClearInterval === undefined) {
			delete globalThis.clearInterval
		} else {
			globalThis.clearInterval = originalClearInterval
		}

		if (originalSetInterval === undefined) {
			delete globalThis.setInterval
		} else {
			globalThis.setInterval = originalSetInterval
		}
	})

	const createStyle = () => {
		const properties = new Map()

		return {
			animationName: '',
			inlineSize: '',
			transform: '',
			getPropertyValue(name) {
				return properties.get(name) || ''
			},
			removeProperty(name) {
				properties.delete(name)
				if (name === 'animation-name') this.animationName = ''
				if (name === 'transform') this.transform = ''
			},
			setProperty(name, value) {
				properties.set(name, value)
			},
		}
	}

	const installElementShim = sizes => {
		let nextIntervalId = 1
		const intervals = new Map()

		globalThis.requestAnimationFrame = callback => {
			callback()
			return 1
		}

		globalThis.setInterval = callback => {
			const id = nextIntervalId++
			intervals.set(id, callback)
			return id
		}

		globalThis.clearInterval = id => {
			intervals.delete(id)
		}

		globalThis.HTMLElement = class {
			attributes = new Map()
			clientHeight = sizes.hostHeight
			clientWidth = sizes.hostWidth
			isConnected = true
			listeners = new Map()
			shadowScrollAmountProbe = null
			shadowTrack = null
			style = createStyle()

			attachShadow() {
				this.shadowTrack = {
					addEventListener() {},
					offsetHeight: sizes.trackHeight,
					offsetWidth: sizes.trackWidth,
					style: createStyle(),
				}
				this.shadowScrollAmountProbe = {
					getBoundingClientRect: () => {
						const value = this.shadowScrollAmountProbe.style.inlineSize
						const width =
							sizes.scrollAmountWidths[value] ?? Number.parseFloat(value)

						return { width }
					},
					style: createStyle(),
				}

				return {
					innerHTML: '',
					querySelector: selector =>
						selector === '.scrollamount-probe'
							? this.shadowScrollAmountProbe
							: this.shadowTrack,
				}
			}

			getAttribute(name) {
				return this.attributes.has(name) ? this.attributes.get(name) : null
			}

			hasAttribute(name) {
				return this.attributes.has(name)
			}

			setAttribute(name, value) {
				this.attributes.set(name, String(value))
			}

			addEventListener(type, listener) {
				const listeners = this.listeners.get(type) ?? []

				listeners.push(listener)
				this.listeners.set(type, listeners)
			}

			dispatchEvent(event) {
				for (const listener of this.listeners.get(event.type) ?? []) {
					listener.call(this, event)
				}

				return true
			}
		}

		return {
			runIntervals() {
				for (const callback of [...intervals.values()]) {
					callback()
				}
			},
		}
	}

	const createMarquee = async (attributes, sizes = {}) => {
		const shims = installElementShim({
			hostHeight: 50,
			hostWidth: 100,
			scrollAmountWidths: {},
			trackHeight: 20,
			trackWidth: 40,
			...sizes,
		})

		const { RemarqueebleElement } = await import(
			`../../src/lib/remarqueeble.ts?presentational-spec=${Date.now()}-${Math.random()}`
		)
		const marquee = new RemarqueebleElement()

		for (const [name, value] of Object.entries(attributes)) {
			marquee.setAttribute(name, value)
		}

		marquee.connectedCallback()
		marquee.__runIntervals = shims.runIntervals

		return marquee
	}

	describe('parsePresentationalDimension()', () => {
		it('returns null for missing and blank values', () => {
			expect(parsePresentationalDimension(null)).toBeNull()
			expect(parsePresentationalDimension('')).toBeNull()
			expect(parsePresentationalDimension('  ')).toBeNull()
		})

		it('converts numeric values to px', () => {
			expect(parsePresentationalDimension('12')).toBe('12px')
			expect(parsePresentationalDimension('-4.5')).toBe('-4.5px')
			expect(parsePresentationalDimension('0')).toBe('0px')
		})

		it('returns supported CSS dimensions unchanged', () => {
			globalThis.CSS = {
				supports: (property, value) =>
					property === 'width' && value === 'calc(100% - 1rem)',
			}

			expect(parsePresentationalDimension('calc(100% - 1rem)')).toBe(
				'calc(100% - 1rem)'
			)
		})

		it('returns null for unsupported CSS dimensions', () => {
			globalThis.CSS = {
				supports: () => false,
			}

			expect(parsePresentationalDimension('definitely-not-a-size')).toBeNull()
		})
	})

	describe('parseScrollAmount()', () => {
		it('returns null for missing and blank values', () => {
			expect(parseScrollAmount(null)).toBeNull()
			expect(parseScrollAmount('')).toBeNull()
			expect(parseScrollAmount('  ')).toBeNull()
		})

		it('converts non-negative numeric values to px', () => {
			expect(parseScrollAmount('12')).toBe('12px')
			expect(parseScrollAmount('0.5')).toBe('0.5px')
			expect(parseScrollAmount('0')).toBe('0px')
		})

		it('returns null for negative numeric values', () => {
			expect(parseScrollAmount('-1')).toBeNull()
		})

		it('returns supported CSS dimensions unchanged', () => {
			globalThis.CSS = {
				supports: (property, value) =>
					property === 'width' && value === 'calc(1em + 2px)',
			}

			expect(parseScrollAmount('calc(1em + 2px)')).toBe('calc(1em + 2px)')
		})
	})

	describe('parseLegacyColor()', () => {
		it('returns null for missing and blank values', () => {
			expect(parseLegacyColor(null)).toBeNull()
			expect(parseLegacyColor('')).toBeNull()
			expect(parseLegacyColor('  ')).toBeNull()
		})

		it('returns supported CSS colors unchanged', () => {
			globalThis.CSS = {
				supports: (property, value) =>
					property === 'background-color' && value === 'rebeccapurple',
			}

			expect(parseLegacyColor('rebeccapurple')).toBe('rebeccapurple')
		})

		it('returns null for unsupported CSS colors', () => {
			globalThis.CSS = {
				supports: () => false,
			}

			expect(parseLegacyColor('not-a-color')).toBeNull()
		})
	})

	describe('legacy timing attributes', () => {
		it('freezes at rest when scrollamount is zero', async () => {
			const marquee = await createMarquee({ scrollamount: '0' })

			expect(marquee.shadowTrack.style.transform).toBe('translate(0px, 0px)')
			expect(marquee.currentPosition).toBe(0)
			expect(marquee.style.getPropertyValue('--translate-current-x')).toBe('')
		})

		it('keeps positive scrollamount values animated', async () => {
			const marquee = await createMarquee({ scrollamount: '1' })

			expect(marquee.currentPosition).toBe(100)
			expect(marquee.shadowTrack.style.transform).toBe('translate(100px, 0px)')
		})

		it('resolves CSS scrollamount values before computing movement', async () => {
			globalThis.CSS = {
				supports: (property, value) =>
					property === 'width' && value === 'calc(1em + 2px)',
			}
			const marquee = await createMarquee(
				{ scrollamount: 'calc(1em + 2px)' },
				{ scrollAmountWidths: { 'calc(1em + 2px)': 10 } }
			)

			marquee.__runIntervals()
			expect(marquee.currentPosition).toBe(90)
		})

		it('falls back to the default scrollamount for negative values', async () => {
			const marquee = await createMarquee({ scrollamount: '-1' })

			marquee.__runIntervals()
			expect(marquee.currentPosition).toBe(94)
		})

		it('falls back to the default scrolldelay for negative values', async () => {
			const marquee = await createMarquee({ scrolldelay: '-1' })

			expect(marquee.scrollDelay).toBe(85)
		})

		it('preserves valid low scrolldelay values with truespeed', async () => {
			const marquee = await createMarquee({
				scrolldelay: '20',
				truespeed: '',
			})

			expect(marquee.scrollDelay).toBe(20)
		})
	})

	describe('animate attribute', () => {
		it('keeps the default behavior animated even when content fits', async () => {
			const marquee = await createMarquee({})

			expect(marquee.currentPosition).toBe(100)
			expect(marquee.shadowTrack.style.transform).toBe('translate(100px, 0px)')
		})

		it('keeps animate always animated even when content fits', async () => {
			const marquee = await createMarquee({ animate: 'always' })

			expect(marquee.currentPosition).toBe(100)
			expect(marquee.shadowTrack.style.transform).toBe('translate(100px, 0px)')
		})

		it('freezes at rest when animate is never', async () => {
			const marquee = await createMarquee({ animate: 'never' })

			expect(marquee.shadowTrack.style.transform).toBe('translate(0px, 0px)')
			expect(marquee.currentPosition).toBe(0)
		})

		it('freezes at rest when animate overflow content fits', async () => {
			const marquee = await createMarquee({ animate: 'overflow' })

			expect(marquee.shadowTrack.style.transform).toBe('translate(0px, 0px)')
			expect(marquee.currentPosition).toBe(0)
		})

		it('animates when animate overflow content exceeds the host', async () => {
			const marquee = await createMarquee(
				{ animate: 'overflow' },
				{ trackWidth: 140 }
			)

			expect(marquee.currentPosition).toBe(100)
			marquee.__runIntervals()
			expect(marquee.currentPosition).toBe(94)
		})

		it('uses height to decide vertical animate overflow', async () => {
			const marquee = await createMarquee(
				{ animate: 'overflow', direction: 'up' },
				{ trackHeight: 75 }
			)

			expect(marquee.currentPosition).toBe(50)
			marquee.__runIntervals()
			expect(marquee.shadowTrack.style.transform).toBe('translate(0px, 44px)')
		})
	})

	describe('behavior attribute', () => {
		it('reverses direction cleanly in alternate mode instead of snapping back to the initial direction', async () => {
			const marquee = await createMarquee(
				{
					behavior: 'alternate',
					scrollamount: '10',
				},
				{ hostWidth: 100, trackWidth: 40 }
			)

			expect(marquee.shadowTrack.style.transform).toBe('translate(60px, 0px)')

			marquee.__runIntervals()
			expect(marquee.shadowTrack.style.transform).toBe('translate(50px, 0px)')

			marquee.__runIntervals()
			expect(marquee.shadowTrack.style.transform).toBe('translate(40px, 0px)')
		})

		it('stops slide flush with the start edge when the content fits inside the host', async () => {
			const marquee = await createMarquee({
				behavior: 'slide',
				scrollamount: '10',
			})

			for (let index = 0; index < 10; index += 1) {
				marquee.__runIntervals()
			}

			expect(marquee.shadowTrack.style.transform).toBe('translate(0px, 0px)')
		})

		it('stops slide at the furthest fully-revealed position when the content overflows the host', async () => {
			const marquee = await createMarquee(
				{
					behavior: 'slide',
					scrollamount: '10',
				},
				{ trackWidth: 140 }
			)

			for (let index = 0; index < 14; index += 1) {
				marquee.__runIntervals()
			}

			expect(marquee.shadowTrack.style.transform).toBe('translate(-40px, 0px)')
		})
	})

	describe('legacy events', () => {
		it('emits start when scrolling begins', async () => {
			const marquee = await createMarquee({})
			const listener = jasmine.createSpy('start')

			marquee.addEventListener('start', listener)
			marquee.stop()
			marquee.start()

			expect(listener).toHaveBeenCalledTimes(1)
		})

		it('emits bounce when alternate reaches an edge', async () => {
			const marquee = await createMarquee(
				{
					behavior: 'alternate',
					scrollamount: '10',
				},
				{ hostWidth: 100, trackWidth: 40 }
			)
			const listener = jasmine.createSpy('bounce')

			marquee.addEventListener('bounce', listener)

			for (let index = 0; index < 7; index += 1) {
				marquee.__runIntervals()
			}

			expect(listener).toHaveBeenCalledTimes(1)
		})

		it('emits finish when a finite loop completes', async () => {
			const marquee = await createMarquee({
				loop: '1',
				scrollamount: '140',
			})
			const listener = jasmine.createSpy('finish')

			marquee.addEventListener('finish', listener)
			marquee.__runIntervals()

			expect(listener).toHaveBeenCalledTimes(1)
		})
	})

	describe('layout changes', () => {
		it('preserves the current animation progress when the host is resized', async () => {
			const marquee = await createMarquee({})

			marquee.currentPosition = 42
			marquee.hasPosition = true
			marquee.shadowTrack.style.transform = 'translate(42px, 0px)'
			marquee.clientWidth = 160

			marquee.__runIntervals()

			expect(marquee.shadowTrack.style.transform).toBe('translate(36px, 0px)')
		})

		it('keeps overflow animation running across repeated resizes', async () => {
			const marquee = await createMarquee(
				{ animate: 'overflow' },
				{ hostWidth: 100, trackWidth: 140 }
			)

			expect(marquee.shadowTrack.style.transform).toBe('translate(100px, 0px)')

			marquee.clientWidth = 160
			marquee.__runIntervals()

			expect(marquee.shadowTrack.style.transform).toBe('translate(0px, 0px)')

			marquee.clientWidth = 100
			marquee.__runIntervals()

			expect(marquee.shadowTrack.style.transform).toBe('translate(94px, 0px)')
		})
	})
})
