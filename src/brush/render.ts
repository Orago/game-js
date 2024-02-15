import { arrayRectOptional } from './types.js';

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

interface circleOptions {
	x: number;
	y: number;
	radius: number;
	percent?: number;
	stroke?: string;
	strokeWidth?: number;
}

type ImageType = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;

export class CanvasRender {
	static Image(
		context: Context2D,
		image: ImageType,
		from: arrayRectOptional = [],
		to: arrayRectOptional = []
	) {
		if (
			(
				image instanceof HTMLImageElement ||
				image instanceof HTMLCanvasElement ||
				image instanceof OffscreenCanvas
			) != true
		) return;

		const [
			preX = 0,
			preY = 0,
			preW = image.width,
			preH = image.height
		] = Array.isArray(from) ? from : [];

		const [
			x = 0,
			y = 0,
			w = image.width,
			h = image.height
		] = Array.isArray(to) ? to : [];

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
		}
		catch (err) { }
	}



	static text(
		context: Context2D,
		text: string,
		{
			x,
			y,
			w
		} : {
			x: number,
			y: number,
			w: number
		}
	) {
		x = x | 0;
		y = y | 0;
		context.fillText(text, x, y, w);
	}

	static circle(context: Context2D, values: circleOptions) {
		let {
			x = 0,
			y = 0,
			radius = 10,
			percent,
			stroke,
			strokeWidth
		} = values;

		if (typeof percent === 'number') {
			const color = context.fillStyle;
			radius = radius / 2;
			context.save();

			context.beginPath();

			let amt = ((2 / 100) * percent) + 1.5;

			if (amt > 2) {
				amt = amt - 2;
			}

			context.arc(x, y, radius, amt * Math.PI, 1.5 * Math.PI, false); //25%
			context.fillStyle = 'transparent';

			context.fill();

			context.lineWidth = strokeWidth ?? (radius - .3) * 2;
			context.strokeStyle = color;
			context.stroke();

			context.restore();
		}
		else {
			context.save();
			context.beginPath();
			context.arc(x, y, radius, 0, 2 * Math.PI, false);
			context.fill();

			if (typeof stroke == 'string') {
				if (typeof strokeWidth === 'number') {
					context.lineWidth = strokeWidth;
				}
				context.strokeStyle = stroke;
				context.stroke();
			}

			context.restore();
		}
	}
}