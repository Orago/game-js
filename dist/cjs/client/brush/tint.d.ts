import { Size } from "@orago/lib/math";
import { SizedImageSource } from "./render.js";
export type RgbArray = [red: number, green: number, blue: number];
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
}
type BoxedCtxRef = (ctx: CanvasRenderingContext2D, size: Size) => void;
export declare class TintImage {
    static rgbToHsl(RGB: [r: number, g: number, b: number]): {
        h: number;
        s: number;
        l: number;
    };
    private static setupTint;
    /**
     * Old default is 100
     */
    private static lightenOverlay;
    /**
     * Saturates the image
     * Old default is 100
     */
    private static saturateOverlay;
    /**
     * Used to clip over the same image and remove excess pixels quickly
     */
    private static clipEditFrom;
    /**
     * Tints overlay with Hue
     */
    private static hueOverlay;
    static normalizeHsl(options: HslTintOptions): HslTint;
    /**
     * Checks if all items in an array match
     * Best image color manipulation method
     */
    static hslAffect(size: Size, options: HslTintOptions, ref: BoxedCtxRef): HTMLCanvasElement;
    static hslImage(sprite: SizedImageSource, options: HslTintOptions): HTMLCanvasElement;
}
export {};
