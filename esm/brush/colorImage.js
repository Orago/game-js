import { rgbToHue, forceRgb } from '@orago/lib/colors';
import BrushCanvas from './brush.js';
const colorableCanvas = new BrushCanvas({
    inputCanvas: document.createElement('canvas')
});
const colorChain = colorableCanvas.chainable;
function badlyColorImage(image, red = 0, green = 0, blue = 0) {
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
export function rgbTintImage(sprite, [red = 0, green = 0, blue = 0, tint = .2]) {
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
function lightenOverlay(chain, light) {
    if (typeof light != 'number') {
        return;
    }
    chain
        .rendering(light < 100 ? 'color-burn' : 'color-dodge');
    light = light >= 100 ? light - 100 : 100 - (100 - light);
    chain
        .color(`hsl(0, 50%, ${light}%)`)
        .rect;
}
function saturateOverlay(chain, saturation) {
    if (typeof saturation != 'number') {
        return;
    }
    chain
        .rendering('saturation')
        .color(`hsl(0,${saturation}%, 50%)`)
        .rect;
}
function plainDraw(chain, sprite) {
    chain
        .canvasSize(sprite.width, sprite.height)
        .size(sprite.width, sprite.height)
        .clear
        .pos(0, 0)
        .rendering('source-over')
        .image(sprite);
}
function hueOverlay(chain, hue) {
    if (typeof hue != 'number') {
        return;
    }
    chain
        .rendering('hue')
        .color(`hsl(${hue},10%, 50%)`)
        .rect;
}
function clipEditFrom(chain, sprite) {
    chain
        .rendering('destination-in')
        .image(sprite)
        .rendering('source-over');
}
export function hslTintImage(sprite, options) {
    plainDraw(colorChain, sprite);
    if (typeof (options === null || options === void 0 ? void 0 : options.light) === 'number') {
        lightenOverlay(colorChain, options.light);
    }
    if (typeof (options === null || options === void 0 ? void 0 : options.saturation) === 'number') {
        saturateOverlay(colorChain, options.saturation);
    }
    if ((options === null || options === void 0 ? void 0 : options.rgb) != null) {
        hueOverlay(colorChain, rgbToHue(...forceRgb(options.rgb)));
    }
    else if ((options === null || options === void 0 ? void 0 : options.tint) != null) {
        hueOverlay(colorChain, rgbToHue(...forceRgb(options.tint)));
    }
    else if (typeof (options === null || options === void 0 ? void 0 : options.hue) === 'number') {
        hueOverlay(colorChain, options.hue);
    }
    clipEditFrom(colorChain, sprite);
    const image = new Image();
    if (colorChain.canvas instanceof HTMLCanvasElement) {
        image.src = colorChain.canvas.toDataURL('image/png');
    }
    return image;
}
