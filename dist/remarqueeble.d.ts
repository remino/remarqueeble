declare const HTMLElementBase: {
    new (): HTMLElement;
    prototype: HTMLElement;
};
export declare const parsePresentationalDimension: (value: string | null) => string | null;
export declare const parseLegacyColor: (value: string | null) => string | null;
export declare class RemarqueebleElement extends HTMLElementBase {
    static observedAttributes: string[];
    private readonly track;
    private running;
    private position;
    private lastTime;
    private loopsDone;
    private forward;
    private rafId;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void;
    get direction(): string;
    get behavior(): string;
    get mode(): string;
    get scrollAmount(): number;
    get scrollDelay(): number;
    get loop(): number;
    get directionSign(): number;
    get isVerticalDirection(): boolean;
    get isCssMode(): boolean;
    start(): void;
    stop(): void;
    private cancelTick;
    private syncPresentationalHints;
    private syncVar;
    private reset;
    private getHostSize;
    private getTrackSize;
    private getStartPosition;
    private getFlushEndPosition;
    private getOffEndPosition;
    private getSlideEndPosition;
    private getAlternateStartPosition;
    private tick;
    private step;
    private incrementLoopCount;
    private shouldStopAfterLoop;
    private syncAnimationPlayState;
    private syncCssAnimation;
    private clearCssAnimation;
    private getCssIterationCount;
    private render;
}
export declare const defineRemarqueebleElements: () => void;
declare global {
    interface HTMLElementTagNameMap {
        're-marquee': RemarqueebleElement;
        're-marquee-ble': RemarqueebleElement;
    }
}
export {};
