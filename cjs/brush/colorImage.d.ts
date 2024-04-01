export type rgbArray = [red: number, green: number, blue: number];
export declare function rgbTintImage(sprite: HTMLCanvasElement | HTMLImageElement, [red, green, blue, tint]: [
    red?: number,
    green?: number,
    blue?: number,
    tint?: number
]): typeof sprite;
interface hslTintOptions {
    saturation?: number;
    light?: number;
    rgb?: rgbArray;
    tint?: any;
    hue?: number;
}
export declare function hslTintImage(sprite: HTMLCanvasElement | HTMLImageElement, options: hslTintOptions): HTMLImageElement;
export {};
