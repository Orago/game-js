import type { Point } from "@orago/lib/vector";
import { CanvasRender } from "./render.js";

type ArrayRect = [x: number, y: number, w: number, h: number];
type AnyCanvas = HTMLCanvasElement;
type AnyContext2D = CanvasRenderingContext2D;

interface OverrideCircleOptions {
	x?: number;
	y?: number;
	radius?: number;
	percent?: number;
	stroke?: string;
	strokeWidth?: number;
}

interface GeneratedFontOptions {
	font?: string;
	weight?: string;
	size?: number;
}

type ChainableCallback = (chain: ChainableCanvas) => void;

class ChainableConfig {
	canvas: HTMLCanvasElement = document.createElement("canvas");
	ctx: CanvasRenderingContext2D;
	color = "black";
	x = 0;
	y = 0;
	w = 0;
	h = 0;

	constructor(data: {
		canvas?: HTMLCanvasElement;
		ctx: CanvasRenderingContext2D;
		color?: string;
		x?: number;
		y?: number;
		w?: number;
		h?: number;
	}) {
		this.ctx = data.ctx;

		if (data.canvas != null) this.canvas = data.canvas;
		if (typeof data.color === "string") this.color = data.color;
		if (typeof data.x === "number") this.x = data.x;
		if (typeof data.y === "number") this.y = data.y;
		if (typeof data.w === "number") this.w = data.w;
		if (typeof data.h === "number") this.h = data.h;
	}

	get rect(): ArrayRect {
		return [this.x, this.y, this.w, this.h];
	}
}

/**
 * ! Should not be used on it"s own
 */
export class ChainableCanvas {
	stack: ChainableConfig[] = [];
	last_config: ChainableConfig;
	canvas: AnyCanvas;
	ctx: AnyContext2D;

	constructor(brush: { canvas: AnyCanvas; ctx: AnyContext2D }) {
		this.stack.push(
			new ChainableConfig({
				canvas: brush.canvas,
				ctx: brush.ctx,
			})
		);

		this.last_config = this.getConfig();
		this.canvas = this.last_config.canvas;
		this.ctx = this.last_config.ctx;
	}

	update_config() {
		this.last_config = this.getConfig();
		this.canvas = this.last_config.canvas;
		this.ctx = this.last_config.ctx;

		return this.last_config;
	}

	getConfig(): ChainableConfig {
		return this.stack[this.stack.length - 1];
	}

	x(x: number): this {
		this.last_config.x = x;
		return this;
	}
	y(y: number): this {
		this.last_config.y = y;
		return this;
	}
	w(w: number): this {
		this.last_config.w = w;
		return this;
	}
	h(h: number): this {
		this.last_config.h = h;
		return this;
	}

	pos(x: number, y: number): this {
		const config = this.last_config;
		if (typeof x == "number") config.x = x;
		if (typeof y == "number") config.y = y;
		return this;
	}

	size(width: number, height: number = width): this {
		const config = this.last_config;
		if (typeof width == "number") config.w = width;
		if (typeof height == "number") config.h = height;
		return this;
	}

	// get recentConfig(): ChainableConfig {
	// 	return this.last_config;
	// }

	// getContext() { return this.last_config.ctx; }
	// get canvas() { return this.last_config.canvas; }
	// get ctx() { return this.last_config.ctx; }

	rotate(rotation: number, center?: Point): this {
		const config = this.getConfig();

		if (typeof center != "object") {
			center = {
				x: config.w / 2,
				y: config.h / 2,
			};
		}

		center.x ??= config.w / 2;
		center.y ??= config.h / 2;

		this.last_config.ctx.translate(
			config.x + center.x,
			config.y + center.y
		);

		this.last_config.ctx.rotate((rotation * Math.PI) / 180);

		config.x = -center.x;
		config.y = -center.y;

		return this;
	}

	opacity(amount: number): this {
		this.last_config.ctx.globalAlpha = amount;
		return this;
	}

	image(
		image: HTMLImageElement | HTMLCanvasElement,
		fromPos?: ArrayRect,
		toPos: ArrayRect = this.last_config.rect
	): this {
		CanvasRender.Image(this.last_config.ctx, image, fromPos, toPos);

		return this;
	}

