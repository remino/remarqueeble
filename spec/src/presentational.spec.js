import {
	parseLegacyColor,
	parsePresentationalDimension,
} from '../../src/lib/remarqueeble.ts'

describe('src/lib/remarqueeble.ts', () => {
	const originalCss = globalThis.CSS
	const originalHTMLElement = globalThis.HTMLElement
	const originalRequestAnimationFrame = globalThis.requestAnimationFrame

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
	})

	const createStyle = () => {
		const properties = new Map()

		return {
			animationName: '',
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

	const installElementShim = () => {
		globalThis.requestAnimationFrame = callback => {
			callback()
			return 1
		}

		globalThis.HTMLElement = class {
			attributes = new Map()
			clientHeight = 50
			clientWidth = 100
			isConnected = true
			shadowTrack = null
			style = createStyle()

			attachShadow() {
				this.shadowTrack = {
					addEventListener() {},
					offsetHeight: 20,
					offsetWidth: 40,
					style: createStyle(),
				}

				return {
					innerHTML: '',
					querySelector: () => this.shadowTrack,
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
		}
	}

	const createMarquee = async attributes => {
		installElementShim()

		const { RemarqueebleElement } = await import(
			`../../src/lib/remarqueeble.ts?presentational-spec=${Date.now()}-${Math.random()}`
		)
		const marquee = new RemarqueebleElement()

		for (const [name, value] of Object.entries(attributes)) {
			marquee.setAttribute(name, value)
		}

		marquee.connectedCallback()

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

			expect(marquee.shadowTrack.style.animationName).toBe('none')
			expect(marquee.shadowTrack.style.transform).toBe('translate(0px, 0px)')
			expect(
				marquee.style.getPropertyValue('--animation-timing-function')
			).toBe('linear')
			expect(marquee.style.getPropertyValue('--animation-duration')).toBe('0ms')
		})

		it('keeps positive scrollamount values animated', async () => {
			const marquee = await createMarquee({ scrollamount: '1' })

			expect(marquee.shadowTrack.style.animationName).toBe('')
			expect(marquee.shadowTrack.style.transform).toBe('')
			expect(
				marquee.style.getPropertyValue('--animation-timing-function')
			).toBe('steps(140, end)')
		})

		it('falls back to the default scrollamount for negative values', async () => {
			const marquee = await createMarquee({ scrollamount: '-1' })

			expect(
				marquee.style.getPropertyValue('--animation-timing-function')
			).toBe('steps(24, end)')
		})

		it('falls back to the default scrolldelay for negative values', async () => {
			const marquee = await createMarquee({ scrolldelay: '-1' })

			expect(marquee.style.getPropertyValue('--animation-duration')).toBe(
				'2040ms'
			)
		})

		it('preserves valid low scrolldelay values with truespeed', async () => {
			const marquee = await createMarquee({
				scrolldelay: '20',
				truespeed: '',
			})

			expect(marquee.style.getPropertyValue('--animation-duration')).toBe(
				'480ms'
			)
		})
	})
})
