import { CanvasRender } from './render.js';
import { Vector2 } from '@orago/vector';
import Emitter from '@orago/lib/emitter';

/**
 * @typedef {[x: number, y: number, w: number, h: number]} arrayRect
 */

/**
 * @typedef {'clear'
 * | 'copy'
 * | 'destination'
 * | 'source-over'
 * | 'destination-over'
 * | 'source-in'
 * | 'destination-in'
 * | 'source-out'
 * | 'destination-out'
 * | 'source-atop'
 * | 'destination-atop'
 * | 'xor'
 * | 'lighter'
 * | 'normal'
 * | 'multiply'
 * | 'screen'
 * | 'overlay'
 * | 'darken'
 * | 'lighten'
 * | 'color-dodge'
 * | 'color-burn'
 * | 'hard-light'
 * | 'soft-light'
 * | 'difference'
 * | 'exclusion'
 * | 'hue'
 * | 'saturation'
 * | 'color'
 * | 'luminosity'
 * | 'saturate'
 * } GlobalCompositeOperation
 */


/**
 * @typedef {HTMLCanvasElement | OffscreenCanvas} AnyCanvas
 */

/**
 * @typedef {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} AnyContext2D
 */

class ChainableConfig {
	/**
	 * @type {HTMLCanvasElement | OffscreenCanvas}
	 */
	canvas = document.createElement('canvas');

	/**
	 * @type {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D}
	 */
	ctx;

	color = 'black';
	x = 0;
	y = 0;
	w = 0;
	h = 0;

	/**
	 * 
	 * @param {object} data 
	 * @param {HTMLCanvasElement | OffscreenCanvas} [data.canvas]
	 * @param {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} data.ctx
	 * @param {string} [data.color]
	 * @param {number} [data.x]
	 * @param {number} [data.y]
	 * @param {number} [data.w]
	 * @param {number} [data.h]
	 */
	constructor(data) {
		this.ctx = data.ctx;

		if (data.canvas != null) {
			this.canvas = data.canvas;
		}

		if (typeof data.color === 'string') {
			this.color = data.color;
		}

		if (typeof data.x === 'number') {
			this.x = data.x;
		}

		if (typeof data.y === 'number') {
			this.y = data.y;
		}

		if (typeof data.w === 'number') {
			this.w = data.w;
		}

		if (typeof data.h === 'number') {
			this.h = data.h;
		}

	}
	/**
	 * @returns {arrayRect}
	 */
	get rect() {
		return [this.x, this.y, this.w, this.h];
	}
}

/**
 * ! Should not be used on it's own
 */
export class ChainableCanvas {
	/**
	 * @type {Array<ChainableConfig>}
	 */
	stack = [];

	/** @type {BrushCanvas} */
	brush;

	/**
	 * @param {BrushCanvas} brush 
	 */
	constructor(brush) {
		this.brush = brush;

		this.stack.push(
			new ChainableConfig({
				canvas: brush.canvas,
				ctx: brush.ctx
			})
		);
	}

	//#region //* Positioning *//
	/**
	 * @param {number} x 
	 * @returns {this}
	 */
	x(x) {
		this.recentConfig.x = x;

		return this;
	}

	/**
	 * @param {number} y
	 * @returns {this}
	 */
	y(y) {
		this.recentConfig.y = y;

		return this;

	}
	/**
	 * @param {number} w 
	 * @returns {this}
	 */
	w(w) {
		this.recentConfig.w = w;

		return this;
	}

	/**
	 * @param {number} h
	 * @returns {this}
	 */
	h(h) {
		this.recentConfig.h = h;

		return this;
	}

	/**
	 * @param {number} x 
	 * @param {number} y
	 * @returns {this}
	 */
	pos(x, y) {
		const config = this.recentConfig;

		if (typeof x == 'number') {
			config.x = x;
		}

		if (typeof y == 'number') {
			config.y = y;
		}

		return this;
	}

	/**
	 * 
	 * @param {number} width 
	 * @param {number} [height]
	 * @returns {this}
	 */
	size(width, height = width) {
		const config = this.recentConfig;

		if (typeof width == 'number') {
			config.w = width;
		}

		if (typeof height == 'number') {
			config.h = height;
		}

		return this;
	}
	//#endregion //* Positioning *//

	/**
	 * @returns {ChainableConfig}
	 */
	get recentConfig() {
		return this.stack[this.stack.length - 1];
	}

	/**
	 * @returns {AnyCanvas}
	 */
	get canvas() {
		return this.recentConfig.canvas;
	}

	/**
	 * @returns {AnyContext2D}
	 */
	get ctx() {
		return this.recentConfig.ctx;
	}

