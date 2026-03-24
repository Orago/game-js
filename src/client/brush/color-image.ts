import { rgbToHue, forceRgb } from "@orago/lib/colors";
import BrushCanvas, { ChainableCanvas } from "./brush.js";

export type RgbArray = [red: number, green: number, blue: number];

const colorable_canvas = new BrushCanvas({
	inputCanvas: document.createElement("canvas"),
});

const color_chain = colorable_canvas.chainable;

/**
 * Draws an overlay tint to canvas
 * ! WARNING it is extremely slow
 * @deprecated
 */
function badlyColorImage(
	image: HTMLCanvasElement | HTMLImageElement,
	red: number = 0,
	green: number = 0,
	blue: number = 0
): HTMLCanvasElement {
	// image is a canvas image
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	if (ctx instanceof CanvasRenderingContext2D) {
		const { width, height } = image;

		canvas.width = width;
		canvas.height = height;

		ctx.drawImage(image, 0, 0);

		const myImg = ctx.getImageData(0, 0, width, height);

		for (let t = 0; t < myImg.data.length; t += 4) {
			myImg.data[t] += red;
			myImg.data[t + 1] += green;
			myImg.data[t + 2] += blue;
		}

		ctx.clearRect(0, 0, width, height);
		ctx.putImageData(myImg, 0, 0);
	}

	return canvas;
}

/**
 * Draws an overlay tint to canvas
 * Faster yet slightly different version of badlyColorImage
 */
export function rgbTintImage(
	sprite: HTMLCanvasElement | HTMLImageElement,
	[red = 0, green = 0, blue = 0, tint = 0.2]: [
		red?: number,
		green?: number,
		blue?: number,
		tint?: number
	]
): typeof sprite {
	const image = new Image();

	color_chain
		.canvasSize(sprite.width, sprite.height)
		.size(sprite.width, sprite.height)
		.clear.pos(0, 0)
		.image(sprite)

		.opacity(tint)
		.rendering("source-atop")
		.color(`rgb(${[red, green, blue].join(",")})`)
		.rect.rendering("source-over");

	if (color_chain.last_config.canvas instanceof HTMLCanvasElement) {
		image.src = color_chain.last_config.canvas.toDataURL("image/png");
	}

	return sprite;
}

/**
 * Old default is 100
 */
export function lightenOverlay(chain: ChainableCanvas, light: number) {
	if (typeof light != "number") {
		return;
	}

	chain.rendering(light < 100 ? "color-burn" : "color-dodge");

	// Modify future light after color-effect
	light = light >= 100 ? light - 100 : 100 - (100 - light);

	// light
	chain.color(`hsl(0, 50%, ${light}%)`).rect;
}

/**
 * Saturates the image
 * Old default is 100
 */
export function saturateOverlay(chain: ChainableCanvas, saturation: number) {
	if (typeof saturation != "number") {
		return;
	}

	chain.rendering("saturation").color(`hsl(0,${saturation}%, 50%)`).rect;
}

/**
 * Quickly Sets canvas size and draws sprite once
 */
export function plainDraw(
	chain: ChainableCanvas,
	sprite: HTMLCanvasElement | HTMLImageElement
) {
	chain
		.canvasSize(sprite.width, sprite.height)
		.size(sprite.width, sprite.height)
		.clear.pos(0, 0)
		.rendering("source-over")
		.image(sprite);
}

/**
 * Tints overlay with Hue
 */
export function hueOverlay(chain: ChainableCanvas, hue: number) {
	if (typeof hue != "number") {
		return;
	}

	chain.rendering("hue").color(`hsl(${hue},10%, 50%)`).rect;
}

/**
 * Used to clip over the same image and remove excess pixels quickly
 */
function clipEditFrom(
	chain: ChainableCanvas,
	sprite: HTMLImageElement | HTMLCanvasElement
) {
	chain.rendering("destination-in").image(sprite).rendering("source-over");
}

interface HslTintOptions {
	saturation?: number;
	light?: number;
	rgb?: RgbArray;
	tint?: any;
	hue?: number;
}

/**
 * Checks if all items in an array match
 * Best image color manipulation method
 */
