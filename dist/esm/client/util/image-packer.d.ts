import { SizedImageSource } from "../brush/render.js";
export interface TImageBox {
    image: SizedImageSource;
    width: number;
    height: number;
}
export declare class ImagePacker {
    static createPack(boxes: TImageBox[], padding?: number): {
        canvas: HTMLCanvasElement;
        packed: {
            width: number;
            height: number;
            fill: number;
            boxes: (TImageBox & import("@orago/lib").Point & import("@orago/lib").Size)[];
        };
    };
    static pack(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, boxes: TImageBox[], padding?: number): {
        canvas: HTMLCanvasElement;
        packed: {
            width: number;
            height: number;
            fill: number;
            boxes: (TImageBox & import("@orago/lib").Point & import("@orago/lib").Size)[];
        };
    };
}