	/**
	 * 
	 * @param {number} rotation 
	 * @param {object} [center]
	 * @param {number} center.x
	 * @param {number} center.y 
	 * @returns {this}
	 */
	rotate(rotation, center) {
		const config = this.recentConfig;

		if (typeof center != 'object') {
			center = {
				x: config.w / 2,
				y: config.h / 2
			};
		}

		center.x ??= config.w / 2;
		center.y ??= config.h / 2;

		this.ctx.translate(
			config.x + center.x,
			config.y + center.y
		);

		this.ctx.rotate(
			rotation * Math.PI / 180
		);

		config.x = -center.x;
		config.y = -center.y;

		return this;
	}

	/**
	 * @param {number} amount 
	 * @returns {this}
	 */
	opacity(amount) {
		this.ctx.globalAlpha = amount;

		return this;
	}

	/**
	 * 
	 * @param {HTMLImageElement | HTMLCanvasElement} image 
	 * @param {arrayRect} [fromPos] 
	 * @param {arrayRect} [toPos]
	 * @returns {this}
	 */
	image(image, fromPos, toPos = this.recentConfig.rect) {
		CanvasRender.Image(
			this.ctx,
			image,
			fromPos,
			toPos
		);

		return this;
	}

	/**
	 * 
	 * @param {*} image 
	 * @param {arrayRect} fromPos 
	 * @returns {this}
	 */
	imageFrom(image, fromPos) {
		CanvasRender.Image(
			this.ctx,
			image,
			this.recentConfig.rect,
			fromPos
		);

		return this;
	}

	/**
	 * Renders text
	 * @param {string} text 
	 * @returns {this}
	 */
	text(text) {
		const [x, y] = this.recentConfig.rect;

		CanvasRender.text(
			this.ctx,
			text,
			{ x, y }
		);

		return this;
	}

	/**
	 * @param {string} text 
	 * @returns {number}
	 */
	textWidth(text) {
		return this.ctx.measureText(text).width
	}

	/**
	 * Draws a circle
	 * @returns {this}
	 */
	circle() {
		const [x, y, w] = this.recentConfig.rect;

		CanvasRender.circle(
			this.ctx,
			{
				x,
				y,
				radius: w
			}
		);

		return this;
	}

	/**
	 * Sets global composite operation
	 * Default is source-over
	 * @param {GlobalCompositeOperation} mode 
	 * @returns {this}
	 */
	rendering(mode = 'source-over') {
		// @ts-ignore
		this.ctx.globalCompositeOperation = mode;

		return this;
	}

	/**
	 * Sets color
	 * @param {string} color 
	 * @returns {this}
	 */
	color(color) {
		this.ctx.fillStyle = color;

		return this;
	}

	/**
	 * @param {string} newFont 
	 * @returns {this}
	 */
	font(newFont) {
		this.ctx.font = newFont;

		return this;
	}

	/**
	 * 
	 * @param {object} param0
	 * @param {string} [param0.font]
	 * @param {string} [param0.weight]
	 * @param {number} [param0.size]
	 * @returns {this}
	 */
	generatedFont({
		font = 'Arial',
		weight = 'normal',
		size = 16
	} = {}) {
		return this.font(`${weight} ${size}px ${font}`);
	}

	/**
	 * Draws a rect to the screen
	 * @returns {this}
	 */
	get rect() {
		this.ctx.fillRect(
			...this.recentConfig.rect
		);

		return this;
	}

	/**
	 * Creates a sub canvas
	 * @returns {this}
	 */
	get blank() {
		const pre = this.recentConfig;

		this.save;
		const config = this.recentConfig;

		config.canvas = document.createElement('canvas');

		config.canvas.width = pre.canvas.width;
		config.canvas.height = pre.canvas.height;
		const gotten = config.canvas.getContext('2d');

		if (gotten != null) {
			config.ctx = gotten;
		}

		return this;
	}

	/**
	 * @returns {this}
	 * @deprecated
	 */
	get merge() {
		const r = this.recentConfig;
		const prev = this.stack[this.stack.length - 1];


		CanvasRender.Image(
			prev.ctx,
			r.canvas,
			// prev.rect,
			undefined,
			prev.rect
		);


		return this.restore;
	}

	/**
	 * Saves the current canvas state
	 * @returns {this}
	 */
	get save() {
		this.ctx.save();

		this.stack.push(
			new ChainableConfig(this.recentConfig)
		);

		return this;
	}

	/**
	 * Restores the current canvas state
	 * @returns {this}
	 */
	get restore() {
		this.ctx.restore();

		this.stack.pop();

		return this;
	}

	/**
	 * @param {function (ChainableCanvas): void} func
	 * @returns {this}
	 */
	ref(func) {
		func(this);

		return this;
	}

