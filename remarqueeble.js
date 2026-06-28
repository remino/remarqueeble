const DEFAULT_DIRECTION = 'left'
const DEFAULT_BEHAVIOR = 'scroll'
const DEFAULT_SCROLL_AMOUNT = 6
const DEFAULT_SCROLL_DELAY = 85
const MIN_SCROLL_DELAY = 60
const DEFAULT_VERTICAL_HEIGHT = '200px'
const DEFAULT_HOST_WIDTH = 'calc(100% - (var(--attr-hspace, 0px) * 2))'
const ATTR_DIRECTION = 'direction'
const ATTR_BEHAVIOR = 'behavior'
const ATTR_SCROLL_AMOUNT = 'scrollamount'
const ATTR_SCROLL_DELAY = 'scrolldelay'
const ATTR_TRUE_SPEED = 'truespeed'
const ATTR_LOOP = 'loop'
const ATTR_BG_COLOR = 'bgcolor'
const ATTR_WIDTH = 'width'
const ATTR_HEIGHT = 'height'
const ATTR_HSPACE = 'hspace'
const ATTR_VSPACE = 'vspace'
const CSS_VAR_WIDTH = '--attr-width'
const CSS_VAR_HEIGHT = '--attr-height'
const CSS_VAR_HSPACE = '--attr-hspace'
const CSS_VAR_VSPACE = '--attr-vspace'
const CSS_VAR_BG_COLOR = '--attr-bgcolor'
const ATTRIBUTE_HINTS = [
	{
		attribute: ATTR_WIDTH,
		cssVar: CSS_VAR_WIDTH,
		parser: parsePresentationalDimension,
	},
	{
		attribute: ATTR_HEIGHT,
		cssVar: CSS_VAR_HEIGHT,
		parser: parsePresentationalDimension,
		fallback(element) {
			return element.isVerticalDirection && !element.hasAttribute(ATTR_HEIGHT)
				? DEFAULT_VERTICAL_HEIGHT
				: null
		},
	},
	{
		attribute: ATTR_HSPACE,
		cssVar: CSS_VAR_HSPACE,
		parser: parsePresentationalDimension,
	},
	{
		attribute: ATTR_VSPACE,
		cssVar: CSS_VAR_VSPACE,
		parser: parsePresentationalDimension,
	},
	{
		attribute: ATTR_BG_COLOR,
		cssVar: CSS_VAR_BG_COLOR,
		parser: parseLegacyColor,
	},
]

function parsePresentationalDimension(value) {
	if (value == null) return null

	const trimmed = String(value).trim()
	if (!trimmed) return null

	if (/^[+-]?(?:\d+|\d*\.\d+)$/.test(trimmed)) {
		return `${trimmed}px`
	}

	if (
		typeof CSS !== 'undefined' &&
		CSS.supports &&
		CSS.supports('width', trimmed)
	) {
		return trimmed
	}

	return null
}

function parseLegacyColor(value) {
	if (value == null) return null

	const trimmed = String(value).trim()
	if (!trimmed) return null

	if (
		typeof CSS !== 'undefined' &&
		CSS.supports &&
		CSS.supports('background-color', trimmed)
	) {
		return trimmed
	}

	return null
}

class RemarqueebleElement extends HTMLElement {
	static observedAttributes = [
		ATTR_DIRECTION,
		ATTR_BEHAVIOR,
		ATTR_SCROLL_AMOUNT,
		ATTR_SCROLL_DELAY,
		ATTR_TRUE_SPEED,
		ATTR_LOOP,
		ATTR_BG_COLOR,
		ATTR_WIDTH,
		ATTR_HEIGHT,
		ATTR_HSPACE,
		ATTR_VSPACE,
	]

	constructor() {
		super()

		this.attachShadow({ mode: 'open' })

		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          text-align: initial;
          overflow: hidden !important;
          white-space: nowrap;
          width: var(${CSS_VAR_WIDTH}, ${DEFAULT_HOST_WIDTH});
          height: var(${CSS_VAR_HEIGHT}, auto);
          margin-inline: var(${CSS_VAR_HSPACE}, 0px);
          margin-block: var(${CSS_VAR_VSPACE}, 0px);
          background-color: var(${CSS_VAR_BG_COLOR}, transparent);
          box-sizing: border-box;
        }

        :host([direction="up"]),
        :host([direction="down"]) {
          white-space: normal;
        }

        .track {
          display: inline-block;
          will-change: transform;
        }
      </style>

