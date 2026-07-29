const DEFAULT_DIRECTION = 'left'
const DEFAULT_BEHAVIOR = 'scroll'
const DEFAULT_ANIMATE = 'always'
const DEFAULT_SCROLL_AMOUNT = 6
const DEFAULT_SCROLL_AMOUNT_LENGTH = `${DEFAULT_SCROLL_AMOUNT}px`
const DEFAULT_SCROLL_DELAY = 85
const MIN_SCROLL_DELAY = 60
const DEFAULT_VERTICAL_HEIGHT = '200px'
const DEFAULT_HOST_WIDTH = 'calc(100% - (var(--attr-hspace, 0px) * 2))'
const ATTR_DIRECTION = 'direction'
const ATTR_BEHAVIOR = 'behavior'
const ATTR_ANIMATE = 'animate'
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
const CSS_VAR_ANIMATION_DURATION = '--animation-duration'
const CSS_VAR_ANIMATION_DIRECTION = '--animation-direction'
const CSS_VAR_ANIMATION_ITERATION_COUNT = '--animation-iteration-count'
const CSS_VAR_ANIMATION_PLAY_STATE = '--animation-play-state'
const CSS_VAR_ANIMATION_TIMING_FUNCTION = '--animation-timing-function'
const CSS_VAR_CURRENT_X = '--translate-current-x'
const CSS_VAR_CURRENT_Y = '--translate-current-y'
const CSS_VAR_TRANSLATE_X_END = '--translate-x-end'
const CSS_VAR_TRANSLATE_X_START = '--translate-x-start'
const CSS_VAR_TRANSLATE_Y_END = '--translate-y-end'
const CSS_VAR_TRANSLATE_Y_START = '--translate-y-start'
const HTMLElementBase =
	globalThis.HTMLElement ?? (class {} as typeof HTMLElement)

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

