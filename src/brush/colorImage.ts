import { rgbToHue, forceRgb } from '@orago/lib/colors';
import BrushCanvas, { ChainableCanvas } from './brush.js';

const colorableCanvas = new BrushCanvas({
	inputCanvas: document.createElement('canvas')
});

const colorChain = colorableCanvas.chainable;

export type rgbArray = [red: number, green: number, blue: number];

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
): HTMLCanvasElement { // image is a canvas image
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

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
	[
		red = 0,
		green = 0,
		blue = 0,
		tint = .2
	]: [
			red?: number,
			green?: number,
			blue?: number,
			tint?: number
		]
): typeof sprite {
	const image = new Image();

	colorChain
		.canvasSize(sprite.width, sprite.height)
		.size(sprite.width, sprite.height)
		.clear
		.pos(0, 0)
		.image(sprite);

	colorChain
		.opacity(tint)
		.rendering('source-atop')
		.color(`rgb(${[red, green, blue].join(',')})`)
		.rect.rendering('source-over');

	if (colorChain.canvas instanceof HTMLCanvasElement) {
		image.src = colorChain.canvas.toDataURL('image/png');
	}

	return sprite;
}


/**
 * Old default is 100
 */
function lightenOverlay(chain: ChainableCanvas, light: number) {
	if (typeof light != 'number') {
		return;
	}

	chain
		.rendering(light < 100 ? 'color-burn' : 'color-dodge')

	// Modify future light after color-effect
	light = light >= 100 ? light - 100 : 100 - (100 - light);

	// light
	chain
		.color(`hsl(0, 50%, ${light}%)`)
		.rect
}

/**
 * Saturates the image
 * Old default is 100
 */
function saturateOverlay(chain: ChainableCanvas, saturation: number) {
	if (typeof saturation != 'number') {
		return;
	}

	chain
		.rendering('saturation')
		.color(`hsl(0,${saturation}%, 50%)`)
		.rect
}

/**
 * Quickly Sets canvas size and draws sprite once
 */
function plainDraw(chain: ChainableCanvas, sprite: HTMLCanvasElement | HTMLImageElement) {
	chain
		.canvasSize(
			sprite.width,
			sprite.height
		)
		.size(
			sprite.width,
			sprite.height
		)
		.clear
		.pos(0, 0)
		.rendering('source-over')
		.image(sprite);
}

/**
 * Tints overlay with Hue
 */
function hueOverlay(chain: ChainableCanvas, hue: number) {
	if (typeof hue != 'number') {
		return;
	}

	chain
		.rendering('hue')
		.color(`hsl(${hue},10%, 50%)`)
		.rect;
}

/**
 * Used to clip over the same image and remove excess pixels quickly
 */
function clipEditFrom(chain: ChainableCanvas, sprite: HTMLImageElement | HTMLCanvasElement) {
	chain
		.rendering('destination-in')
		.image(sprite)
		.rendering('source-over')
}

interface hslTintOptions {
	saturation?: number;
	light?: number;
	rgb?: rgbArray;
	tint?: any;
	hue?: number;
}

/** 
 * Checks if all items in an array match
 * Best image color manipulation method
 */
export function hslTintImage(sprite: HTMLCanvasElement | HTMLImageElement, options: hslTintOptions): HTMLImageElement {
	plainDraw(colorChain, sprite);

	if (typeof options?.light === 'number') {
		lightenOverlay(colorChain, options.light);
	}

	if (typeof options?.saturation === 'number') {
		saturateOverlay(colorChain, options.saturation)
	}

	if (options?.rgb != null) {
		hueOverlay(
			colorChain,
			rgbToHue(...forceRgb(options.rgb))
		);
	} else if (options?.tint != null) {
		hueOverlay(
			colorChain,
			rgbToHue(...forceRgb(options.tint))
		);
	} else if (typeof options?.hue === 'number') {
		hueOverlay(
			colorChain,
			options.hue
		);
	}

	// Clipping
	clipEditFrom(colorChain, sprite);

	const image = new Image();

	if (colorChain.canvas instanceof HTMLCanvasElement) {
		image.src = colorChain.canvas.toDataURL('image/png');
	}

	return image;
}