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
const HTMLElementBase = globalThis.HTMLElement ?? (class {} as typeof HTMLElement)

export const parsePresentationalDimension = (
	value: string | null
): string | null => {
	if (value === null) return null

	const trimmed = value.trim()
	if (trimmed === '') return null

	if (/^[+-]?(?:\d+|\d*\.\d+)$/.test(trimmed)) {
		return `${trimmed}px`
	}

	return globalThis.CSS?.supports('width', trimmed) ? trimmed : null
}

export const parseLegacyColor = (value: string | null): string | null => {
	if (value === null) return null

	const trimmed = value.trim()
	if (trimmed === '') return null

	return globalThis.CSS?.supports('background-color', trimmed) ? trimmed : null
}

type PresentationalHint = {
	attribute: string
	cssVar: string
	parser: (value: string | null) => string | null
	fallback?: (element: RemarqueebleElement) => string | null
}

const ATTRIBUTE_HINTS: PresentationalHint[] = [
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

export class RemarqueebleElement extends HTMLElementBase {
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

	private readonly track: HTMLElement
	private running = false
	private position = 0
	private lastTime: number | null = null
	private loopsDone = 0
	private forward = true
	private rafId: number | null = null

	constructor() {
		super()

		const shadowRoot = this.attachShadow({ mode: 'open' })

		shadowRoot.innerHTML = `
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

		const track = shadowRoot.querySelector<HTMLElement>('.track')
		if (!track) throw new Error('Remarqueeble track element was not created.')

		this.track = track
	}

	connectedCallback(): void {
		this.running = true
		this.syncPresentationalHints()

		requestAnimationFrame(() => {
			if (!this.isConnected || !this.running) return
			this.reset()
			this.tick()
		})
	}

	disconnectedCallback(): void {
		this.running = false
		this.lastTime = null

		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId)
			this.rafId = null
		}
	}

	attributeChangedCallback(
		_name: string,
		oldValue: string | null,
		newValue: string | null
	): void {
		if (oldValue === newValue) return

		this.syncPresentationalHints()

		if (this.isConnected) {
			this.reset()
		}
	}

	get direction(): string {
		return this.getAttribute(ATTR_DIRECTION) || DEFAULT_DIRECTION
	}

	get behavior(): string {
		return this.getAttribute(ATTR_BEHAVIOR) || DEFAULT_BEHAVIOR
	}

	get scrollAmount(): number {
		const raw = this.getAttribute(ATTR_SCROLL_AMOUNT)
		const value = raw === null || raw.trim() === '' ? NaN : Number(raw)
		return Number.isFinite(value) && value >= 0 ? value : DEFAULT_SCROLL_AMOUNT
	}

	get scrollDelay(): number {
		const raw = this.getAttribute(ATTR_SCROLL_DELAY)
		const value = raw === null || raw.trim() === '' ? NaN : Number(raw)
		const delay =
			Number.isFinite(value) && value >= 0 ? value : DEFAULT_SCROLL_DELAY

		if (this.hasAttribute(ATTR_TRUE_SPEED)) return delay
		return Math.max(delay, MIN_SCROLL_DELAY)
	}

	get loop(): number {
		const value = this.getAttribute(ATTR_LOOP)
		return value === null ? -1 : Number(value)
	}

	get directionSign(): number {
		return this.direction === 'right' || this.direction === 'down' ? 1 : -1
	}

	get isVerticalDirection(): boolean {
		return this.direction === 'up' || this.direction === 'down'
	}

	start(): void {
		if (this.running) return

		this.running = true
		this.lastTime = null
		this.tick()
	}

	stop(): void {
		this.running = false

		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId)
			this.rafId = null
		}
	}

	private syncPresentationalHints(): void {
		for (const hint of ATTRIBUTE_HINTS) {
			this.syncVar(hint)
		}
	}

	private syncVar(hint: PresentationalHint): void {
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

	private reset(): void {
		const hostSize = this.getHostSize()
		const trackSize = this.getTrackSize()

		this.loopsDone = 0
		this.forward = true
		this.position =
			this.behavior === 'alternate'
				? this.getAlternateStartPosition(hostSize, trackSize)
				: this.getStartPosition(hostSize, trackSize)

		this.render()
	}

	private getHostSize(): number {
		return this.isVerticalDirection ? this.clientHeight : this.clientWidth
	}

	private getTrackSize(): number {
		return this.isVerticalDirection
			? this.track.offsetHeight
			: this.track.offsetWidth
	}

	private getStartPosition(hostSize: number, trackSize: number): number {
		return this.directionSign < 0 ? hostSize : -trackSize
	}

	private getFlushEndPosition(hostSize: number, trackSize: number): number {
		return this.directionSign < 0 ? 0 : hostSize - trackSize
	}

	private getOffEndPosition(hostSize: number, trackSize: number): number {
		return this.directionSign < 0 ? -trackSize : hostSize
	}

	private getSlideEndPosition(hostSize: number, trackSize: number): number {
		return this.directionSign < 0 ? 0 : hostSize - trackSize
	}

	private getAlternateStartPosition(
		hostSize: number,
		trackSize: number
	): number {
		return this.directionSign < 0 ? hostSize - trackSize : 0
	}

	private tick(time = performance.now()): void {
		if (!this.running) return

		if (this.lastTime === null) this.lastTime = time

		const elapsed = time - this.lastTime

		if (elapsed >= this.scrollDelay) {
			this.step()
			this.lastTime = time
		}

		if (!this.running) return

		this.rafId = requestAnimationFrame(nextTime => this.tick(nextTime))
	}

	private step(): void {
		const hostSize = this.getHostSize()
		const trackSize = this.getTrackSize()
		const startPosition = this.getStartPosition(hostSize, trackSize)
		const flushEndPosition = this.getFlushEndPosition(hostSize, trackSize)
		const offEndPosition = this.getOffEndPosition(hostSize, trackSize)
		const slideEndPosition = this.getSlideEndPosition(hostSize, trackSize)
		const alternateStartPosition = this.getAlternateStartPosition(
			hostSize,
			trackSize
		)
		const amount = this.scrollAmount
		const delta = this.directionSign * amount

		if (this.behavior === 'alternate') {
			this.position += this.forward ? delta : -delta

			if (this.forward) {
				if (
					(this.directionSign < 0 && this.position <= flushEndPosition) ||
					(this.directionSign > 0 && this.position >= flushEndPosition)
				) {
					this.position = flushEndPosition
					this.forward = false
					this.incrementLoopCount()

					if (this.shouldStopAfterLoop()) {
						this.stop()
					}
				}
			} else if (
				(this.directionSign < 0 && this.position >= alternateStartPosition) ||
				(this.directionSign > 0 && this.position <= alternateStartPosition)
			) {
				this.position = alternateStartPosition
				this.forward = true
				this.incrementLoopCount()

				if (this.shouldStopAfterLoop()) {
					this.stop()
				}
			}
		} else if (this.behavior === 'slide') {
			this.position += delta

			if (
				(this.directionSign < 0 && this.position <= slideEndPosition) ||
				(this.directionSign > 0 && this.position >= slideEndPosition)
			) {
				this.position = slideEndPosition
				this.incrementLoopCount()

				if (!this.hasAttribute(ATTR_LOOP) || this.loop <= 0) {
					this.stop()
				} else if (this.shouldStopAfterLoop()) {
					this.stop()
				} else {
					this.position = startPosition
				}
			}
		} else {
			this.position += delta

			if (
				(this.directionSign < 0 && this.position <= offEndPosition) ||
				(this.directionSign > 0 && this.position >= offEndPosition)
			) {
				this.position = startPosition
				this.incrementLoopCount()

				if (this.shouldStopAfterLoop()) {
					this.stop()
				}
			}
		}

		this.render()
	}

	private incrementLoopCount(): void {
		this.loopsDone++
	}

	private shouldStopAfterLoop(): boolean {
		return (
			this.hasAttribute(ATTR_LOOP) &&
			this.loop > 0 &&
			this.loopsDone >= this.loop
		)
	}

	private render(): void {
		if (this.isVerticalDirection) {
			this.track.style.transform = `translateY(${this.position}px)`
		} else {
			this.track.style.transform = `translateX(${this.position}px)`
		}
	}
}

export const defineRemarqueebleElements = (): void => {
	if (typeof customElements === 'undefined') return

	if (!customElements.get('re-marquee')) {
		customElements.define('re-marquee', RemarqueebleElement)
	}

	if (!customElements.get('re-marquee-ble')) {
		customElements.define('re-marquee-ble', RemarqueebleElement)
	}
}

declare global {
	interface HTMLElementTagNameMap {
		're-marquee': RemarqueebleElement
		're-marquee-ble': RemarqueebleElement
	}
}
