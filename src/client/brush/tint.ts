import { forceRgb, rgbToHue } from "@orago/lib/colors";
import { Size, VecRectangle } from "@orago/lib/math";
import { SizedImageSource } from "./render.js";
export type RgbArray = [red: number, green: number, blue: number];

const canvas: HTMLCanvasElement = document.createElement("canvas");
const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;

export interface HslTint {
	saturation?: number;
	light?: number;
	hue?: number;
}

export interface HslTintOptions {
	override?: HslTint;
	hsl?: HslTint;
	rgb?: RgbArray;
	value?: any;
	smoothing?: boolean;
}

type BoxedCtxRef = (ctx: CanvasRenderingContext2D, size: Size) => void;

export class TintImage {
	static rgbToHsl(RGB: [r: number, g: number, b: number]) {
		let r = RGB[0] / 255;
		let g = RGB[1] / 255;
		let b = RGB[2] / 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const delta = max - min;

		let h = 0,
			s = 0;
		const l = (max + min) / 2;

		if (delta !== 0) {
			s = delta / (1 - Math.abs(2 * l - 1));

			if (max === r) {
				h = ((g - b) / delta) % 6;
			} else if (max === g) {
				h = (b - r) / delta + 2;
			} else {
				h = (r - g) / delta + 4;
			}

			h *= 60;
			if (h < 0) h += 360;
		}

		return {
			h: Math.round(h),
			s: Math.round(s * 100),
			l: Math.round(l * 100),
		};
	}

	private static setupTint(
		canvas: HTMLCanvasElement,
		ctx: CanvasRenderingContext2D,
		source: Size,
		ref: BoxedCtxRef
	) {
		const smoothing = ctx.imageSmoothingEnabled;
		canvas.width = source.width;
		canvas.height = source.height;
		ctx.imageSmoothingEnabled = smoothing;
		ctx.clearRect(0, 0, source.width, source.height);
		ref(ctx, source);

		ctx.globalCompositeOperation = "source-over";
	}
	/**
	 * Old default is 100
	 */
	private static lightenOverlay(
		ctx: CanvasRenderingContext2D,
		box: Size,
		light: number
	) {
		if (typeof light != "number") {
			return;
		}

		ctx.globalCompositeOperation =
			light < 100 ? "color-burn" : "color-dodge";

		// chain.rendering(light < 100 ? "color-burn" : "color-dodge");

		// Modify future light after color-effect
		light = light >= 100 ? light - 100 : 100 - (100 - light);
		ctx.fillStyle = `hsl(0, 50%, ${light}%)`;
		ctx.fillRect(0, 0, box.width, box.height);

		// light
		// chain.color(`hsl(0, 50%, ${light}%)`).rect;
	}

	/**
	 * Saturates the image
	 * Old default is 100
	 */
	private static saturateOverlay(
		ctx: CanvasRenderingContext2D,
		box: Size,
		saturation: number
	) {
		if (typeof saturation != "number") {
			return;
		}

		ctx.globalCompositeOperation = "saturation";
		ctx.fillStyle = `hsl(0,${saturation}%, 50%)`;
		ctx.fillRect(0, 0, box.width, box.height);
		// chain.rendering("saturation").color(`hsl(0,${saturation}%, 50%)`).rect;
	}

	/**
	 * Used to clip over the same image and remove excess pixels quickly
	 */
	private static clipEditFrom(
		ctx: CanvasRenderingContext2D,
		size: Size,
		ref: BoxedCtxRef
	) {
		ctx.globalCompositeOperation = "destination-in";
		ref(ctx, size);
		ctx.globalCompositeOperation = "source-over";
	}

	/**
	 * Tints overlay with Hue
	 */
	private static hueOverlay(
		ctx: CanvasRenderingContext2D,
		box: Size,
		hue: number
	) {
		if (typeof hue != "number") {
			return;
		}
		ctx.globalCompositeOperation = "hue";
		ctx.fillStyle = `hsl(${hue},10%, 50%)`;
		ctx.fillRect(0, 0, box.width, box.height);
	}

	public static normalizeHsl(options: HslTintOptions): HslTint {
		if (options.hsl != undefined) {
			return options.hsl;
		} else if (options.rgb != undefined) {
			const hsl = TintImage.rgbToHsl(options.rgb);
			return {
				hue: hsl.h,
				saturation: hsl.s,
				light: hsl.l,
			};
		} else if (options.value != undefined) {
			const rgb = forceRgb(options.value);
			const hsl = TintImage.rgbToHsl(rgb);
			return {
				hue: hsl.h,
				saturation: hsl.s,
				light: hsl.l,
			};
		} else {
			const hsl = TintImage.rgbToHsl([255 / 2, 255 / 2, 255 / 2]);

			return {
				hue: hsl.h,
				saturation: hsl.s,
				light: hsl.l,
			};
		}
	}

	/**
	 * Checks if all items in an array match
	 * Best image color manipulation method
	 */
	public static hslAffect(
		size: Size,
		options: HslTintOptions,
		ref: BoxedCtxRef
	): HTMLCanvasElement {
		const hsl = TintImage.normalizeHsl(options);
		const light = options?.override?.light ?? hsl.light;
		const saturation = options?.override?.saturation ?? hsl.saturation;
		const hue = options?.override?.hue ?? hsl.hue;

		this.setupTint(canvas, ctx, size, ref);

		if (options.smoothing != undefined) {
			ctx.imageSmoothingEnabled = options.smoothing;
		}

		if (typeof light === "number") {
			this.lightenOverlay(ctx, size, light);
		}
		if (typeof saturation === "number") {
			this.saturateOverlay(ctx, size, saturation);
		}
		if (typeof hue === "number") {
			this.hueOverlay(ctx, size, hue);
		}

		this.clipEditFrom(ctx, size, ref);
		return canvas;
	}

	public static hslImage(
		sprite: SizedImageSource,
		options: HslTintOptions
	): HTMLCanvasElement {
		return this.hslAffect(sprite, options, () =>
			ctx.drawImage(sprite, 0, 0)
		);
	}
}