export const parseScrollAmount = (value: string | null): string | null => {
	if (value === null) return null

	const trimmed = value.trim()
	if (trimmed === '') return null

	if (/^[+-]?(?:\d+|\d*\.\d+)$/.test(trimmed)) {
		return Number(trimmed) >= 0 ? `${trimmed}px` : null
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

type GeometryState = {
	canAnimate: boolean
	duration: number
	endPosition: number
	hostSize: number
	iterationCount: string
	startPosition: number
	stepDelta: number
	steps: number
	trackSize: number
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
		ATTR_ANIMATE,
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
	private readonly scrollAmountProbe: HTMLElement
	private tickInterval: ReturnType<typeof setInterval> | null = null
	private currentPosition = 0
	private currentStepDelta = 0
	private completedIterations = 0
	private hasPosition = false
	private running = false

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
					transform: translate(
						var(${CSS_VAR_CURRENT_X}, 0px),
						var(${CSS_VAR_CURRENT_Y}, 0px)
					);
					will-change: transform;
				}

				.scrollamount-probe {
					block-size: 0;
					display: block;
					inline-size: ${DEFAULT_SCROLL_AMOUNT_LENGTH};
					overflow: hidden;
					pointer-events: none;
					position: absolute;
					visibility: hidden;
				}

				@keyframes remarqueeble-motion {
					from {
						transform: translate(
							var(${CSS_VAR_TRANSLATE_X_START}, 100%),
							var(${CSS_VAR_TRANSLATE_Y_START}, 0px)
						);
					}

					to {
						transform: translate(
							var(${CSS_VAR_TRANSLATE_X_END}, -100%),
							var(${CSS_VAR_TRANSLATE_Y_END}, 0px)
						);
					}
				}
			</style>

			<span class="track"><slot></slot></span>
			<span class="scrollamount-probe" aria-hidden="true"></span>
		`

		const track = shadowRoot.querySelector<HTMLElement>('.track')
		if (!track) throw new Error('Remarqueeble track element was not created.')
		const scrollAmountProbe = shadowRoot.querySelector<HTMLElement>(
			'.scrollamount-probe'
		)
		if (!scrollAmountProbe) {
			throw new Error('Remarqueeble scrollamount probe was not created.')
		}

		this.track = track
		this.scrollAmountProbe = scrollAmountProbe
		this.track.addEventListener('animationend', () => this.handleAnimationEnd())
	}

	connectedCallback(): void {
		this.running = true
		this.syncPresentationalHints()

		requestAnimationFrame(() => {
			if (!this.isConnected || !this.running) return
			this.reset()
		})
	}

	disconnectedCallback(): void {
		this.running = false
		this.clearTickInterval()
	}

	attributeChangedCallback(
		_name: string,
		oldValue: string | null,
		newValue: string | null
	): void {
		if (oldValue === newValue) return

		this.syncPresentationalHints()

		if (this.isConnected) {
			this.hasPosition = false
			this.completedIterations = 0
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
		const value =
			parseScrollAmount(this.getAttribute(ATTR_SCROLL_AMOUNT)) ??
			DEFAULT_SCROLL_AMOUNT_LENGTH
		this.scrollAmountProbe.style.inlineSize = value

		const measured = this.scrollAmountProbe.getBoundingClientRect().width
		return Number.isFinite(measured) && measured >= 0
			? measured
			: DEFAULT_SCROLL_AMOUNT
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
		this.reset()
		this.syncAnimationPlayState()
	}

	stop(): void {
		this.running = false
		this.clearTickInterval()
		this.syncAnimationPlayState()
	}

	private syncPresentationalHints(): void {
		for (const hint of ATTRIBUTE_HINTS) {
			this.syncVar(hint)
		}

		this.syncAnimationPlayState()
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
		const geometry = this.syncGeometry()

		this.currentStepDelta = geometry.stepDelta
		this.completedIterations = 0

		if (!geometry.canAnimate) {
			this.syncInactiveState()
			this.ensureTicking()
			return
		}

		this.currentPosition = geometry.startPosition
		this.hasPosition = true

		this.syncActiveState()
		this.applyCurrentPosition()
		this.restartTicking()
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
		if (this.directionSign < 0) {
			return Math.min(0, hostSize - trackSize)
		}

		return Math.max(0, hostSize - trackSize)
	}

	private getAlternateStartPosition(
		hostSize: number,
		trackSize: number
	): number {
		return this.directionSign < 0 ? hostSize - trackSize : 0
	}

	private syncAnimationPlayState(): void {
		this.style.setProperty(
			CSS_VAR_ANIMATION_PLAY_STATE,
			this.running ? 'running' : 'paused'
		)
	}

	private syncGeometry(): GeometryState {
		const hostSize = this.getHostSize()
		const trackSize = this.getTrackSize()
		const canAnimate =
			this.shouldAnimate(hostSize, trackSize) && this.scrollAmount !== 0

		const startPosition =
			this.behavior === 'alternate'
				? this.getAlternateStartPosition(hostSize, trackSize)
				: this.getStartPosition(hostSize, trackSize)
		const endPosition =
			this.behavior === 'slide'
				? this.getSlideEndPosition(hostSize, trackSize)
				: this.behavior === 'alternate'
					? this.getFlushEndPosition(hostSize, trackSize)
					: this.getOffEndPosition(hostSize, trackSize)
		const distance = Math.abs(endPosition - startPosition)
		const steps = Math.max(
			1,
			Math.ceil(distance / Math.max(1, this.scrollAmount))
		)
		const duration = Math.max(1, steps * this.scrollDelay)
		const iterationCount = this.getCssIterationCount()
		const stepDelta =
			this.directionSign < 0 ? -this.scrollAmount : this.scrollAmount

		this.style.setProperty(CSS_VAR_ANIMATION_DURATION, `${duration}ms`)
		this.style.setProperty(
			CSS_VAR_ANIMATION_DIRECTION,
			this.behavior === 'alternate' ? 'alternate' : 'normal'
		)
		this.style.setProperty(CSS_VAR_ANIMATION_ITERATION_COUNT, iterationCount)
		this.style.setProperty(
			CSS_VAR_ANIMATION_TIMING_FUNCTION,
			`steps(${steps}, end)`
		)

		if (this.isVerticalDirection) {
			this.style.setProperty(CSS_VAR_TRANSLATE_X_START, '0px')
			this.style.setProperty(CSS_VAR_TRANSLATE_X_END, '0px')
			this.style.setProperty(CSS_VAR_TRANSLATE_Y_START, `${startPosition}px`)
			this.style.setProperty(CSS_VAR_TRANSLATE_Y_END, `${endPosition}px`)
		} else {
			this.style.setProperty(CSS_VAR_TRANSLATE_X_START, `${startPosition}px`)
			this.style.setProperty(CSS_VAR_TRANSLATE_X_END, `${endPosition}px`)
			this.style.setProperty(CSS_VAR_TRANSLATE_Y_START, '0px')
			this.style.setProperty(CSS_VAR_TRANSLATE_Y_END, '0px')
		}

		return {
			canAnimate,
			duration,
			endPosition,
			hostSize,
			iterationCount,
			startPosition,
			stepDelta,
			steps,
			trackSize,
		}
	}

	private shouldAnimate(hostSize: number, trackSize: number): boolean {
		if (this.animationMode === 'never') return false
		if (this.animationMode === 'overflow') return trackSize > hostSize
		return true
	}

	private get animationMode(): string {
		const value = this.getAttribute(ATTR_ANIMATE)
		if (value === 'overflow' || value === 'never') return value
		return DEFAULT_ANIMATE
	}

	private syncStaticAnimation(): void {
		this.clearTickInterval()
		this.track.style.removeProperty('transform')
		this.style.setProperty(CSS_VAR_ANIMATION_DURATION, '0ms')
		this.style.setProperty(CSS_VAR_ANIMATION_DIRECTION, 'normal')
		this.style.setProperty(CSS_VAR_ANIMATION_ITERATION_COUNT, '1')
		this.style.setProperty(CSS_VAR_ANIMATION_TIMING_FUNCTION, 'linear')
		this.style.setProperty(CSS_VAR_TRANSLATE_X_START, '0px')
		this.style.setProperty(CSS_VAR_TRANSLATE_X_END, '0px')
		this.style.setProperty(CSS_VAR_TRANSLATE_Y_START, '0px')
		this.style.setProperty(CSS_VAR_TRANSLATE_Y_END, '0px')

		this.style.setProperty(CSS_VAR_CURRENT_X, '0px')
		this.style.setProperty(CSS_VAR_CURRENT_Y, '0px')
		this.track.style.animationName = 'none'
		this.track.style.transform = 'translate(0px, 0px)'
		this.currentPosition = 0
		this.currentStepDelta = 0
		this.hasPosition = false
	}

	private getCssIterationCount(): string {
		if (this.behavior === 'slide' && !this.hasAttribute(ATTR_LOOP)) return '1'
		if (!this.hasAttribute(ATTR_LOOP)) return 'infinite'
		if (Number.isFinite(this.loop) && this.loop > 0) return String(this.loop)
		return 'infinite'
	}

	private handleAnimationEnd(): void {
		if (!this.hasFiniteAnimation()) return

		this.running = false
		this.syncAnimationPlayState()
	}

	private clearTickInterval(): void {
		if (this.tickInterval === null) return

		clearInterval(this.tickInterval)
		this.tickInterval = null
	}

	private hasFiniteAnimation(): boolean {
		if (this.behavior === 'slide' && !this.hasAttribute(ATTR_LOOP)) return true

		return (
			this.hasAttribute(ATTR_LOOP) &&
			Number.isFinite(this.loop) &&
			this.loop > 0
		)
	}

	private ensureTicking(): void {
		if (!this.running || this.tickInterval !== null) return

		this.tickInterval = setInterval(() => {
			this.tick()
		}, this.scrollDelay)
	}

	private restartTicking(): void {
		this.clearTickInterval()
		this.ensureTicking()
	}

	private tick(): void {
		if (!this.running) return

		const geometry = this.syncGeometry()

		if (!geometry.canAnimate) {
			this.syncInactiveState()
			return
		}

		this.syncActiveState()

		if (!this.hasPosition) {
			this.currentStepDelta = geometry.stepDelta
			this.currentPosition = geometry.startPosition
			this.completedIterations = 0
			this.hasPosition = true
		} else {
			if (this.behavior === 'alternate') {
				const sign = Math.sign(this.currentStepDelta || geometry.stepDelta) || 1
				this.currentStepDelta = Math.abs(geometry.stepDelta) * sign
			} else {
				this.currentStepDelta = geometry.stepDelta
			}

			this.clampCurrentPosition(geometry)
		}

		if (this.behavior === 'alternate') {
			this.stepAlternate(geometry.hostSize, geometry.trackSize)
		} else {
			this.stepLinear(geometry.hostSize, geometry.trackSize)
		}

		this.applyCurrentPosition()

		if (!this.running) {
			this.clearTickInterval()
			this.syncAnimationPlayState()
			return
		}
	}

	private stepLinear(hostSize: number, trackSize: number): void {
		const startPosition = this.getStartPosition(hostSize, trackSize)
		const endPosition =
			this.behavior === 'slide'
				? this.getSlideEndPosition(hostSize, trackSize)
				: this.getOffEndPosition(hostSize, trackSize)
		const nextPosition = this.currentPosition + this.currentStepDelta

		if (this.directionSign < 0) {
			if (nextPosition > endPosition) {
				this.currentPosition = nextPosition
				return
			}

			const overflow = endPosition - nextPosition
			this.completedIterations += 1

			if (this.hasCompletedIterations()) {
				this.currentPosition = endPosition
				this.running = false
				return
			}

			this.currentPosition =
				this.behavior === 'slide' ? startPosition : startPosition - overflow
			return
		}

		if (nextPosition < endPosition) {
			this.currentPosition = nextPosition
			return
		}

		const overflow = nextPosition - endPosition
		this.completedIterations += 1

		if (this.hasCompletedIterations()) {
			this.currentPosition = endPosition
			this.running = false
			return
		}

		this.currentPosition =
			this.behavior === 'slide' ? startPosition : startPosition + overflow
	}

	private stepAlternate(hostSize: number, trackSize: number): void {
		const minPosition = Math.min(
			this.getAlternateStartPosition(hostSize, trackSize),
			this.getFlushEndPosition(hostSize, trackSize)
		)
		const maxPosition = Math.max(
			this.getAlternateStartPosition(hostSize, trackSize),
			this.getFlushEndPosition(hostSize, trackSize)
		)
		let nextPosition = this.currentPosition + this.currentStepDelta

		while (nextPosition < minPosition || nextPosition > maxPosition) {
			if (nextPosition < minPosition) {
				const overflow = minPosition - nextPosition
				nextPosition = minPosition + overflow
			} else {
				const overflow = nextPosition - maxPosition
				nextPosition = maxPosition - overflow
			}

			this.currentStepDelta *= -1
			this.completedIterations += 1

			if (this.hasCompletedIterations()) {
				this.currentPosition =
					this.currentStepDelta > 0 ? minPosition : maxPosition
				this.running = false
				return
			}
		}

		this.currentPosition = nextPosition
	}

	private hasCompletedIterations(): boolean {
		return (
			this.hasFiniteAnimation() &&
			this.completedIterations >= Math.max(1, this.loop)
		)
	}

	private syncInactiveState(): void {
		this.track.style.removeProperty('transform')
		this.track.style.animationName = 'none'
		this.track.style.transform = 'translate(0px, 0px)'
		this.style.setProperty(CSS_VAR_CURRENT_X, '0px')
		this.style.setProperty(CSS_VAR_CURRENT_Y, '0px')
		this.style.setProperty(CSS_VAR_ANIMATION_DURATION, '0ms')
		this.style.setProperty(CSS_VAR_ANIMATION_DIRECTION, 'normal')
		this.style.setProperty(CSS_VAR_ANIMATION_ITERATION_COUNT, '1')
		this.style.setProperty(CSS_VAR_ANIMATION_TIMING_FUNCTION, 'linear')
		this.currentPosition = 0
		this.currentStepDelta = 0
		this.completedIterations = 0
		this.hasPosition = false
	}

	private syncActiveState(): void {
		this.track.style.animationName = ''
		this.track.style.transform = ''
	}

	private clampCurrentPosition(geometry: GeometryState): void {
		if (this.behavior === 'alternate') {
			const minPosition = Math.min(geometry.startPosition, geometry.endPosition)
			const maxPosition = Math.max(geometry.startPosition, geometry.endPosition)
			this.currentPosition = Math.min(
				maxPosition,
				Math.max(minPosition, this.currentPosition)
			)
			return
		}

		if (this.behavior === 'slide') {
			const minPosition = Math.min(geometry.startPosition, geometry.endPosition)
			const maxPosition = Math.max(geometry.startPosition, geometry.endPosition)
			this.currentPosition = Math.min(
				maxPosition,
				Math.max(minPosition, this.currentPosition)
			)
		}
	}

	private applyCurrentPosition(): void {
		if (this.isVerticalDirection) {
			this.style.setProperty(CSS_VAR_CURRENT_X, '0px')
			this.style.setProperty(CSS_VAR_CURRENT_Y, `${this.currentPosition}px`)
			return
		}

		this.style.setProperty(CSS_VAR_CURRENT_X, `${this.currentPosition}px`)
		this.style.setProperty(CSS_VAR_CURRENT_Y, '0px')
	}
}

class ReMarqueeElement extends RemarqueebleElement {}

class ReMarqueeBleElement extends RemarqueebleElement {}

export const defineRemarqueebleElements = (): void => {
	if (typeof customElements === 'undefined') return

	if (!customElements.get('re-marquee')) {
		customElements.define('re-marquee', ReMarqueeElement)
	}

	if (!customElements.get('re-marquee-ble')) {
		customElements.define('re-marquee-ble', ReMarqueeBleElement)
	}
}

declare global {
	interface HTMLElementTagNameMap {
		're-marquee': RemarqueebleElement
		're-marquee-ble': RemarqueebleElement
	}
}