	/**
	 * Renders text
	 */
	text(text: string): this {
		const [x, y] = this.last_config.rect;

		CanvasRender.text(this.last_config.ctx, text, { x, y });

		return this;
	}

	textWidth(text: string): number {
		return this.last_config.ctx.measureText(text).width;
	}

	circle(override?: OverrideCircleOptions): this {
		const [x, y, w] = this.last_config.rect;

		CanvasRender.circle(this.last_config.ctx, {
			x,
			y,
			radius: w,
			...override,
		});

		return this;
	}

	/**
	 * Sets global composite operation
	 * Default is source-over
	 */
	rendering(mode: globalThis.GlobalCompositeOperation = "source-over"): this {
		this.last_config.ctx.globalCompositeOperation = mode;
		return this;
	}

	/** Sets color */
	color(color: string): this {
		this.last_config.ctx.fillStyle = color;
		return this;
	}
	font(newFont: string): this {
		this.last_config.ctx.font = newFont;
		return this;
	}

	generatedFont({
		font = "Arial",
		weight = "normal",
		size = 16,
	}: GeneratedFontOptions = {}): this {
		return this.font(`${weight} ${size}px ${font}`);
	}

	/** Draws a rect to the screen */
	get rect(): this {
		this.last_config.ctx.fillRect(...this.last_config.rect);

		return this;
	}

	/** Saves the current canvas state */
	get save(): this {
		this.last_config.ctx.save();
		this.stack.push(new ChainableConfig(this.last_config));
		this.update_config();

		return this;
	}

	/** Restores the current canvas state */
	get restore(): this {
		this.last_config.ctx.restore();

		if (this.stack.length > 1) this.stack.pop();

		this.update_config();

		return this;
	}

	temp(callback: ChainableCallback) {
		this.last_config.ctx.save();
		callback(this);
		this.last_config.ctx.restore();
		return this;
	}

	get clear_stack(): this {
		let context = this;

		while (this.stack.length > 1) context = this.restore;

		return context;
	}

	ref(func: (arg0: ChainableCanvas) => void): this {
		func(this);
		return this;
	}

	/**
	 * Flips rendering on horizontal axis
	 * ! Mutates
	 */
	get flipX(): this {
		const config = this.last_config;
		config.ctx.scale(-1, 1);
		config.x = config.x * -1 - config.w;
		return this;
	}

	/**
	 * Flips Y rendering
	 * ! Mutates
	 */
	get flipY(): this {
		const config = this.last_config;
		config.ctx.scale(1, -1);
		config.y = config.y * -1 - config.h;
		return this;
	}

	/** Sets canvas size */
	canvasSize(width: number, height: number): this {
		const smoothing = this.last_config.ctx.imageSmoothingEnabled;
		this.last_config.canvas.width = width;
		this.last_config.canvas.height = height;
		this.size(width, height);
		this.last_config.ctx.imageSmoothingEnabled = smoothing;
		return this;
	}

	/** Clears the canvas */
	get clear(): this {
		this.last_config.ctx.clearRect(
			0,
			0,
			this.last_config.canvas.width,
			this.last_config.canvas.height
		);
		return this;
	}

	/** Clears cached rect */
	clearRect(): this {
		this.last_config.ctx.clearRect(...this.last_config.rect);
		return this;
	}

	get url(): string {
		return this.last_config.canvas.toDataURL();
	}

	temporaryOffset(
		x: number,
		y: number,
		callback: (chain: ChainableCanvas) => void
	) {
		const ctx = this.last_config.ctx;
		const _ = ctx.getTransform();
		ctx.setTransform(_.a, _.b, _.c, _.d, _.e + x, _.f + y);
		callback(this);
		ctx.setTransform(_.a, _.b, _.c, _.d, _.e, _.f);
		return this;
	}

	temporaryRotate(
		args: Parameters<ChainableCanvas["rotate"]>,
		callback: ChainableCallback
	) {
		this.temp((chain) => {
			chain.rotate(...args);
			callback(this);
		});
		return this;
	}
}

