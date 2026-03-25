import potpack from "../../util/potpack.js";
import { SizedImageSource } from "../brush/render.js";

export interface TImageBox {
	image: SizedImageSource;
	width: number;
	height: number;
}

export class ImagePacker {
	static createPack(boxes: TImageBox[], padding: number = 0) {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;

		return ImagePacker.pack(canvas, ctx, boxes, padding);
	}

	static pack(
		canvas: HTMLCanvasElement,
		ctx: CanvasRenderingContext2D,
		boxes: TImageBox[],
		padding: number = 0
	) {
		const packed = potpack(boxes, padding);

		canvas.width = packed.width;
		canvas.height = packed.height;
		ctx.imageSmoothingEnabled = false;
		for (const box of packed.boxes) {
			ctx.drawImage(box.image, box.x, box.y, box.width, box.height);
		}

		return {
			canvas,
			packed,
		};
	}
}
