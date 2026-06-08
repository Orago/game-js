import { VecRectangle } from "@orago/lib/math";
import { CanvasSpriteSource, SpriteRef } from "../util/meow-texture.js";
import { HslTintOptions } from "./tint.js";
export type RenderableImageOptions = {
    from?: VecRectangle;
    to?: VecRectangle;
    tint?: HslTintOptions;
};
export type SizedImageSource = HTMLCanvasElement | HTMLImageElement | ImageBitmap | OffscreenCanvas;
export type Renderable = SizedImageSource | CanvasSpriteSource | CanvasSpriteSource;
export type RenderableInput = Renderable | SpriteRef;
export type RenderableArray = [
    SizedImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
];
type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type ArrayRect = [x?: number, y?: number, w?: number, h?: number];
interface CircleOptions {
    x: number;
    y: number;
    radius: number;
    percent?: number;
    stroke?: string;
    strokeWidth?: number;
}
export declare class CanvasRender {
    static resolveCanvas(): {
        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
    };
    static getImageArray(source: RenderableInput, from: ArrayRect, to: ArrayRect): RenderableArray | undefined;
    static Image(context: CanvasRenderingContext2D, source: RenderableInput, options?: RenderableImageOptions): void;
    static text(ctx: Context2D, text: string, options: {
        x: number;
        y: number;
        width?: number;
    }): void;
    private static partialCircle;
    private static fullCircle;
    static circle(context: Context2D, values: CircleOptions): void;
    static tintSection(): void;
}
export {};
