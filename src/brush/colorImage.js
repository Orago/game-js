import { rgbToHue, forceRgb } from '@orago/lib/colors';
import BrushCanvas, { ChainableCanvas } from './brush.js';

const colorableCanvas = new BrushCanvas({
	inputCanvas: document.createElement('canvas')
});

const colorChain = colorableCanvas.chainable;


/**
 * @typedef {[red: number, green: number, blue: number]} rgbArray
 */

/** 
 * Draws an overlay tint to canvas
 * ! WARNING it is extremely slow
 * @param {HTMLCanvasElement | HTMLImageElement} image Image or HTMLCanvasElement reference
 * @param {number} red (Defaults to 0)
 * @param {number} green (Defaults to 0)
 * @param {number} blue (Defaults to 0)
 * @returns {HTMLCanvasElement}
 * @deprecated
 */
function badlyColorImage(
	image,
	red = 0,
	green = 0,
	blue = 0
) { // image is a canvas image
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
 * -
 * @param {HTMLCanvasElement | HTMLImageElement} sprite Image or HTMLCanvasElement reference
 * @param {[
 *  red?: number,
 *  green?: number,
 *  blue?: number,
 *  tint?: number
 * ]} param1
 * @returns {sprite}
 */
export function rgbTintImage(
	sprite,
	[
		red = 0,
		green = 0,
		blue = 0,
		tint = .2
	]
) {
	const image = new Image();

	// Pre draw
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

	if (colorChain.canvas instanceof HTMLCanvasElement){
		image.src = colorChain.canvas.toDataURL('image/png');
	}

	return sprite;
}


/**
 * Old default is 100
 * @param {ChainableCanvas} chain
 * @param {number} light  
 */
function lightenOverlay(chain, light) {
	if (typeof light != 'number')
		return;

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
 * @param {ChainableCanvas} chain
 * @param {number} saturation 
 */
function saturateOverlay(chain, saturation) {
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
 * @param {ChainableCanvas} chain 
 * @param {HTMLCanvasElement|HTMLImageElement} sprite 
 */
function plainDraw(chain, sprite) {
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
 * @param {ChainableCanvas} chain 
 * @param {number} hue 
 */
function hueOverlay(chain, hue) {
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
 * @param {ChainableCanvas} chain 
 * @param {HTMLImageElement | HTMLCanvasElement} sprite 
 */
function clipEditFrom(chain, sprite) {
	chain
		.rendering('destination-in')
		.image(sprite)
		.rendering('source-over')
}

/**
 * @typedef {object} hslTintOptions
 * @property {number} [saturation = 100] - Color depth
 * @property {number} [light = 100] - brightness
 * @property {rgbArray} [rgb] - Color Array
 * @property {*} [tint] - Tint
 * @property {number} [hue] - Hue rotate
 */

/** 
 * Checks if all items in an array match
 * Best image color manipulation method
 * -
 * @param {HTMLCanvasElement | HTMLImageElement} sprite
 * @param {hslTintOptions} options - Custom options
 * @returns {sprite}
 */
export function hslTintImage(sprite, options) {
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

	if (colorChain.canvas instanceof HTMLCanvasElement){
		image.src = colorChain.canvas.toDataURL('image/png');
	}

	return image;
}