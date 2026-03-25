import type { Point } from "@orago/lib";
import { Size } from "@orago/lib";
import Emitter, { Signal } from "@orago/lib/emitter";
import { ChainableCanvas } from "./chainable-canvas.js";
import { Etch, EtchOptions, EtchUtility } from "./etch.js";
import { CanvasRender } from "./render.js";
export { ChainableCanvas } from "./chainable-canvas.js";

type ArrayRect = [x: number, y: number, w: number, h: number];

export default class BrushCanvas {
	public resolution: number = 1;
	public smoothing: boolean = true;

	/**
	 * Both are intentionally unset and will be set using BrushCanvas.swapCanvas
	 */
	public readonly canvas: HTMLCanvasElement;
	public readonly ctx: CanvasRenderingContext2D =
		undefined as unknown as CanvasRenderingContext2D;
	public events = new Emitter();
	private experimental: boolean = false;

	private onResize: Signal<(width: number, height: number) => void> =
		new Signal();

	constructor(
		settings: {
			dimensions?: [width: number, height: number];
			inputCanvas?: HTMLCanvasElement;
			resolution?: number;
			experimental_gl?: boolean;
		} = {}
	) {
		if (typeof settings != "object") settings = {};

		const {
			dimensions = [100, 100],
			inputCanvas: canvas = document.createElement("canvas"),
		} = settings;

		canvas.width = dimensions[0];
		canvas.height = dimensions[1];

		this.onResize.on((width, height) => {
			this.events.emit("resize", width, height);
		});

		this.canvas = canvas;

		if (settings?.experimental_gl == true) {
			this.experimental = true;
			// WebGLCanvas.affect(canvas);
			const ctx = this.canvas.getContext("webgl-2d");
			this.ctx = ctx as CanvasRenderingContext2D;
		}

		const ctx = this.canvas.getContext("2d");
		this.ctx = ctx as CanvasRenderingContext2D;

		if (Array.isArray(dimensions)) this.updateSize(...dimensions);
	}

	updateResolution(resolution: number) {
		// const amount = ForceType.Number(resolution);
		// this.resolution = clamp(amount, { min: .5, max: 1 });
	}

	updateSize(width: number, height: number) {
		this.canvas.width = width;
		this.canvas.height = height;
		this.events.emit("resize", width, height);
		this.setSmoothing(this.smoothing);
	}

	center(): Point {
		return { x: this.width / 2, y: this.height / 2 };
	}
	dimensions(): Size {
		return { width: this.width, height: this.height };
	}

	/**
	 * Makes brush the active dom element
	 */
	focus() {
		if (this.canvas) this.canvas.focus();
	}

	get width() {
		return this.canvas.width;
	}
	get height() {
		return this.canvas.height;
	}

	/**
	 * @deprecated
	 */
	forceDimensions({ width, height }: { width: number; height: number }) {
		if (typeof width == "number" && this.canvas.width != width)
			this.canvas.width = width;

		if (typeof height == "number" && this.canvas.height != height)
			this.canvas.height = height;
	}

	image(
		image: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas,
		from?: ArrayRect,
		to?: ArrayRect
	): this {
		CanvasRender.Image(this.ctx, image, { from, to });
		return this;
	}

	text(values: {
		text: string;
		color: string;
		x?: number;
		y?: number;
		font?: string;
		weight?: string;
		size?: number;
	}): void {
		if (this.ctx instanceof CanvasRenderingContext2D != true) return;

		let { text, color, x = 0, y = 0, font, weight, size } = values;

		x |= 0;
		y |= 0;

		this.chainable
			.generatedFont({
				font,
				weight,
				size,
			})
			.color(color)
			.pos(x, y)
			.text(text);
	}

	shape(values: {
		x?: number;
		y?: number;
		w?: number;
		h?: number;
		color?: string;
	}) {
		if (this.ctx instanceof CanvasRenderingContext2D != true) return;

		let { color = "pink", x = 0, y = 0, w = 0, h = 0 } = values;

		x |= 0;
		y |= 0;
		w |= 0;
		h |= 0;

		this.chainable.color(color).size(w, h).pos(x, y).rect;
	}

	circle(values?: any) {
		CanvasRender.circle(this.ctx, values);
	}

	gradient({
		shape = "square",
		percent: { w: percentW = 0, h: percentH = 0 } = {},
		colorStart = "black",
		colorEnd = "white",
		x = 0,
		y = 0,
		w = 0,
		h = 0,
		radius = 0.5,
	} = {}) {
		if (this.ctx instanceof CanvasRenderingContext2D != true) return;

		const { ctx } = this;
		const [gx, gy] = [x + w * percentW, y + h * percentH];

		let gradient;

		if (shape == "radial")
			gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * radius);
		else gradient = ctx.createLinearGradient(gx, gy, x + w, y + h);

		gradient.addColorStop(0, colorStart);
		gradient.addColorStop(1, colorEnd);

		ctx.fillStyle = gradient;
		ctx.fillRect(x, y, w, h);
	}
	/**
	 * Please use EtchUtility.getTextWidth
	 * @deprecated
	 */
	getTextWidth(values: {
		text: string;
		font?: string;
		size?: number;
	}): number {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		if (ctx) ctx.font = "";

		if (
			typeof values.font === "string" ||
			typeof values.size === "number"
		) {
			this.text({
				color: "white",
				font: values.font || "Tahoma",
				size: values.size || 20,
				text: "",
				x: -10000,
				y: -10000,
			});
		}

		return this.ctx.measureText(values.text).width;
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		return this;
	}

	clearRect(x: number, y: number, width: number, height: number): this {
		this.ctx.clearRect(x, y, width, height);

		return this;
	}

	/**
	 * Toggles smoothing
	 * ON - blurred when using low resolution assets and smooth on high resolution
	 * OFF - Crisp on low resolution assets and jagged on high resolution
	 */
	setSmoothing = (state: boolean): this => {
		if (this.experimental) return this;

		this.ctx.imageSmoothingEnabled = this.smoothing = state == true;

		return this;
	};

	resizable() {
		EtchUtility.resizable({
			canvas: this.canvas,
			setSmoothing: this.setSmoothing.bind(this),
			resolution: this.resolution,
			onResize: this.onResize,
		});
		return this;
	}

	getEtch(options: Omit<EtchOptions, "canvas" | "ctx">) {
		return new Etch({
			canvas: this.canvas,
			ctx: this.ctx,
			stack: options?.stack ?? true,
		});
	}

	get get() {
		return this;
	}
	get chainable() {
		return new ChainableCanvas(this);
	}
}
