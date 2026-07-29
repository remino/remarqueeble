declare const HTMLElementBase: {
    new (): HTMLElement;
    prototype: HTMLElement;
};
export declare const parsePresentationalDimension: (value: string | null) => string | null;
export declare const parseScrollAmount: (value: string | null) => string | null;
export declare const parseLegacyColor: (value: string | null) => string | null;
export declare class RemarqueebleElement extends HTMLElementBase {
    static observedAttributes: string[];
    private readonly track;
    private readonly scrollAmountProbe;
    private tickInterval;
    private currentPosition;
    private currentStepDelta;
    private completedIterations;
    private hasPosition;
    private running;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void;
    get direction(): string;
    get behavior(): string;
    get scrollAmount(): number;
    get scrollDelay(): number;
    get loop(): number;
    get directionSign(): number;
    get isVerticalDirection(): boolean;
    start(): void;
    stop(): void;
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
    private syncAnimationPlayState;
    private syncGeometry;
    private shouldAnimate;
    private get animationMode();
    private syncStaticAnimation;
    private getCssIterationCount;
    private handleAnimationEnd;
    private clearTickInterval;
    private hasFiniteAnimation;
    private ensureTicking;
    private restartTicking;
    private tick;
    private stepLinear;
    private stepAlternate;
    private hasCompletedIterations;
    private syncInactiveState;
    private syncActiveState;
    private clampCurrentPosition;
    private applyCurrentPosition;
}
export declare const defineRemarqueebleElements: () => void;
declare global {
    interface HTMLElementTagNameMap {
        're-marquee': RemarqueebleElement;
        're-marquee-ble': RemarqueebleElement;
    }
}
export {};
