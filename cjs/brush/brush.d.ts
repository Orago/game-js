import Emitter from '@orago/lib/emitter';
import type { Point } from '@orago/lib/vector';
type ArrayRect = [x: number, y: number, w: number, h: number];
type GlobalCompositeOperation = 'clear' | 'copy' | 'destination' | 'source-over' | 'destination-over' | 'source-in' | 'destination-in' | 'source-out' | 'destination-out' | 'source-atop' | 'destination-atop' | 'xor' | 'lighter' | 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity' | 'saturate';
type AnyCanvas = HTMLCanvasElement;
type AnyContext2D = CanvasRenderingContext2D;
interface overrideCircleOptions {
    x?: number;
    y?: number;
    radius?: number;
    percent?: number;
    stroke?: string;
    strokeWidth?: number;
}
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
 * ! Should not be used on it's own
 */
export declare class ChainableCanvas {
    stack: Array<ChainableConfig>;
    constructor(brush: {
        canvas: AnyCanvas;
        ctx: AnyContext2D;
    });
    x(x: number): this;
    y(y: number): this;
    w(w: number): this;
    h(h: number): this;
    pos(x: number, y: number): this;
    size(width: number, height?: number): this;
    get recentConfig(): ChainableConfig;
    get canvas(): HTMLCanvasElement;
    get ctx(): AnyContext2D;
    rotate(rotation: number, center?: {
        x: number;
        y: number;
    }): this;
    opacity(amount: number): this;
    image(image: HTMLImageElement | HTMLCanvasElement, fromPos?: ArrayRect, toPos?: ArrayRect): this;
    imageFrom(image: any, fromPos?: ArrayRect): this;
    /**
     * Renders text
     */
    text(text: string): this;
    textWidth(text: string): number;
    circle(override?: overrideCircleOptions): this;
    /**
     * Sets global composite operation
     * Default is source-over
     */
    rendering(mode?: GlobalCompositeOperation): this;
    /** Sets color */
    color(color: string): this;
    font(newFont: string): this;
    generatedFont({ font, weight, size }?: {
        font?: string;
        weight?: string;
        size?: number;
    }): this;
    /** Draws a rect to the screen */
    get rect(): this;
    /**
     * Creates a sub canvas
     * @deprecated
     */
    get blank(): this;
    /**
     * @returns {this}
     * @deprecated
     */
    get merge(): this;
    /** Saves the current canvas state */
    get save(): this;
    /** Restores the current canvas state */
    get restore(): this;
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
    /**
     * @deprecated
     */
    get imgUrl(): string;
    get url(): string;
}
export default class BrushCanvas {
    resolution: number;
    smoothing: boolean;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    events: Emitter;
    constructor(settings?: {
        dimensions?: [width: number, height: number];
        inputCanvas?: HTMLCanvasElement;
        resolution?: number;
    });
    updateResolution(resolution: number): void;
    updateSize(width: number, height: number): void;
    swapCanvas({ canvas, ctx, dimensions }: {
        canvas: HTMLCanvasElement;
        ctx?: CanvasRenderingContext2D;
        dimensions?: [x: number, y: number];
    }): void;
    center(): Point;
    focus(): void;
    dimensions(): {
        width: number;
        height: number;
    };
    get width(): number;
    get height(): number;
    forceDimensions({ width, height }: {
        width: number;
        height: number;
    }): void;
    image(image: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas, from?: ArrayRect, to?: ArrayRect): this;
    text(values: {
        text: string;
        color: string;
        x?: number;
        y?: number;
        font?: string;
        weight?: string;
        size?: number;
    }): void;
    shape(values: {
        x?: number;
        y?: number;
        w?: number;
        h?: number;
        color?: string;
    }): void;
    /**
     * @deprecated
     */
    circle(values?: any): void;
    gradient({ shape, percent: { w: percentW, h: percentH }, colorStart, colorEnd, x, y, w, h, radius }?: {
        shape?: string | undefined;
        percent?: {
            w?: number | undefined;
            h?: number | undefined;
        } | undefined;
        colorStart?: string | undefined;
        colorEnd?: string | undefined;
        x?: number | undefined;
        y?: number | undefined;
        w?: number | undefined;
        h?: number | undefined;
        radius?: number | undefined;
    }): void;
    getTextWidth(values: {
        text: string;
        font?: string;
        size?: number;
    }): number;
    clear(): this;
    clearRect(x: number, y: number, width: number, height: number): this;
    /**
     * Toggles smoothing
     * ON - blurred when using low resolution assets and smooth on high resolution
     * OFF - Crisp on low resolution assets and jagged on high resolution
     */
    setSmoothing: (state: boolean) => this;
    resizable(): this;
    get get(): this;
    get chainable(): ChainableCanvas;
}
export {};
