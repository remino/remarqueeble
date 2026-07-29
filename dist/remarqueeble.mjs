/*! remarqueeble v0.6.0 | (c) 2026 Rémino Rem <https://remino.net/> | ISC Licence */
//#region src/lib/remarqueeble.ts
var DEFAULT_DIRECTION = "left";
var DEFAULT_BEHAVIOR = "scroll";
var DEFAULT_ANIMATE = "always";
var DEFAULT_SCROLL_AMOUNT = 6;
var DEFAULT_SCROLL_AMOUNT_LENGTH = `${DEFAULT_SCROLL_AMOUNT}px`;
var DEFAULT_SCROLL_DELAY = 85;
var MIN_SCROLL_DELAY = 60;
var DEFAULT_VERTICAL_HEIGHT = "200px";
var DEFAULT_HOST_WIDTH = "calc(100% - (var(--attr-hspace, 0px) * 2))";
var ATTR_DIRECTION = "direction";
var ATTR_BEHAVIOR = "behavior";
var ATTR_ANIMATE = "animate";
var ATTR_SCROLL_AMOUNT = "scrollamount";
var ATTR_SCROLL_DELAY = "scrolldelay";
var ATTR_TRUE_SPEED = "truespeed";
var ATTR_LOOP = "loop";
var ATTR_BG_COLOR = "bgcolor";
var ATTR_WIDTH = "width";
var ATTR_HEIGHT = "height";
var ATTR_HSPACE = "hspace";
var ATTR_VSPACE = "vspace";
var CSS_VAR_WIDTH = "--attr-width";
var CSS_VAR_HEIGHT = "--attr-height";
var CSS_VAR_HSPACE = "--attr-hspace";
var CSS_VAR_VSPACE = "--attr-vspace";
var CSS_VAR_BG_COLOR = "--attr-bgcolor";
var HTMLElementBase = globalThis.HTMLElement ?? class {};
var parsePresentationalDimension = (value) => {
	if (value === null) return null;
	const trimmed = value.trim();
	if (trimmed === "") return null;
	if (/^[+-]?(?:\d+|\d*\.\d+)$/.test(trimmed)) return `${trimmed}px`;
	return globalThis.CSS?.supports("width", trimmed) ? trimmed : null;
};
var parseScrollAmount = (value) => {
	if (value === null) return null;
	const trimmed = value.trim();
	if (trimmed === "") return null;
	if (/^[+-]?(?:\d+|\d*\.\d+)$/.test(trimmed)) return Number(trimmed) >= 0 ? `${trimmed}px` : null;
	return globalThis.CSS?.supports("width", trimmed) ? trimmed : null;
};
var parseLegacyColor = (value) => {
	if (value === null) return null;
	const trimmed = value.trim();
	if (trimmed === "") return null;
	return globalThis.CSS?.supports("background-color", trimmed) ? trimmed : null;
};
var ATTRIBUTE_HINTS = [
	{
		attribute: ATTR_WIDTH,
		cssVar: CSS_VAR_WIDTH,
		parser: parsePresentationalDimension
	},
	{
		attribute: ATTR_HEIGHT,
		cssVar: CSS_VAR_HEIGHT,
		parser: parsePresentationalDimension,
		fallback(element) {
			return element.isVerticalDirection && !element.hasAttribute(ATTR_HEIGHT) ? DEFAULT_VERTICAL_HEIGHT : null;
		}
	},
	{
		attribute: ATTR_HSPACE,
		cssVar: CSS_VAR_HSPACE,
		parser: parsePresentationalDimension
	},
	{
		attribute: ATTR_VSPACE,
		cssVar: CSS_VAR_VSPACE,
		parser: parsePresentationalDimension
	},
	{
		attribute: ATTR_BG_COLOR,
		cssVar: CSS_VAR_BG_COLOR,
		parser: parseLegacyColor
	}
];
var RemarqueebleElement = class extends HTMLElementBase {
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
		ATTR_VSPACE
	];
	track;
	scrollAmountProbe;
	tickInterval = null;
	currentPosition = 0;
	currentStepDelta = 0;
	completedIterations = 0;
	hasPosition = false;
	running = false;
	constructor() {
		super();
		const shadowRoot = this.attachShadow({ mode: "open" });
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
					transform: translate(0px, 0px);
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

			</style>

			<span class="track"><slot></slot></span>
			<span class="scrollamount-probe" aria-hidden="true"></span>
		`;
		const track = shadowRoot.querySelector(".track");
		if (!track) throw new Error("Remarqueeble track element was not created.");
		const scrollAmountProbe = shadowRoot.querySelector(".scrollamount-probe");
		if (!scrollAmountProbe) throw new Error("Remarqueeble scrollamount probe was not created.");
		this.track = track;
		this.scrollAmountProbe = scrollAmountProbe;
	}
	connectedCallback() {
		this.running = true;
		this.syncPresentationalHints();
		requestAnimationFrame(() => {
			if (!this.isConnected || !this.running) return;
			this.reset();
		});
	}
	disconnectedCallback() {
		this.running = false;
		this.clearTickInterval();
	}
	attributeChangedCallback(_name, oldValue, newValue) {
		if (oldValue === newValue) return;
		this.syncPresentationalHints();
		if (this.isConnected) {
			this.hasPosition = false;
			this.completedIterations = 0;
			this.reset();
		}
	}
	get direction() {
		return this.getAttribute(ATTR_DIRECTION) || DEFAULT_DIRECTION;
	}
	get behavior() {
		return this.getAttribute(ATTR_BEHAVIOR) || DEFAULT_BEHAVIOR;
	}
	get scrollAmount() {
		const value = parseScrollAmount(this.getAttribute(ATTR_SCROLL_AMOUNT)) ?? DEFAULT_SCROLL_AMOUNT_LENGTH;
		this.scrollAmountProbe.style.inlineSize = value;
		const measured = this.scrollAmountProbe.getBoundingClientRect().width;
		return Number.isFinite(measured) && measured >= 0 ? measured : DEFAULT_SCROLL_AMOUNT;
	}
	get scrollDelay() {
		const raw = this.getAttribute(ATTR_SCROLL_DELAY);
		const value = raw === null || raw.trim() === "" ? NaN : Number(raw);
		const delay = Number.isFinite(value) && value >= 0 ? value : DEFAULT_SCROLL_DELAY;
		if (this.hasAttribute(ATTR_TRUE_SPEED)) return delay;
		return Math.max(delay, MIN_SCROLL_DELAY);
	}
	get loop() {
		const value = this.getAttribute(ATTR_LOOP);
		return value === null ? -1 : Number(value);
	}
	get directionSign() {
		return this.direction === "right" || this.direction === "down" ? 1 : -1;
	}
	get isVerticalDirection() {
		return this.direction === "up" || this.direction === "down";
	}
	start() {
		if (this.running) return;
		this.running = true;
		this.reset();
	}
	stop() {
		this.running = false;
		this.clearTickInterval();
	}
	syncPresentationalHints() {
		for (const hint of ATTRIBUTE_HINTS) this.syncVar(hint);
	}
	syncVar(hint) {
		const raw = this.getAttribute(hint.attribute);
		const value = hint.parser(raw);
		const fallback = hint.fallback ? hint.fallback(this) : null;
		if (value == null) {
			if (fallback == null) this.style.removeProperty(hint.cssVar);
			else this.style.setProperty(hint.cssVar, fallback);
			return;
		}
		this.style.setProperty(hint.cssVar, value);
	}
	reset() {
		const geometry = this.syncGeometry();
		this.currentStepDelta = geometry.stepDelta;
		this.completedIterations = 0;
		if (!geometry.canAnimate) {
			this.syncInactiveState();
			this.ensureTicking();
			return;
		}
		this.currentPosition = geometry.startPosition;
		this.hasPosition = true;
		this.syncActiveState();
		this.applyCurrentPosition();
		this.emitLegacyEvent("start");
		this.restartTicking();
	}
	getHostSize() {
		return this.isVerticalDirection ? this.clientHeight : this.clientWidth;
	}
	getTrackSize() {
		return this.isVerticalDirection ? this.track.offsetHeight : this.track.offsetWidth;
	}
	getStartPosition(hostSize, trackSize) {
		return this.directionSign < 0 ? hostSize : -trackSize;
	}
	getFlushEndPosition(hostSize, trackSize) {
		return this.directionSign < 0 ? 0 : hostSize - trackSize;
	}
	getOffEndPosition(hostSize, trackSize) {
		return this.directionSign < 0 ? -trackSize : hostSize;
	}
	getSlideEndPosition(hostSize, trackSize) {
		if (this.directionSign < 0) return Math.min(0, hostSize - trackSize);
		return Math.max(0, hostSize - trackSize);
	}
	getAlternateStartPosition(hostSize, trackSize) {
		return this.directionSign < 0 ? hostSize - trackSize : 0;
	}
	syncGeometry() {
		const hostSize = this.getHostSize();
		const trackSize = this.getTrackSize();
		const canAnimate = this.shouldAnimate(hostSize, trackSize) && this.scrollAmount !== 0;
		const startPosition = this.behavior === "alternate" ? this.getAlternateStartPosition(hostSize, trackSize) : this.getStartPosition(hostSize, trackSize);
		const endPosition = this.behavior === "slide" ? this.getSlideEndPosition(hostSize, trackSize) : this.behavior === "alternate" ? this.getFlushEndPosition(hostSize, trackSize) : this.getOffEndPosition(hostSize, trackSize);
		Math.abs(endPosition - startPosition);
		return {
			canAnimate,
			endPosition,
			hostSize,
			startPosition,
			stepDelta: this.directionSign < 0 ? -this.scrollAmount : this.scrollAmount,
			trackSize
		};
	}
	shouldAnimate(hostSize, trackSize) {
		if (this.animationMode === "never") return false;
		if (this.animationMode === "overflow") return trackSize > hostSize;
		return true;
	}
	get animationMode() {
		const value = this.getAttribute(ATTR_ANIMATE);
		if (value === "overflow" || value === "never") return value;
		return DEFAULT_ANIMATE;
	}
	clearTickInterval() {
		if (this.tickInterval === null) return;
		clearInterval(this.tickInterval);
		this.tickInterval = null;
	}
	hasFiniteAnimation() {
		if (this.behavior === "slide" && !this.hasAttribute(ATTR_LOOP)) return true;
		return this.hasAttribute(ATTR_LOOP) && Number.isFinite(this.loop) && this.loop > 0;
	}
	ensureTicking() {
		if (!this.running || this.tickInterval !== null) return;
		this.tickInterval = setInterval(() => {
			this.tick();
		}, this.scrollDelay);
	}
	restartTicking() {
		this.clearTickInterval();
		this.ensureTicking();
	}
	tick() {
		if (!this.running) return;
		const geometry = this.syncGeometry();
		if (!geometry.canAnimate) {
			this.syncInactiveState();
			return;
		}
		this.syncActiveState();
		if (!this.hasPosition) {
			this.currentStepDelta = geometry.stepDelta;
			this.currentPosition = geometry.startPosition;
			this.completedIterations = 0;
			this.hasPosition = true;
			this.emitLegacyEvent("start");
		} else {
			if (this.behavior === "alternate") {
				const sign = Math.sign(this.currentStepDelta || geometry.stepDelta) || 1;
				this.currentStepDelta = Math.abs(geometry.stepDelta) * sign;
			} else this.currentStepDelta = geometry.stepDelta;
			this.clampCurrentPosition(geometry);
		}
		if (this.behavior === "alternate") this.stepAlternate(geometry.hostSize, geometry.trackSize);
		else this.stepLinear(geometry.hostSize, geometry.trackSize);
		this.applyCurrentPosition();
		if (!this.running) {
			this.clearTickInterval();
			return;
		}
	}
	stepLinear(hostSize, trackSize) {
		const startPosition = this.getStartPosition(hostSize, trackSize);
		const endPosition = this.behavior === "slide" ? this.getSlideEndPosition(hostSize, trackSize) : this.getOffEndPosition(hostSize, trackSize);
		const nextPosition = this.currentPosition + this.currentStepDelta;
		if (this.directionSign < 0) {
			if (nextPosition > endPosition) {
				this.currentPosition = nextPosition;
				return;
			}
			const overflow = endPosition - nextPosition;
			this.completedIterations += 1;
			if (this.hasCompletedIterations()) {
				this.completeFiniteAnimation(endPosition);
				return;
			}
			this.currentPosition = this.behavior === "slide" ? startPosition : startPosition - overflow;
			return;
		}
		if (nextPosition < endPosition) {
			this.currentPosition = nextPosition;
			return;
		}
		const overflow = nextPosition - endPosition;
		this.completedIterations += 1;
		if (this.hasCompletedIterations()) {
			this.completeFiniteAnimation(endPosition);
			return;
		}
		this.currentPosition = this.behavior === "slide" ? startPosition : startPosition + overflow;
	}
	stepAlternate(hostSize, trackSize) {
		const minPosition = Math.min(this.getAlternateStartPosition(hostSize, trackSize), this.getFlushEndPosition(hostSize, trackSize));
		const maxPosition = Math.max(this.getAlternateStartPosition(hostSize, trackSize), this.getFlushEndPosition(hostSize, trackSize));
		let nextPosition = this.currentPosition + this.currentStepDelta;
		while (nextPosition < minPosition || nextPosition > maxPosition) {
			if (nextPosition < minPosition) nextPosition = minPosition + (minPosition - nextPosition);
			else nextPosition = maxPosition - (nextPosition - maxPosition);
			this.currentStepDelta *= -1;
			this.completedIterations += 1;
			this.emitLegacyEvent("bounce");
			if (this.hasCompletedIterations()) {
				this.completeFiniteAnimation(this.currentStepDelta > 0 ? minPosition : maxPosition);
				return;
			}
		}
		this.currentPosition = nextPosition;
	}
	hasCompletedIterations() {
		return this.hasFiniteAnimation() && this.completedIterations >= Math.max(1, this.loop);
	}
	completeFiniteAnimation(position) {
		this.currentPosition = position;
		this.running = false;
		this.emitLegacyEvent("finish");
	}
	syncInactiveState() {
		this.track.style.transform = "translate(0px, 0px)";
		this.currentPosition = 0;
		this.currentStepDelta = 0;
		this.completedIterations = 0;
		this.hasPosition = false;
	}
	syncActiveState() {
		this.track.style.removeProperty("animation-name");
	}
	clampCurrentPosition(geometry) {
		if (this.behavior === "alternate") {
			const minPosition = Math.min(geometry.startPosition, geometry.endPosition);
			const maxPosition = Math.max(geometry.startPosition, geometry.endPosition);
			this.currentPosition = Math.min(maxPosition, Math.max(minPosition, this.currentPosition));
			return;
		}
		if (this.behavior === "slide") {
			const minPosition = Math.min(geometry.startPosition, geometry.endPosition);
			const maxPosition = Math.max(geometry.startPosition, geometry.endPosition);
			this.currentPosition = Math.min(maxPosition, Math.max(minPosition, this.currentPosition));
		}
	}
	applyCurrentPosition() {
		if (this.isVerticalDirection) {
			this.track.style.transform = `translate(0px, ${this.currentPosition}px)`;
			return;
		}
		this.track.style.transform = `translate(${this.currentPosition}px, 0px)`;
	}
	emitLegacyEvent(type) {
		this.dispatchEvent(new Event(type));
	}
};
var ReMarqueeElement = class extends RemarqueebleElement {};
var ReMarqueeBleElement = class extends RemarqueebleElement {};
var defineRemarqueebleElements = () => {
	if (typeof customElements === "undefined") return;
	if (!customElements.get("re-marquee")) customElements.define("re-marquee", ReMarqueeElement);
	if (!customElements.get("re-marquee-ble")) customElements.define("re-marquee-ble", ReMarqueeBleElement);
};
//#endregion
export { RemarqueebleElement, defineRemarqueebleElements, parseLegacyColor, parsePresentationalDimension, parseScrollAmount };
