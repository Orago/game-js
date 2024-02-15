import { CanvasRender } from './render.js';
import { Vector2 } from '@orago/vector';
import Emitter from '@orago/lib/emitter';
import { arrayRect } from './types.js';

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

type canvasImage = HTMLImageElement | HTMLCanvasElement;
type onscreenCanvas = HTMLCanvasElement;
type onscreenContext = CanvasRenderingContext2D;


class ChainableConfig {
	canvas: HTMLCanvasElement = document.createElement('canvas');
	ctx: CanvasRenderingContext2D;
	color = 'black';
	smoothing: boolean = false;
	x: number = 0;
	y: number = 0;
	w: number = 0;
	h: number = 0;

	constructor(
		data: {
			canvas?: HTMLCanvasElement;
			ctx: CanvasRenderingContext2D;
			color?: string;
			x?: number;
			y?: number;
			w?: number;
			h?: number;
		}
	) {
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
	get rect(): arrayRect {
		return [this.x, this.y, this.w, this.h];
	}
}

/**
 * ! Should not be used on it's own
 */
export class ChainableCanvas {
	stack: Array<ChainableConfig> = [];
	brush: BrushCanvas;

	/**
	 * @param {BrushCanvas} brush 
	 */
	constructor(brush: BrushCanvas) {
		this.brush = brush;

		this.stack.push(
			new ChainableConfig({
				canvas: brush.canvas,
				ctx: brush.ctx
			})
		);
	}

	//#region //* Positioning *//
	x(x: number): this {
		this.recentConfig.x = x;
		return this;
	}

	y(y: number): this {
		this.recentConfig.y = y;
		return this;
	}
	
	w(w: number): this {
		this.recentConfig.w = w;
		return this;
	}

	h(h: number): this {
		this.recentConfig.h = h;

		return this;
	}

