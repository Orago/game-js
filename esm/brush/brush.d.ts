import { Vector2 } from '@orago/vector';
import Emitter from '@orago/lib/emitter';
type arrayRect = [x: number, y: number, w: number, h: number];
type GlobalCompositeOperation = 'clear' | 'copy' | 'destination' | 'source-over' | 'destination-over' | 'source-in' | 'destination-in' | 'source-out' | 'destination-out' | 'source-atop' | 'destination-atop' | 'xor' | 'lighter' | 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity' | 'saturate';
interface overrideCircleOptions {
    x?: number;
    y?: number;
    radius?: number;
    percent?: number;
    stroke?: string;
    strokeWidth?: number;
}
type AnyCanvas = HTMLCanvasElement;
type AnyContext2D = CanvasRenderingContext2D;
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
    get rect(): arrayRect;
}
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
    image(image: HTMLImageElement | HTMLCanvasElement, fromPos?: arrayRect, toPos?: arrayRect): this;
    imageFrom(image: any, fromPos?: arrayRect): this;
    text(text: string): this;
    textWidth(text: string): number;
    circle(override?: overrideCircleOptions): this;
    rendering(mode?: GlobalCompositeOperation): this;
    color(color: string): this;
    font(newFont: string): this;
    generatedFont({ font, weight, size }?: {
        font?: string;
        weight?: string;
        size?: number;
    }): this;
    get rect(): this;
    get blank(): this;
    get merge(): this;
    get save(): this;
    get restore(): this;
    ref(func: (arg0: ChainableCanvas) => void): this;
    get flipX(): this;
    get flipY(): this;
    canvasSize(width: number, height: number): this;
    get clear(): this;
    clearRect(): this;
    get imgUrl(): string;
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
    center(): Vector2;
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
    image(image: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas, from?: arrayRect, to?: arrayRect): this;
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
    setSmoothing: (state: boolean) => this;
    resizable(): this;
    get get(): this;
    get chainable(): ChainableCanvas;
}
export {};
