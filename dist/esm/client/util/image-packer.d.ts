export interface TImageBox {
    image: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;
    width: number;
    height: number;
}
export declare class ImagePacker {
    static pack(boxes: TImageBox[], padding?: number): {
        canvas: HTMLCanvasElement;
        packed: {
            width: number;
            height: number;
            fill: number;
            boxes: (TImageBox & import("../../util/potpack.js").TBox)[];
        };
    };
}