interface EtchState {
	x: number;
	y: number;
	width: number;
	height: number;
	fill: string;
	smoothing: boolean;
}

type EtchCallback<T extends Etch> = (etch: T) => void;

class Etch {
	static identity(): EtchState {
		return {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			fill: "black",
			smoothing: true,
		};
	}
	static cloneState(state: EtchState): EtchState {
		return {
			x: state.x,
			y: state.y,
			width: state.width,
			height: state.height,
			fill: state.fill,
			smoothing: state.smoothing,
		};
	}

	state: EtchState = Etch.identity();
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;

	constructor(brush: { canvas: Etch["canvas"]; ctx: Etch["ctx"] }) {
		this.canvas = brush.canvas;
		this.ctx = brush.ctx;
	}

	ref(func: (arg0: this) => void): this {
		func(this);
		return this;
	}

	//#region //* Selections
	/**
	 * Selects a region
	 */
	select(x: number, y: number, width: number, height: number): this {
		this.state.x = x;
		this.state.y = y;
		this.state.width = width;
		this.state.height = height;
		return this;
	}

	selectAll(): this {
		return this.select(0, 0, this.canvas.width, this.canvas.height);
	}

	/**
	 * Changes the offset for all etch renders
	 */
	position(x: number, y: number): this {
		return this.select(x, y, this.state.width, this.state.height);
	}

	/**
	 * Changes the size for all etch renders
	 */
	size(width: number, height: number): this {
		return this.select(this.state.x, this.state.y, width, height);
	}
	//#endregion

	//#region //* Transform
	rotate(
		rotation: number,
		center: Point = {
			x: this.state.width / 2,
			y: this.state.height / 2,
		}
	): this {
		const state = this.state;
		this.ctx.translate(state.x + center.x, state.y + center.y);
		this.ctx.rotate((rotation * Math.PI) / 180);
		state.x = -center.x;
		state.y = -center.y;
		return this;
	}

	flip(axis: "x" | "y"): this {
		const state = this.state;
		switch (axis) {
			case "x": {
				this.ctx.scale(-1, 1);
				state.x = state.x * -1 - state.width;
				break;
			}
			case "y": {
				this.ctx.scale(1, -1);
				state.y = state.y * -1 - state.height;
				return this;
				break;
			}
		}

		return this;
	}

	opacity(value: number): this;
	opacity(): number;
	opacity(value: number | undefined = undefined): this | number {
		if (value === undefined) {
			return this.ctx.globalAlpha;
		} else {
			this.ctx.globalAlpha = value;
			return this;
		}
	}
	//#endregion

	//#region //* Utility
	resizeCanvas(width: number, height: number): this {
		const smoothing = this.ctx.imageSmoothingEnabled;
		this.canvas.width = width;
		this.canvas.height = height;
		this.size(width, height);
		this.ctx.imageSmoothingEnabled = smoothing;
		return this;
	}

	temp(callback: EtchCallback<this>) {
		const state = Etch.cloneState(this.state);
		this.ctx.save();
		callback(this);
		this.ctx.restore();
		this.state = state;
		return this;
	}
	smoothing(value: boolean): this;
	smoothing(): boolean;
	smoothing(value: boolean | undefined = undefined): this | boolean {
		if (value === undefined) {
			return this.ctx.imageSmoothingEnabled;
		} else {
			this.state.smoothing = value;
			this.ctx.imageSmoothingEnabled = value;
			return this;
		}
	}

	//#endregion

	//#region //* Fonts
	font(newFont: string): this {
		this.ctx.font = newFont;
		return this;
	}

	generatedFont({
		font = "Arial",
		weight = "normal",
		size = 16,
	}: GeneratedFontOptions = {}): this {
		return this.font(`${weight} ${size}px ${font}`);
	}
	//#endregion

	//#region //* Rendering

	/**
	 * Clears selected region
	 */
	clear(): this {
		this.ctx.clearRect(
			this.state.x,
			this.state.y,
			this.state.width,
			this.state.height
		);
		return this;
	}

	rectangle(options?: {}) {}

	//#endregion
}

export { Etch };
export type { EtchState };
