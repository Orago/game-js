import { ChainableCanvas } from './brush.js';
export type rgbArray = [red: number, green: number, blue: number];
/**
 * Draws an overlay tint to canvas
 * Faster yet slightly different version of badlyColorImage
 */
export declare function rgbTintImage(sprite: HTMLCanvasElement | HTMLImageElement, [red, green, blue, tint]: [
    red?: number,
    green?: number,
    blue?: number,
    tint?: number
]): typeof sprite;
/**
 * Old default is 100
 */
export declare function lightenOverlay(chain: ChainableCanvas, light: number): void;
/**
 * Saturates the image
 * Old default is 100
 */
export declare function saturateOverlay(chain: ChainableCanvas, saturation: number): void;
/**
 * Quickly Sets canvas size and draws sprite once
 */
export declare function plainDraw(chain: ChainableCanvas, sprite: HTMLCanvasElement | HTMLImageElement): void;
/**
 * Tints overlay with Hue
 */
export declare function hueOverlay(chain: ChainableCanvas, hue: number): void;
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
export declare function hslTintImage(sprite: HTMLCanvasElement | HTMLImageElement, options: hslTintOptions): HTMLImageElement;
export {};
