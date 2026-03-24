export type TRenderableImage = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;
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
    static Image(context: Context2D, image: TRenderableImage, from?: ArrayRect, to?: ArrayRect): void;
    static text(context: Context2D, text: string, { x, y, w }: {
        x: number;
        y: number;
        w?: number;
    }): void;
    private static partialCircle;
    private static fullCircle;
    static circle(context: Context2D, values: CircleOptions): void;
}
export {};
