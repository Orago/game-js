import { ChainableCanvas } from './brush.js';
export type rgbArray = [red: number, green: number, blue: number];
export declare function rgbTintImage(sprite: HTMLCanvasElement | HTMLImageElement, [red, green, blue, tint]: [
    red?: number,
    green?: number,
    blue?: number,
    tint?: number
]): typeof sprite;
export declare function lightenOverlay(chain: ChainableCanvas, light: number): void;
export declare function saturateOverlay(chain: ChainableCanvas, saturation: number): void;
export declare function plainDraw(chain: ChainableCanvas, sprite: HTMLCanvasElement | HTMLImageElement): void;
export declare function hueOverlay(chain: ChainableCanvas, hue: number): void;
interface hslTintOptions {
    saturation?: number;
    light?: number;
    rgb?: rgbArray;
    tint?: any;
    hue?: number;
}
export declare function hslTintImage(sprite: HTMLCanvasElement | HTMLImageElement, options: hslTintOptions): HTMLImageElement;
export {};