export function hslTintImage(
	sprite: HTMLCanvasElement | HTMLImageElement,
	options: HslTintOptions
): HTMLImageElement {
	plainDraw(color_chain, sprite);

	if (typeof options?.light === "number") {
		lightenOverlay(color_chain, options.light);
	}

	if (typeof options?.saturation === "number") {
		saturateOverlay(color_chain, options.saturation);
	}

	if (options?.rgb != null) {
		hueOverlay(color_chain, rgbToHue(...forceRgb(options.rgb)));
	} else if (options?.tint != null) {
		hueOverlay(color_chain, rgbToHue(...forceRgb(options.tint)));
	} else if (typeof options?.hue === "number") {
		hueOverlay(color_chain, options.hue);
	}

	// Clipping
	clipEditFrom(color_chain, sprite);

	const image = new Image();

	if (color_chain.last_config.canvas instanceof HTMLCanvasElement) {
		image.src = color_chain.canvas.toDataURL("image/png");
	}

	return image;
}

export class TintImage {
	private static setupTintDraw(
		chain: ChainableCanvas,
		sprite: HTMLCanvasElement | HTMLImageElement
	) {
		chain
			.canvasSize(sprite.width, sprite.height)
			.size(sprite.width, sprite.height)
			.clear.pos(0, 0)
			.rendering("source-over")
			.image(sprite);
	}

	/**
	 * Old default is 100
	 */
	private static lightenOverlay(chain: ChainableCanvas, light: number) {
		if (typeof light != "number") {
			return;
		}

		chain.rendering(light < 100 ? "color-burn" : "color-dodge");

		// Modify future light after color-effect
		light = light >= 100 ? light - 100 : 100 - (100 - light);

		// light
		chain.color(`hsl(0, 50%, ${light}%)`).rect;
	}

	/**
	 * Saturates the image
	 * Old default is 100
	 */
	private static saturateOverlay(chain: ChainableCanvas, saturation: number) {
		if (typeof saturation != "number") {
			return;
		}

		chain.rendering("saturation").color(`hsl(0,${saturation}%, 50%)`).rect;
	}

	/**
	 * Used to clip over the same image and remove excess pixels quickly
	 */
	private static clipEditFrom(
		chain: ChainableCanvas,
		sprite: HTMLImageElement | HTMLCanvasElement
	) {
		chain
			.rendering("destination-in")
			.image(sprite)
			.rendering("source-over");
	}

	/**
	 * Tints overlay with Hue
	 */
	private static hueOverlay(chain: ChainableCanvas, hue: number) {
		if (typeof hue != "number") {
			return;
		}

		chain.rendering("hue").color(`hsl(${hue},10%, 50%)`).rect;
	}

	/**
	 * Checks if all items in an array match
	 * Best image color manipulation method
	 */
	public static hslTint(
		sprite: HTMLCanvasElement | HTMLImageElement,
		options: HslTintOptions
	): Promise<HTMLImageElement> {
		this.setupTintDraw(color_chain, sprite);

		if (typeof options?.light === "number") {
			this.lightenOverlay(color_chain, options.light);
		}

		if (typeof options?.saturation === "number") {
			this.saturateOverlay(color_chain, options.saturation);
		}

		if (options?.rgb != null) {
			this.hueOverlay(color_chain, rgbToHue(...forceRgb(options.rgb)));
		} else if (options?.tint != null) {
			this.hueOverlay(color_chain, rgbToHue(...forceRgb(options.tint)));
		} else if (typeof options?.hue === "number") {
			this.hueOverlay(color_chain, options.hue);
		}

		// Clipping
		this.clipEditFrom(color_chain, sprite);

		const image = new Image();

		if (color_chain.last_config.canvas instanceof HTMLCanvasElement) {
			image.src = color_chain.canvas.toDataURL("image/png");
			return new Promise((resolve) => {
				color_chain.canvas.toBlob((blob) => {
					const url = URL.createObjectURL(blob!);
					image.src = url;
					resolve(image);
				});
			});
		}

		return new Promise((resolve) => resolve(image));

		// return image;
	}
}
