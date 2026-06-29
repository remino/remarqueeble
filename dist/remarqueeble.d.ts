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
    private syncAnimation;
    private getCssIterationCount;
    private handleAnimationEnd;
    private restartAnimation;
    private hasFiniteAnimation;
}
export declare const defineRemarqueebleElements: () => void;
declare global {
    interface HTMLElementTagNameMap {
        're-marquee': RemarqueebleElement;
        're-marquee-ble': RemarqueebleElement;
    }
}
export {};