      <span class="track"><slot></slot></span>
    `

		this.track = this.shadowRoot.querySelector('.track')
		this.running = false
		this.position = 0
		this.lastTime = null
		this.loopsDone = 0
		this.forward = true
		this.rafId = null
	}

	connectedCallback() {
		this.running = true
		this.syncPresentationalHints()

		requestAnimationFrame(() => {
			if (!this.isConnected || !this.running) return
			this.reset()
			this.tick()
		})
	}

	disconnectedCallback() {
		this.running = false
		this.lastTime = null

		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId)
			this.rafId = null
		}
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return

		this.syncPresentationalHints()

		if (this.isConnected) {
			this.reset()
		}
	}

	get direction() {
		return this.getAttribute(ATTR_DIRECTION) || DEFAULT_DIRECTION
	}

	get behavior() {
		return this.getAttribute(ATTR_BEHAVIOR) || DEFAULT_BEHAVIOR
	}

	get scrollAmount() {
		const raw = this.getAttribute(ATTR_SCROLL_AMOUNT)
		const value = raw === null || raw.trim() === '' ? NaN : Number(raw)
		return Number.isFinite(value) && value >= 0 ? value : DEFAULT_SCROLL_AMOUNT
	}

	get scrollDelay() {
		const raw = this.getAttribute(ATTR_SCROLL_DELAY)
		const value = raw === null || raw.trim() === '' ? NaN : Number(raw)
		const delay = Number.isFinite(value) && value >= 0 ? value : DEFAULT_SCROLL_DELAY

		if (this.hasAttribute(ATTR_TRUE_SPEED)) return delay
		return Math.max(delay, MIN_SCROLL_DELAY)
	}

	get loop() {
		const value = this.getAttribute(ATTR_LOOP)
		return value === null ? -1 : Number(value)
	}

	get directionSign() {
		return this.direction === 'right' || this.direction === 'down' ? 1 : -1
	}

	get isVerticalDirection() {
		return this.direction === 'up' || this.direction === 'down'
	}

	start() {
		if (this.running) return

		this.running = true
		this.lastTime = null
		this.tick()
	}

	stop() {
		this.running = false

		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId)
			this.rafId = null
		}
	}

	syncPresentationalHints() {
		for (const hint of ATTRIBUTE_HINTS) {
			this.syncVar(hint)
		}
	}

	syncVar(hint) {
		const raw = this.getAttribute(hint.attribute)
		const value = hint.parser(raw)
		const fallback = hint.fallback ? hint.fallback(this) : null

		if (value == null) {
			if (fallback == null) {
				this.style.removeProperty(hint.cssVar)
			} else {
				this.style.setProperty(hint.cssVar, fallback)
			}
			return
		}

		this.style.setProperty(hint.cssVar, value)
	}

	reset() {
		const hostSize = this.getHostSize()
		const trackSize = this.getTrackSize()

		this.loopsDone = 0
		this.forward = true
		this.position = this.getStartPosition(hostSize, trackSize)

		this.render()
	}

	getHostSize() {
		return this.isVerticalDirection ? this.clientHeight : this.clientWidth
	}

	getTrackSize() {
		return this.isVerticalDirection
			? this.track.offsetHeight
			: this.track.offsetWidth
	}

	getStartPosition(hostSize, trackSize) {
		return this.directionSign < 0 ? hostSize : -trackSize
	}

	getEndPosition(hostSize, trackSize) {
		return this.directionSign < 0 ? -trackSize : hostSize
	}

	tick(time = performance.now()) {
		if (!this.running) return

		if (this.lastTime === null) this.lastTime = time

		const elapsed = time - this.lastTime

		if (elapsed >= this.scrollDelay) {
			this.step()
			this.lastTime = time
		}

		this.rafId = requestAnimationFrame(nextTime => this.tick(nextTime))
	}

	step() {
		const hostSize = this.getHostSize()
		const trackSize = this.getTrackSize()
		const startPosition = this.getStartPosition(hostSize, trackSize)
		const endPosition = this.getEndPosition(hostSize, trackSize)
		const amount = this.scrollAmount
		const delta = this.directionSign * amount

		if (this.behavior === 'alternate') {
			this.position += this.forward ? delta : -delta

			if (this.forward) {
				if (
					(this.directionSign < 0 && this.position <= endPosition) ||
					(this.directionSign > 0 && this.position >= endPosition)
				) {
					this.position = endPosition
					this.forward = false
					this.countLoop()
				}
			} else if (
				(this.directionSign < 0 && this.position >= startPosition) ||
				(this.directionSign > 0 && this.position <= startPosition)
			) {
				this.position = startPosition
				this.forward = true
				this.countLoop()
			}
		} else {
			this.position += delta

			if (
				(this.directionSign < 0 && this.position <= endPosition) ||
				(this.directionSign > 0 && this.position >= endPosition)
			) {
				this.position = startPosition
				this.countLoop()
			}
		}

		this.render()
	}

	countLoop() {
		this.loopsDone++

		if (this.loop > 0 && this.loopsDone >= this.loop) {
			this.stop()
		}
	}

	render() {
		if (this.isVerticalDirection) {
			this.track.style.transform = `translateY(${this.position}px)`
		} else {
			this.track.style.transform = `translateX(${this.position}px)`
		}
	}
}

if (!customElements.get('re-marquee')) {
	customElements.define('re-marquee', RemarqueebleElement)
}

if (!customElements.get('re-marquee-ble')) {
	customElements.define('re-marquee-ble', RemarqueebleElement)
}
