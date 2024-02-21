/**
 * @typedef {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} Context2D 
 */

/**
 * @typedef {[x?: number, y?: number, w?: number, h?: number]} arrayRect
 */

/**
 * @typedef {object} circleOptions
 * @property {number} x - Horizontal Position
 * @property {number} y - Vertical Position
 * @property {number} radius - Size
 * @property {number} [percent] - Fill Percent
 * @property {string} [stroke] - Stroke Style
 * @property {number} [strokeWidth] - Stroke Size
 */

export class CanvasRender {
	/**
	 * 
	 * @param {Context2D} context 
	 * @param {HTMLImageElement | HTMLCanvasElement | OffscreenCanvas} image 
	 * @param {arrayRect} [from]
	 * @param {arrayRect} [to]
	 * @returns {void}
	 */
	static Image(context, image, from = [], to = []) {
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


	/**
	 * 
	 * @param {Context2D} context 
	 * @param {string} text 
	 * @param {object} param2
	 * @param {number} param2.x
	 * @param {number} param2.y
	 * @param {number} [param2.w]
	 * @returns {void}
	 */
	static text(
		context,
		text,
		{ x, y, w }
	) {
		x = x | 0;
		y = y | 0;
		context.fillText(text, x, y, w);
	}

	/**
	 * 
	 * @param {Context2D} context 
	 * @param {circleOptions} values 
	 */
	static circle(context, values) {
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
		} else {
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