	pos(x: number, y: number): this {
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
	size(
		width: number,
		height: number = width
	): this {
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

	get recentConfig(): ChainableConfig {
		return this.stack[this.stack.length - 1];
	}

	get canvas(): onscreenCanvas {
		return this.recentConfig.canvas;
	}

	get ctx(): onscreenContext {
		return this.recentConfig.ctx;
	}

	rotate(
		rotation: number,
		center: {
			x: number;
			y: number;
			}
		): this {
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


	opacity(amount: number): this {
		this.ctx.globalAlpha = amount;

		return this;
	}

	image(
		image: canvasImage,
		fromPos: arrayRect,
		toPos: arrayRect = this.recentConfig.rect
		): this {
		CanvasRender.Image(
			this.ctx,
			image,
			fromPos,
			toPos
		);

		return this;
	}

	imageFrom(
		image: any,
		fromPos: arrayRect
	): this {
		CanvasRender.Image(
			this.ctx,
			image,
			this.recentConfig.rect,
			fromPos
		);

		return this;
	}

	/** Renders text */
	text(text: string): this {
		const [x, y, w] = this.recentConfig.rect;

		CanvasRender.text(
			this.ctx,
			text,
			{ x, y, w }
		);

		return this;
	}

	textWidth(text: string): number {
		return this.ctx.measureText(text).width
	}

	/* Draws a circle */
	circle(): this {
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
	 */
	rendering(mode: GlobalCompositeOperation = 'source-over'): this {
		// @ts-ignore
		this.ctx.globalCompositeOperation = mode;

		return this;
	}

	/* Sets color */
	color(color: string): this {
		this.ctx.fillStyle = color;

		return this;
	}

	font(newFont: string): this {
		this.ctx.font = newFont;

		return this;
	}


	generatedFont(
		{
			font = 'Arial',
			weight = 'normal',
			size = 16
		}: {
			font?: string;
			weight?: string;
			size?: number;
		} = {}
	): this {
		return this.font(`${weight} ${size}px ${font}`);
	}

	/* Draws a rect to the screen */
	get rect(): this {
		this.ctx.fillRect(
			...this.recentConfig.rect
		);

		return this;
	}

	/* Creates a sub canvas */
	get blank(): this {
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

	/** @deprecated */
	get merge(): this {
		const r = this.recentConfig;
		const prev = this.stack[this.stack.length - 1];

		CanvasRender.Image(
			prev.ctx,
			r.canvas,
			undefined,
			prev.rect
		);

		return this.restore;
	}

	/* Saves the current canvas state */
	get save(): this {
		this.ctx.save();
		this.stack.push(
			new ChainableConfig(this.recentConfig)
		);

		return this;
	}

	/* Restores the current canvas state */
	get restore(): this {
		this.ctx.restore();
		this.stack.pop();

		return this;
	}

	ref(func: (arg0: ChainableCanvas) => void): this {
		func(this);

		return this;
	}

	/** Flips rendering on horizontal axis */
	get flipX(): this {
		const r = this.recentConfig;

		this.ctx.scale(-1, 1);

		r.x = r.x * -1 - r.w;

		return this;
	}


	/** Flips Y rendering */
	get flipY(): this {
		const r = this.recentConfig;

		this.ctx.scale(1, -1);

		r.y = r.y * -1 - r.h;

		return this;
	}

	canvasSize(width: number, height: number): this {
		this.canvas.width = width;
		this.canvas.height = height;
		this.size(width, height);
		// this.brush.setSmoothing(this.brush.smoothing);
		this.ctx.imageSmoothingEnabled = this.recentConfig.smoothing;
			//  = (state == true);

		return this;
	}

	get clear(): this {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		return this;
	}

	clearRect(): this {
		this.ctx.clearRect(...this.recentConfig.rect);

		return this;
	}
}

/** @typedef {number} canvasResoltuion */

/** @typedef {[width: number, height: number]} canvasDimensions */

/**
 * @typedef {object} baseSettings
 * @property {[width: number, height: number]} [dimensions]
 * @property {number} [resolution]
 */


type canvasType = HTMLCanvasElement | OffscreenCanvas;
type contextType = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | undefined | null;

class BrushBase {
	resolution: number = 1;
	smoothing: boolean = true;
	canvas: canvasType;
	ctx: contextType;
	events = new Emitter();

	constructor(settings: { canvas: canvasType; dimensions?: [width: number, height: number]; }) {
		this.canvas = settings.canvas;

		this.swapCanvas({
			canvas: settings.canvas
		});
	}

	updateResolution(resolution: number) {
		// const amount = ForceType.Number(resolution);

		// this.resolution = clamp(amount, { min: .5, max: 1 });
	}

	updateSize(width: number, height: number) {

		if (this.canvas instanceof HTMLCanvasElement || this.canvas instanceof OffscreenCanvas) {
			this.canvas.width = width;
			this.canvas.height = height;
			this.events.emit('resize', width, height);

			this.setSmoothing(this.smoothing);
		}
	}

	swapCanvas(
		swap: {
			canvas: canvasType;
			dimensions?: [x: number, y: number];
		}
	) {
		const {
			canvas,
			dimensions
		} = swap;

		this.canvas = canvas;

		if (this.canvas instanceof HTMLCanvasElement || this.canvas instanceof OffscreenCanvas) {
			this.ctx = this.canvas.getContext('2d');
		}

		if (Array.isArray(dimensions)) {
			this.updateSize(...dimensions);
		}
	}

	/** @param {contextType} context */
	swapContext(context: contextType) {
		this.ctx = context;
	}

	//#region //* Functions / Utils *//
	/**
	 * @returns {Vector2}
	 */
	center(): Vector2 {
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
	dimensions(): { width: number; height: number; } {
		return {
			width: this.width,
			height: this.height
		};
	}

	get width() {
		return this.canvas.width ?? 0;
	};

	get height() {
		return this.canvas.height ?? 0;
	};

	/**
	 * 
	 * @param {{ width: number, height: number }} param0 
	 */
	forceDimensions({ width, height }: { width: number; height: number; }) {
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
	image(image: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas, from: arrayRect, to: arrayRect): this {
		if (this.ctx != null) {
			CanvasRender.Image(
				this.ctx,
				image,
				from,
				to
			);
		}

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
	text(
		values: {
			text: string;
			color: string;
			x?: number;
			y?: number;
			font?: string;
			weight?: string;
			size?: number;
		}
	): void {
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

	shape(
		values: {
			x?: number;
			y?: number;
			w?: number;
			h?: number;
			color?: string;
		}
	) {
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
	circle(values: any) {
		// CanvasRender.circle(this.ctx, values);
	}

	gradient({
		shape = 'square',
		percent: { w: percentW = 0, h: percentH = 0 } = {},
		colorStart = 'black', colorEnd = 'white',
		x = 0, y = 0, w = 0, h = 0,
		radius = .5
	} = {}) {
		// if (this.ctx instanceof CanvasRenderingContext2D != true) {
		// 	return;
		// }

		// const { ctx } = this;
		// const [gx, gy] = [(x + w * percentW), (y + h * percentH)];

		// let gradient

		// if (shape == 'radial') {
		// 	gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * radius);
		// } else {
		// 	gradient = ctx.createLinearGradient(gx, gy, x + w, y + h);
		// }

		// gradient.addColorStop(0, colorStart);
		// gradient.addColorStop(1, colorEnd);

		// ctx.fillStyle = gradient;
		// ctx.fillRect(x, y, w, h);
	}

	/**
	 * 
	 * @param {object} values
	 * @param {string} values.text
	 * @param {string} [values.font]
	 * @param {number} [values.size]
	 * @returns {number}
	 */
	getTextWidth(
		values: {
			text: string;
			font?: string;
			size?: number;
		}
	): number {
		// const canvas = document.createElement('canvas');
		// const ctx = canvas.getContext('2d');

		// if (ctx) {
		// 	ctx.font = '';
		// }

		// if (
		// 	typeof values.font === 'string' ||
		// 	typeof values.size === 'number'
		// ) {
		// 	this.text({
		// 		color: 'white',
		// 		font: values.font || 'Tahoma',
		// 		size: values.size || 20,
		// 		text: "",
		// 		x: -10000,
		// 		y: -10000
		// 	});
		// }

		// return this.ctx.measureText(values.text).width;
	};

	clear() {
		// this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
	clearRect(x: number, y: number, width: number, height: number): this {
		// this.ctx.clearRect(x, y, width, height);

		return this;
	}

	/**
	 * Toggles smoothing
	 * ON - blurred when using low resolution assets and smooth on high resolution
	 * OFF - Crisp on low resolution assets and jagged on high resolution
	 * @param {boolean} state 
	 * @returns {this}
	 */
	setSmoothing = (state: boolean): this => {
		// this.ctx.imageSmoothingEnabled =
		// this.smoothing = (state == true);

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

OffscreenCanvasRenderingContext2D

/**
 * @augments {BrushBase<OffscreenCanvas, OffscreenCanvasRenderingContext2D>}
 */
export class BrushOffscreen extends BrushBase {
	/**
	 * @param {object} settings 
	 * @param {OffscreenCanvas} [settings.inputCanvas]
	   * @param {[width: number, height: number]} [settings.dimensions]
	   * @param {number} [settings.resolution]
	 */
	constructor(settings: { inputCanvas?: OffscreenCanvas; dimensions?: [width: number, height: number]; resolution?: number; }) {
		super(settings);

		this.swapCanvas({
			canvas: settings.inputCanvas ?? new OffscreenCanvas(0, 0),
			dimensions: settings.dimensions
		});
	}
}

/**
 * @augments {BrushBase<HTMLCanvasElement, CanvasRenderingContext2D>}
 */
export default class BrushCanvas extends BrushBase {
	/**
	 * @param {object} settings 
	 * @param {HTMLCanvasElement} [settings.inputCanvas]
	   * @param {[width: number, height: number]} [settings.dimensions]
	   * @param {number} [settings.resolution]
	 */
	constructor(settings: { inputCanvas?: HTMLCanvasElement; dimensions?: [width: number, height: number]; resolution?: number; }) {
		super({
			canvas: settings.inputCanvas ?? document.createElement('canvas'),
			dimensions: settings.dimensions
		});

		this.swapCanvas({
			canvas: settings.inputCanvas ?? document.createElement('canvas'),
			dimensions: settings.dimensions
		});
	}
}
export { BrushCanvas };