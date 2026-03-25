import type { Point } from "@orago/lib";
import { Size } from "@orago/lib";
import Emitter from "@orago/lib/emitter";
import { ChainableCanvas } from "./chainable-canvas.js";
import { Etch, EtchOptions } from "./etch.js";
export { ChainableCanvas } from "./chainable-canvas.js";
type ArrayRect = [x: number, y: number, w: number, h: number];
export default class BrushCanvas {
    resolution: number;
    smoothing: boolean;
    /**
     * Both are intentionally unset and will be set using BrushCanvas.swapCanvas
     */
    readonly canvas: HTMLCanvasElement;
    readonly ctx: CanvasRenderingContext2D;
    events: Emitter<{}, false>;
    private experimental;
    private onResize;
    constructor(settings?: {
        dimensions?: [width: number, height: number];
        inputCanvas?: HTMLCanvasElement;
        resolution?: number;
        experimental_gl?: boolean;
    });
    updateResolution(resolution: number): void;
    updateSize(width: number, height: number): void;
    center(): Point;
    dimensions(): Size;
    /**
     * Makes brush the active dom element
     */
    focus(): void;
    get width(): number;
    get height(): number;
    /**
     * @deprecated
     */
    forceDimensions({ width, height }: {
        width: number;
        height: number;
    }): void;
    image(image: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas, from?: ArrayRect, to?: ArrayRect): this;
    text(values: {
        text: string;
        color: string;
        x?: number;
        y?: number;
        font?: string;
        weight?: string;
        size?: number;
    }): void;
    shape(values: {
        x?: number;
        y?: number;
        w?: number;
        h?: number;
        color?: string;
    }): void;
    circle(values?: any): void;
    gradient({ shape, percent: { w: percentW, h: percentH }, colorStart, colorEnd, x, y, w, h, radius, }?: {
        shape?: string | undefined;
        percent?: {
            w?: number | undefined;
            h?: number | undefined;
        } | undefined;
        colorStart?: string | undefined;
        colorEnd?: string | undefined;
        x?: number | undefined;
        y?: number | undefined;
        w?: number | undefined;
        h?: number | undefined;
        radius?: number | undefined;
    }): void;
    /**
     * Please use EtchUtility.getTextWidth
     * @deprecated
     */
    getTextWidth(values: {
        text: string;
        font?: string;
        size?: number;
    }): number;
    clear(): this;
    clearRect(x: number, y: number, width: number, height: number): this;
    /**
     * Toggles smoothing
     * ON - blurred when using low resolution assets and smooth on high resolution
     * OFF - Crisp on low resolution assets and jagged on high resolution
     */
    setSmoothing: (state: boolean) => this;
    resizable(): this;
    getEtch(options: Omit<EtchOptions, "canvas" | "ctx">): Etch;
    get get(): this;
    get chainable(): ChainableCanvas;
}