	/**
	 * Flips rendering on horizontal axis
	 * ! Mutates
	 * @returns {this}
	 */
	get flipX() {
		const r = this.recentConfig;

		this.ctx.scale(-1, 1);

		r.x = r.x * -1 - r.w;

		return this;
	}


	/**
	 * Flips Y rendering
	 * ! Mutates
	 * @returns {this}
	 */
	get flipY() {
		const r = this.recentConfig;

		this.ctx.scale(1, -1);

		r.y = r.y * -1 - r.h;

		return this;
	}

	/**
	 * Sets canvas size
	 * @param {number} width 
	 * @param {number} height 
	 * @returns {this}
	 */
	canvasSize(width, height) {
		this.canvas.width = width;
		this.canvas.height = height;

		this.size(width, height);

		this.brush.setSmoothing(this.brush.smoothing);

		return this;
	}

	/**
	 * Clears the canvas
	 * @returns {this}
	 */
	get clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		return this;
	}

	/**
	 * Clears cached rect
	 * @returns {this}
	 */
	clearRect() {
		this.ctx.clearRect(...this.recentConfig.rect);

		return this;
	}
}

export default class BrushCanvas {
	resolution = 1;

	/**
	 * @type {boolean}
	 */
	smoothing = true;

	/** @type {HTMLCanvasElement | OffscreenCanvas} */
	// @ts-ignore
	canvas;

	/** @type {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} */
	// @ts-ignore
	ctx;

	events = new Emitter();

	/**
	 * 
	 * @param {object} settings
	 * @param {[width: number, height: number]} [settings.dimensions]
	 * @param {HTMLCanvasElement | OffscreenCanvas} [settings.inputCanvas]
	 * @param {number} [settings.resolution]
	 */
	constructor(settings = {}) {
		if (typeof settings != 'object') {
			settings = {};
		}

		let {
			dimensions = [100, 100],
			inputCanvas: canvas = document.createElement('canvas'),
			resolution = 1
		} = settings;

		this.swapCanvas({
			canvas,
			dimensions
		});

		this.updateResolution(resolution);
	}

	/**
	 * 
	 * @param {number} resolution 
	 */
	updateResolution(resolution) {
		// const amount = ForceType.Number(resolution);

		// this.resolution = clamp(amount, { min: .5, max: 1 });
	}

	/**
	 * 
	 * @param {number} width 
	 * @param {number} height 
	 */
	updateSize(width, height) {
		Object.assign(this.canvas, { width, height });

		this.events.emit('resize', width, height);

		this.setSmoothing(this.smoothing);
	}

	/**
	 * 
	 * @param {object} param0 
	 * @param {HTMLCanvasElement | OffscreenCanvas} param0.canvas
	 * @param {CanvasRenderingContext2D} [param0.ctx]
	 * @param {[x: number, y: number]} [param0.dimensions]
	 */
	swapCanvas(
		{
			canvas,
			ctx,
			dimensions
		}
	) {
		this.canvas = canvas;

		// canvas.ctx ?? canvas.getContext('2d')

		if (ctx instanceof CanvasRenderingContext2D) {
			this.ctx = ctx;
		}
		else if (
			canvas instanceof HTMLCanvasElement ||
			canvas instanceof OffscreenCanvas
		) {
			const ctx = canvas.getContext('2d');

			if (ctx){
				this.ctx = ctx;
			}
		}

		if (Array.isArray(dimensions)){
			this.updateSize(...dimensions);
		}
	}

	//#region //* Functions / Utils *//
	/**
	 * @returns {Vector2}
	 */
	center() {
		return new Vector2(
			this.width / 2,
			this.height / 2
		);
	}

	focus() {
		if (this.canvas instanceof HTMLCanvasElement) {
			this.canvas.focus();
		}
	}

	/**
	 * @returns {{ width: number, height: number }}
	 */
	dimensions() {
		return {
			width: this.width,
			height: this.height
		};
	}

	get width() {
		return this.canvas.width;
	};

	get height() {
		return this.canvas.height;
	};

	/**
	 * 
	 * @param {{ width: number, height: number }} param0 
	 */
	forceDimensions({ width, height }) {
		if (
			typeof width == 'number' &&
			this.canvas.width != width
		) {
			this.canvas.width = width;
		}

		if (
			typeof height == 'number' &&
			this.canvas.height != height
		) {
			this.canvas.height = height;
		}
	};

	/* Draw */
	/**
	 * @param {HTMLImageElement | HTMLCanvasElement | OffscreenCanvas} image 
	 * @param {arrayRect} [from]
	 * @param {arrayRect} [to]
	 * @returns {this}
	 */
	image(image, from, to) {
		CanvasRender.Image(
			this.ctx,
			image,
			from,
			to
		);

		return this;
	}

