type RenderableImage = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;
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

export class CanvasRender {
	public static Image(
		context: Context2D,
		image: RenderableImage,
		from: ArrayRect = [],
		to: ArrayRect = []
	): void {
		if (
			(image instanceof HTMLImageElement ||
				image instanceof HTMLCanvasElement ||
				image instanceof OffscreenCanvas) != true
		) {
			return;
		}

		const [preX = 0, preY = 0, preW = image.width, preH = image.height] =
			Array.isArray(from) ? from : [];

		const [x = 0, y = 0, w = image.width, h = image.height] = Array.isArray(
			to
		)
			? to
			: [];

		try {
			context.drawImage(
				image,

				preX,
				preY,
				preW,
				preH,

				x,
				y,
				w,
				h
			);
		} catch (err) {}
	}

	public static text(
		context: Context2D,
		text: string,
		{ x, y, w }: { x: number; y: number; w?: number }
	): void {
		x |= 0;
		y |= 0;
		context.fillText(text, x, y, w);
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
}
