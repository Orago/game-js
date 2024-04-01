type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type arrayRect = [x?: number, y?: number, w?: number, h?: number];
interface circleOptions {
    x: number;
    y: number;
    radius: number;
    percent?: number;
    stroke?: string;
    strokeWidth?: number;
}
type renderableImage = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;
export declare class CanvasRender {
    static Image(context: Context2D, image: renderableImage, from?: arrayRect, to?: arrayRect): void;
    static text(context: Context2D, text: string, { x, y, w }: {
        x: number;
        y: number;
        w?: number;
    }): void;
    static circle(context: Context2D, values: circleOptions): void;
}
export {};