	/**
	 * 
	 * @param {object} values
	 * @param {string} values.text
	 * @param {string} values.color
	 * @param {number} [values.x]
	 * @param {number} [values.y]
	 * @param {string} [values.font]
	 * @param {string} [values.weight]
	 * @param {number} [values.size]
	 * @returns {void}
	 */
	text(values) {
		if (this.ctx instanceof CanvasRenderingContext2D != true) {
			return;
		}

		let {
			text,
			color,
			x = 0,
			y = 0,

			font,
			weight,
			size
		} = values;

		x = x | 0;
		y = y | 0;

		this.chainable
			.generatedFont({
				font,
				weight,
				size
			})
			.color(color)
			.pos(x, y)
			.text(text);
	}

	/**
	 * 
	 * @param {{
	 *  x?: number,
	 *  y?: number,
	 *  w?: number,
	 *  h?: number,
	 *  color?: string,
	 * }} values 
	 */
	shape(values) {
		if (this.ctx instanceof CanvasRenderingContext2D != true) {
			return;
		}

		let {
			color = 'pink',
			x = 0,
			y = 0,
			w = 0,
			h = 0
		} = values;

		x = x | 0;
		y = y | 0;
		w = w | 0;
		h = h | 0;

		this.chainable
			.color(color)
			.size(w, h)
			.pos(x, y)
			.rect;
	}

	/**
	 * 
	 * @param {*} values
	 * @deprecated
	 */
	circle(values) {
		CanvasRender.circle(this.ctx, values);
	}

	gradient({
		shape = 'square',
		percent: { w: percentW = 0, h: percentH = 0 } = {},
		colorStart = 'black', colorEnd = 'white',
		x = 0, y = 0, w = 0, h = 0,
		radius = .5
	} = {}) {
		if (this.ctx instanceof CanvasRenderingContext2D != true) {
			return;
		}

		const { ctx } = this;
		const [gx, gy] = [(x + w * percentW), (y + h * percentH)];

		let gradient

		if (shape == 'radial') {
			gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * radius);
		}
		else {
			gradient = ctx.createLinearGradient(gx, gy, x + w, y + h);
		}

		gradient.addColorStop(0, colorStart);
		gradient.addColorStop(1, colorEnd);

		ctx.fillStyle = gradient;
		ctx.fillRect(x, y, w, h);
	}

	/**
	 * 
	 * @param {object} values
	 * @param {string} values.text
	 * @param {string} [values.font]
	 * @param {number} [values.size]
	 * @returns {number}
	 */
	getTextWidth(values) {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (ctx){
			ctx.font = '';
		}

		if (
			typeof values.font === 'string' ||
			typeof values.size === 'number'
		) {
			this.text({
				color: 'white',
				font: values.font || 'Tahoma',
				size: values.size || 20,
				text: "",
				x: -10000,
				y: -10000
			});
		}

		return this.ctx.measureText(values.text).width;
	};

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		return this;
	}

	/**
	 * 
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} width 
	 * @param {number} height 
	 * @returns {this}
	 */
	clearRect(x, y, width, height) {
		this.ctx.clearRect(x, y, width, height);

		return this;
	}

	/**
	 * Toggles smoothing
	 * ON - blurred when using low resolution assets and smooth on high resolution
	 * OFF - Crisp on low resolution assets and jagged on high resolution
	 * @param {boolean} state 
	 * @returns {this}
	 */
	setSmoothing = (state) => {
		this.ctx.imageSmoothingEnabled =
			this.smoothing = (state == true);

		return this;
	};

	resizable() {
		const resize = () => {
			const { canvas, setSmoothing } = this;
			const { documentElement: dE } = document;

			// if ((typeof HTMLCanvasElement != 'null' && typeof OffscreenCanvas != 'null')) {
			if (
				canvas instanceof HTMLCanvasElement &&
				document.body.contains(canvas)
			) {
				canvas.style.width = `${100 * this.resolution}%`;
				canvas.style.height = `${100 * this.resolution}%`;
			}
			// }

			canvas.width = dE.clientWidth * this.resolution;
			canvas.height = dE.clientHeight * this.resolution;

			setSmoothing(false);

			this.events.emit('resize', canvas.width, canvas.height);
		}

		if ('addEventListener' in window) {
			window.addEventListener('resize', resize);
		}

		resize();

		return this;
	}

	get get() {
		return this;
	}

	get chainable() {
		return new ChainableCanvas(this);
	}
	//#endregion //* Functions / Utils *//
}