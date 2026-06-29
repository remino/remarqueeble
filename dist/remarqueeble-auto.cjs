/*! remarqueeble v0.2.0 | (c) 2026 Rémino Rem <https://remino.net/> | ISC Licence */
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region src/lib/remarqueeble.ts
var DEFAULT_DIRECTION = "left";
var DEFAULT_BEHAVIOR = "scroll";
var DEFAULT_SCROLL_AMOUNT = 6;
var DEFAULT_SCROLL_DELAY = 85;
var MIN_SCROLL_DELAY = 60;
var DEFAULT_VERTICAL_HEIGHT = "200px";
var DEFAULT_HOST_WIDTH = "calc(100% - (var(--attr-hspace, 0px) * 2))";
var ATTR_DIRECTION = "direction";
var ATTR_BEHAVIOR = "behavior";
var ATTR_MODE = "mode";
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
var CSS_VAR_ANIMATION_DURATION = "--animation-duration";
var CSS_VAR_ANIMATION_DIRECTION = "--animation-direction";
var CSS_VAR_ANIMATION_ITERATION_COUNT = "--animation-iteration-count";
var CSS_VAR_ANIMATION_PLAY_STATE = "--animation-play-state";
var CSS_VAR_ANIMATION_TIMING_FUNCTION = "--animation-timing-function";
var CSS_VAR_TRANSLATE_X_END = "--translate-x-end";
var CSS_VAR_TRANSLATE_X_START = "--translate-x-start";
var CSS_VAR_TRANSLATE_Y_END = "--translate-y-end";
var CSS_VAR_TRANSLATE_Y_START = "--translate-y-start";
var HTMLElementBase = globalThis.HTMLElement ?? class {};
var parsePresentationalDimension = (value) => {
	if (value === null) return null;
	const trimmed = value.trim();
	if (trimmed === "") return null;
	if (/^[+-]?(?:\d+|\d*\.\d+)$/.test(trimmed)) return `${trimmed}px`;
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
		ATTR_MODE,
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
	running = false;
	position = 0;
	lastTime = null;
	loopsDone = 0;
	forward = true;
	rafId = null;
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
					will-change: transform;
				}

				:host([mode="css"]) .track {
					animation: remarqueeble-css-motion
						var(${CSS_VAR_ANIMATION_DURATION}, 10s)
						var(${CSS_VAR_ANIMATION_TIMING_FUNCTION}, linear)
						var(${CSS_VAR_ANIMATION_ITERATION_COUNT}, infinite)
						var(${CSS_VAR_ANIMATION_DIRECTION}, normal)
						both;
					animation-play-state: var(${CSS_VAR_ANIMATION_PLAY_STATE}, running);
				}

				@keyframes remarqueeble-css-motion {
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
		`;
		const track = shadowRoot.querySelector(".track");
		if (!track) throw new Error("Remarqueeble track element was not created.");
		this.track = track;
	}
	connectedCallback() {
		this.running = true;
		this.syncPresentationalHints();
		requestAnimationFrame(() => {
			if (!this.isConnected || !this.running) return;
			this.reset();
			if (!this.isCssMode) this.tick();
		});
	}
	disconnectedCallback() {
		this.running = false;
		this.lastTime = null;
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
	}
	attributeChangedCallback(_name, oldValue, newValue) {
		if (oldValue === newValue) return;
		this.syncPresentationalHints();
		this.cancelTick();
		if (this.isConnected) {
			this.reset();
			if (this.running && !this.isCssMode) this.tick();
		}
	}
	get direction() {
		return this.getAttribute(ATTR_DIRECTION) || DEFAULT_DIRECTION;
	}
	get behavior() {
		return this.getAttribute(ATTR_BEHAVIOR) || DEFAULT_BEHAVIOR;
	}
	get mode() {
		return this.getAttribute(ATTR_MODE) || "js";
	}
	get scrollAmount() {
		const raw = this.getAttribute(ATTR_SCROLL_AMOUNT);
		const value = raw === null || raw.trim() === "" ? NaN : Number(raw);
		return Number.isFinite(value) && value >= 0 ? value : DEFAULT_SCROLL_AMOUNT;
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
	get isCssMode() {
		return this.mode === "css";
	}
	start() {
		if (this.running) return;
		this.running = true;
		this.lastTime = null;
		this.syncAnimationPlayState();
		if (!this.isCssMode) this.tick();
	}
	stop() {
		this.running = false;
		this.syncAnimationPlayState();
		this.cancelTick();
	}
	cancelTick() {
		this.lastTime = null;
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
	}
	syncPresentationalHints() {
		for (const hint of ATTRIBUTE_HINTS) this.syncVar(hint);
		this.syncAnimationPlayState();
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
		const hostSize = this.getHostSize();
		const trackSize = this.getTrackSize();
		this.loopsDone = 0;
		this.forward = true;
		this.position = this.behavior === "alternate" ? this.getAlternateStartPosition(hostSize, trackSize) : this.getStartPosition(hostSize, trackSize);
		if (this.isCssMode) this.syncCssAnimation(hostSize, trackSize);
		else {
			this.clearCssAnimation();
			this.render();
		}
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
		return this.directionSign < 0 ? 0 : hostSize - trackSize;
	}
	getAlternateStartPosition(hostSize, trackSize) {
		return this.directionSign < 0 ? hostSize - trackSize : 0;
	}
	tick(time = performance.now()) {
		if (!this.running) return;
		if (this.lastTime === null) this.lastTime = time;
		if (time - this.lastTime >= this.scrollDelay) {
			this.step();
			this.lastTime = time;
		}
		if (!this.running) return;
		this.rafId = requestAnimationFrame((nextTime) => this.tick(nextTime));
	}
	step() {
		const hostSize = this.getHostSize();
		const trackSize = this.getTrackSize();
		const startPosition = this.getStartPosition(hostSize, trackSize);
		const flushEndPosition = this.getFlushEndPosition(hostSize, trackSize);
		const offEndPosition = this.getOffEndPosition(hostSize, trackSize);
		const slideEndPosition = this.getSlideEndPosition(hostSize, trackSize);
		const alternateStartPosition = this.getAlternateStartPosition(hostSize, trackSize);
		const amount = this.scrollAmount;
		const delta = this.directionSign * amount;
		if (this.behavior === "alternate") {
			this.position += this.forward ? delta : -delta;
			if (this.forward) {
				if (this.directionSign < 0 && this.position <= flushEndPosition || this.directionSign > 0 && this.position >= flushEndPosition) {
					this.position = flushEndPosition;
					this.forward = false;
					this.incrementLoopCount();
					if (this.shouldStopAfterLoop()) this.stop();
				}
			} else if (this.directionSign < 0 && this.position >= alternateStartPosition || this.directionSign > 0 && this.position <= alternateStartPosition) {
				this.position = alternateStartPosition;
				this.forward = true;
				this.incrementLoopCount();
				if (this.shouldStopAfterLoop()) this.stop();
			}
		} else if (this.behavior === "slide") {
			this.position += delta;
			if (this.directionSign < 0 && this.position <= slideEndPosition || this.directionSign > 0 && this.position >= slideEndPosition) {
				this.position = slideEndPosition;
				this.incrementLoopCount();
				if (!this.hasAttribute(ATTR_LOOP) || this.loop <= 0) this.stop();
				else if (this.shouldStopAfterLoop()) this.stop();
				else this.position = startPosition;
			}
		} else {
			this.position += delta;
			if (this.directionSign < 0 && this.position <= offEndPosition || this.directionSign > 0 && this.position >= offEndPosition) {
				this.position = startPosition;
				this.incrementLoopCount();
				if (this.shouldStopAfterLoop()) this.stop();
			}
		}
		this.render();
	}
	incrementLoopCount() {
		this.loopsDone++;
	}
	shouldStopAfterLoop() {
		return this.hasAttribute(ATTR_LOOP) && this.loop > 0 && this.loopsDone >= this.loop;
	}
	syncAnimationPlayState() {
		this.style.setProperty(CSS_VAR_ANIMATION_PLAY_STATE, this.running ? "running" : "paused");
	}
	syncCssAnimation(hostSize, trackSize) {
		const startPosition = this.behavior === "alternate" ? this.getAlternateStartPosition(hostSize, trackSize) : this.getStartPosition(hostSize, trackSize);
		const endPosition = this.behavior === "slide" ? this.getSlideEndPosition(hostSize, trackSize) : this.behavior === "alternate" ? this.getFlushEndPosition(hostSize, trackSize) : this.getOffEndPosition(hostSize, trackSize);
		const distance = Math.abs(endPosition - startPosition);
		const steps = Math.max(1, Math.ceil(distance / Math.max(1, this.scrollAmount)));
		const duration = Math.max(1, steps * this.scrollDelay);
		const iterationCount = this.getCssIterationCount();
		this.track.style.removeProperty("transform");
		this.style.setProperty(CSS_VAR_ANIMATION_DURATION, `${duration}ms`);
		this.style.setProperty(CSS_VAR_ANIMATION_DIRECTION, this.behavior === "alternate" ? "alternate" : "normal");
		this.style.setProperty(CSS_VAR_ANIMATION_ITERATION_COUNT, iterationCount);
		this.style.setProperty(CSS_VAR_ANIMATION_TIMING_FUNCTION, `steps(${steps}, end)`);
		if (this.isVerticalDirection) {
			this.style.setProperty(CSS_VAR_TRANSLATE_X_START, "0px");
			this.style.setProperty(CSS_VAR_TRANSLATE_X_END, "0px");
			this.style.setProperty(CSS_VAR_TRANSLATE_Y_START, `${startPosition}px`);
			this.style.setProperty(CSS_VAR_TRANSLATE_Y_END, `${endPosition}px`);
		} else {
			this.style.setProperty(CSS_VAR_TRANSLATE_X_START, `${startPosition}px`);
			this.style.setProperty(CSS_VAR_TRANSLATE_X_END, `${endPosition}px`);
			this.style.setProperty(CSS_VAR_TRANSLATE_Y_START, "0px");
			this.style.setProperty(CSS_VAR_TRANSLATE_Y_END, "0px");
		}
	}
	clearCssAnimation() {
		this.style.removeProperty(CSS_VAR_ANIMATION_DURATION);
		this.style.removeProperty(CSS_VAR_ANIMATION_DIRECTION);
		this.style.removeProperty(CSS_VAR_ANIMATION_ITERATION_COUNT);
		this.style.removeProperty(CSS_VAR_ANIMATION_TIMING_FUNCTION);
		this.style.removeProperty(CSS_VAR_TRANSLATE_X_START);
		this.style.removeProperty(CSS_VAR_TRANSLATE_X_END);
		this.style.removeProperty(CSS_VAR_TRANSLATE_Y_START);
		this.style.removeProperty(CSS_VAR_TRANSLATE_Y_END);
	}
	getCssIterationCount() {
		if (this.behavior === "slide" && !this.hasAttribute(ATTR_LOOP)) return "1";
		if (!this.hasAttribute(ATTR_LOOP) || this.loop <= 0) return "infinite";
		return String(this.loop);
	}
	render() {
		if (this.isVerticalDirection) this.track.style.transform = `translateY(${this.position}px)`;
		else this.track.style.transform = `translateX(${this.position}px)`;
	}
};
var defineRemarqueebleElements = () => {
	if (typeof customElements === "undefined") return;
	if (!customElements.get("re-marquee")) customElements.define("re-marquee", RemarqueebleElement);
	if (!customElements.get("re-marquee-ble")) customElements.define("re-marquee-ble", RemarqueebleElement);
};
//#endregion
//#region src/lib/auto.ts
defineRemarqueebleElements();
//#endregion
exports.defineRemarqueebleElements = defineRemarqueebleElements;
