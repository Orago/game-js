import type { Point } from "@orago/lib";
type ArrayRect = [x: number, y: number, w: number, h: number];
type AnyCanvas = HTMLCanvasElement;
type AnyContext2D = CanvasRenderingContext2D;
interface OverrideCircleOptions {
    x?: number;
    y?: number;
    radius?: number;
    percent?: number;
    stroke?: string;
    strokeWidth?: number;
}
interface GeneratedFontOptions {
    font?: string;
    weight?: string;
    size?: number;
}
type ChainableCallback = (chain: ChainableCanvas) => void;
declare class ChainableConfig {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    color: string;
    x: number;
    y: number;
    w: number;
    h: number;
    constructor(data: {
        canvas?: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
        color?: string;
        x?: number;
        y?: number;
        w?: number;
        h?: number;
    });
    get rect(): ArrayRect;
}
/**
 * ! Should not be used on it"s own
 */
export declare class ChainableCanvas {
    stack: ChainableConfig[];
    last_config: ChainableConfig;
    canvas: AnyCanvas;
    ctx: AnyContext2D;
    constructor(brush: {
        canvas: AnyCanvas;
        ctx: AnyContext2D;
    });
    update_config(): ChainableConfig;
    getConfig(): ChainableConfig;
    x(x: number): this;
    y(y: number): this;
    w(w: number): this;
    h(h: number): this;
    pos(x: number, y: number): this;
    size(width: number, height?: number): this;
    rotate(rotation: number, center?: Point): this;
    opacity(amount: number): this;
    image(image: HTMLImageElement | HTMLCanvasElement, fromPos?: ArrayRect, toPos?: ArrayRect): this;
    /**
     * Renders text
     */
    text(text: string): this;
    textWidth(text: string): number;
    circle(override?: OverrideCircleOptions): this;
    /**
     * Sets global composite operation
     * Default is source-over
     */
    rendering(mode?: globalThis.GlobalCompositeOperation): this;
    /** Sets color */
    color(color: string): this;
    font(newFont: string): this;
    generatedFont({ font, weight, size, }?: GeneratedFontOptions): this;
    /** Draws a rect to the screen */
    get rect(): this;
    /** Saves the current canvas state */
    get save(): this;
    /** Restores the current canvas state */
    get restore(): this;
    temp(callback: ChainableCallback): this;
    get clear_stack(): this;
    ref(func: (arg0: ChainableCanvas) => void): this;
    /**
     * Flips rendering on horizontal axis
     * ! Mutates
     */
    get flipX(): this;
    /**
     * Flips Y rendering
     * ! Mutates
     */
    get flipY(): this;
    /** Sets canvas size */
    canvasSize(width: number, height: number): this;
    /** Clears the canvas */
    get clear(): this;
    /** Clears cached rect */
    clearRect(): this;
    get url(): string;
    temporaryOffset(x: number, y: number, callback: (chain: ChainableCanvas) => void): this;
    temporaryRotate(args: Parameters<ChainableCanvas["rotate"]>, callback: ChainableCallback): this;
}
export {};
