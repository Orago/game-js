import { Point, Signal } from "@orago/lib";
import {
	CanvasRender,
	RenderableImageOptions,
	RenderableInput,
} from "./render.js";
import { VecRectangle } from "@orago/lib/math";

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

interface EtchState {
	x: number;
	y: number;
	width: number;
	height: number;
	fill: string;
	smoothing: boolean;
}

interface EtchOptions {
	canvas: Etch["canvas"];
	ctx: Etch["ctx"];
	stack?: boolean | EtchStack;
}

type EtchCallback<T extends Etch> = (etch: T) => void;

class EtchStack {
	static push(instance: Etch, stack: EtchState[], state: EtchState) {
		stack.push(state);
		instance.state = state;
	}

	static pop(instance: Etch, stack: EtchState[]) {
		if (stack.length > 1) {
			const state = stack.pop();

			if (state != undefined) {
				instance.state = state;
			}
		}
	}

	static init(instance: Etch, stack: EtchStack | boolean | undefined) {
		if (stack == undefined) return;
		if (stack instanceof EtchStack) {
			instance.stack = stack;
		} else if (stack == true) {
			instance.stack = new EtchStack();
		}
	}

	stack: EtchState[] = [];
}

class EtchUtility {
	static canvas: HTMLCanvasElement = document.createElement("canvas");
	static ctx: CanvasRenderingContext2D = this.canvas.getContext("2d")!;

	static resizable(input: {
		canvas: HTMLCanvasElement;
		resolution: number;
		setSmoothing: (state: boolean) => void;
		onResize?: Signal<(width: number, height: number) => void>;
	}): void {
		const resize = () => {
			const { canvas, setSmoothing } = input;
			const { documentElement: dE } = document;

			if (
				canvas instanceof HTMLCanvasElement &&
				document.body.contains(canvas)
			) {
				canvas.style.width = `${100 * input.resolution}%`;
				canvas.style.height = `${100 * input.resolution}%`;
			}

			canvas.width = dE.clientWidth * input.resolution;
			canvas.height = dE.clientHeight * input.resolution;

			setSmoothing(false);

			if (input.onResize != undefined) {
				input.onResize.emit(canvas.width, canvas.height);
			}
		};

		if ("addEventListener" in window) {
			window.addEventListener("resize", resize);
		}

		resize();
	}

	static generateFontString({
		font = "Arial",
		weight = "normal",
		size = 16,
	}: GeneratedFontOptions = {}): string {
		return `${weight} ${size}px ${font}`;
	}

	static measureText(
		ctx: CanvasRenderingContext2D,
		font: string,
		text: string
	): TextMetrics {
		const previous_font = ctx.font;
		ctx.font = font;
		// restore font
		if (previous_font != font) {
			ctx.font = previous_font;
		}
		return ctx.measureText(text);
	}

	static getTextWidth(
		ctx: CanvasRenderingContext2D,
		font: string,
		text: string
	): number {
		return EtchUtility.measureText(ctx, font, text).width;
	}
}

class Etch {
	static Stack = EtchStack;
	static Utility = EtchUtility;

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
	stack?: EtchStack;

	constructor(brush: EtchOptions) {
		this.canvas = brush.canvas;
		this.ctx = brush.ctx;
		EtchStack.init(this, this.stack);
	}

	asVec(): VecRectangle {
		return [
			this.state.x,
			this.state.y,
			this.state.width,
			this.state.height,
		];
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

	/** Saves the current canvas state */
	save(list: EtchStack | EtchState[] | undefined = this.stack): this {
		// this.stack.push(new ChainableConfig(this.last_config));
		this.ctx.save();

		if (list != undefined) {
			if (Array.isArray(list)) {
				EtchStack.push(this, list, Etch.cloneState(this.state));
			} else {
				EtchStack.push(this, list.stack, Etch.cloneState(this.state));
			}
		}

		return this;
	}

	/** Restores the current canvas state */
	restore(list: EtchStack | EtchState[] | undefined = this.stack): this {
		this.ctx.restore();

		if (list != undefined) {
			if (Array.isArray(list)) {
				EtchStack.pop(this, list);
			} else {
				EtchStack.pop(this, list.stack);
			}
		}

		return this;
	}

	textWidth(text: string): number {
		return this.ctx.measureText(text).width;
	}

	async getBitmap(): Promise<ImageBitmap> {
		const s = this.state;
		return createImageBitmap(this.canvas, s.x, s.y, s.width, s.height);
	}

	resizeCanvas(width: number, height: number): this {
		const smoothing = this.ctx.imageSmoothingEnabled;
		this.canvas.width = width;
		this.canvas.height = height;
		this.size(width, height);
		this.ctx.imageSmoothingEnabled = smoothing;
		return this;
	}

	inside(callback: EtchCallback<this>): this {
		const ctx = this.ctx;
		ctx.save();
		ctx.beginPath();
		ctx.rect(
			this.state.x,
			this.state.y,
			this.state.width,
			this.state.height
		);
		ctx.clip();
		callback(this);
		ctx.restore();
		
		return this;
	}

	temp(callback: EtchCallback<this>): this {
		const state = Etch.cloneState(this.state);
		this.ctx.save();
		callback(this);
		this.ctx.restore();
		this.state = state;
		return this;
	}

	/**
	 * Sets global composite operation
	 * Default is source-over
	 */
	rendering(mode: globalThis.GlobalCompositeOperation = "source-over"): this {
		this.ctx.globalCompositeOperation = mode;
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

	color(color: string): this {
		this.ctx.fillStyle = color;
		this.state.fill = color;
		return this;
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

	rectangle(options?: {}): this {
		const s = this.state;
		this.ctx.fillRect(s.x, s.y, s.width, s.height);
		return this;
	}

	circle(override?: OverrideCircleOptions): this {
		const s = this.state;

		CanvasRender.circle(this.ctx, {
			x: s.x,
			y: s.y,
			radius: s.width,
			...override,
		});

		return this;
	}

	image(
		image: RenderableInput,
		options?: RenderableImageOptions
		// from?: VecRectangle,
		// to: VecRectangle = this.asVec()
	): this {
		options = Object.assign({}, options);
		options.to ??= this.asVec();

		CanvasRender.Image(this.ctx, image, options);

		return this;
	}

	/**
	 * Renders text
	 */
	text(text: string): this {
		const [x, y] = this.asVec();
		CanvasRender.text(this.ctx, text, { x, y });
		return this;
	}

	//#endregion
}

export { Etch, EtchStack, EtchUtility };
export type { EtchState, EtchOptions };
