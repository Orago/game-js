import { VecRectangle } from "@orago/lib/math";
import { CanvasSpriteSource, SpriteRef } from "../util/meow-texture.js";
import { HslTintOptions, TintImage } from "./tint.js";

export type RenderableImageOptions = {
	from?: VecRectangle;
	to?: VecRectangle;
	tint?: HslTintOptions;
};

export type SizedImageSource =
	| HTMLCanvasElement
	| HTMLImageElement
	| ImageBitmap
	| OffscreenCanvas;

export type Renderable =
	| SizedImageSource
	// | CanvasImageSource
	| CanvasSpriteSource
	| CanvasSpriteSource;

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
// | HTMLImageElement
// | HTMLCanvasElement
// | OffscreenCanvas
// | ImageBitmap
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

let canvas: HTMLCanvasElement | undefined;
let ctx: CanvasRenderingContext2D | undefined;

export class CanvasRender {
	static resolveCanvas(): {
		canvas: HTMLCanvasElement;
		ctx: CanvasRenderingContext2D;
	} {
		if (canvas == undefined || ctx == undefined) {
			canvas = document.createElement("canvas");
			ctx = canvas.getContext("2d")!;
		}

		return {
			canvas,
			ctx,
		};
	}

	static getImageArray(
		source: RenderableInput,
		from: ArrayRect,
		to: ArrayRect
	): RenderableArray | undefined {
		if ("getSource" in source) {
			source = source.getSource();
		}
		const source_width =
			"width" in source && typeof source.width == "number"
				? source.width
				: 0;
		const source_height =
			"height" in source && typeof source.height == "number"
				? source.height
				: 0;
		const [sx = 0, sy = 0, sw = source_width, sh = source_height] =
			Array.isArray(from) ? from : [];

		const [dx = 0, dy = 0, dw = source_width, dh = source_height] =
			Array.isArray(to) ? to : [];

		if ("id" in source && "data" in source) {
			if (source.data == undefined) return;

			return [
				source.data,
				source.x + sx,
				source.y + sy,
				sw,
				sh,
				dx,
				dy,
				dw,
				dh,
			];
		} else {
			return [source, sx, sy, sw, sh, dx, dy, dw, dh];
		}
	}

	public static Image(
		context: CanvasRenderingContext2D,
		source: RenderableInput,
		options?: RenderableImageOptions
		// from: ArrayRect = [],
		// to: ArrayRect = []
	): void {
		const source_array = CanvasRender.getImageArray(
			source,
			options?.from ?? [],
			options?.to ?? []
		);
		if (source_array == undefined) return;

		try {
			let [image, sx, sy, sw, sh, dx, dy, dw, dh] = source_array;
			if (options?.tint != undefined) {
				image = TintImage.hslAffect(image, options.tint, (ctx) =>
					ctx.drawImage(image, 0, 0)
				);
			} else {
			}
			context.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
		} catch (err) {}
	}

	public static text(
		ctx: Context2D,
		text: string,
		options: { x: number; y: number; width?: number }
	): void {
		options.x |= 0;
		options.y |= 0;
		
		ctx.fillText(text, options.x, options.y, options.width);
	}

	private static partialCircle(
		context: Context2D,
		values: CircleOptions & { percent: number }
	) {
		let { x = 0, y = 0, radius = 10, percent, strokeWidth } = values;

		const color = context.fillStyle;
		radius /= 2;
		context.save();
		context.beginPath();

		let amt = (2 / 100) * percent + 1.5;

		if (amt > 2) amt = amt - 2;

		context.arc(x, y, radius, amt * Math.PI, 1.5 * Math.PI, false); //25%
		context.fillStyle = "transparent";
		context.fill();

		context.lineWidth = strokeWidth ?? (radius - 0.3) * 2;
		context.strokeStyle = color;
		context.stroke();
		context.restore();
	}

	private static fullCircle(context: Context2D, values: CircleOptions) {
		const { x = 0, y = 0, radius = 10, stroke, strokeWidth } = values;

		context.save();
		context.beginPath();
		context.arc(x, y, radius, 0, 2 * Math.PI, false);
		context.fill();

		if (typeof stroke == "string") {
			if (typeof strokeWidth === "number")
				context.lineWidth = strokeWidth;

			context.strokeStyle = stroke;
			context.stroke();
		}

		context.restore();
	}

	public static circle(context: Context2D, values: CircleOptions) {
		if (typeof values.percent === "number") {
			CanvasRender.partialCircle(
				context,
				values as CircleOptions & { percent: number }
			);
		} else {
			CanvasRender.fullCircle(context, values);
		}
	}

	public static tintSection() {}
}
