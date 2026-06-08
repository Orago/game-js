import { Point, Signal } from "@orago/lib";
import { RenderableImageOptions, RenderableInput } from "./render.js";
import { VecRectangle } from "@orago/lib/math";
interface OverrideCircleOptions {
    x?: number;
    y?: number;
    radius?: number;
    percent?: number;
    stroke?: string;
    strokeWidth?: number;
}
interface GeneratedFontOptions {
    font?: string;
    weight?: string;
    size?: number;
}
interface EtchState {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    smoothing: boolean;
}
interface EtchOptions {
    canvas: Etch["canvas"];
    ctx: Etch["ctx"];
    stack?: boolean | EtchStack;
}
type EtchCallback<T extends Etch> = (etch: T) => void;
declare class EtchStack {
    static push(instance: Etch, stack: EtchState[], state: EtchState): void;
    static pop(instance: Etch, stack: EtchState[]): void;
    static init(instance: Etch, stack: EtchStack | boolean | undefined): void;
    stack: EtchState[];
}
declare class EtchUtility {
    static canvas: HTMLCanvasElement;
    static ctx: CanvasRenderingContext2D;
    static resizable(input: {
        canvas: HTMLCanvasElement;
        resolution: number;
        setSmoothing: (state: boolean) => void;
        onResize?: Signal<(width: number, height: number) => void>;
        absolute?: boolean;
    }): void;
    static generateFontString({ font, weight, size, }?: GeneratedFontOptions): string;
    static measureText(ctx: CanvasRenderingContext2D, font: string, text: string): TextMetrics;
    static getTextWidth(ctx: CanvasRenderingContext2D, font: string, text: string): number;
}
declare class Etch {
    static Stack: typeof EtchStack;
    static Utility: typeof EtchUtility;
    static identity(): EtchState;
    static cloneState(state: EtchState): EtchState;
    state: EtchState;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    stack?: EtchStack;
    constructor(brush: EtchOptions);
    asVec(): VecRectangle;
    ref(func: (arg0: this) => void): this;
    /**
     * Selects a region
     */
    select(x: number, y: number, width: number, height: number): this;
    selectAll(): this;
    /**
     * Changes the offset for all etch renders
     */
    position(x: number, y: number): this;
    /**
     * Changes the size for all etch renders
     */
    size(width: number, height: number): this;
    rotate(rotation: number, center?: Point): this;
    flip(axis: "x" | "y"): this;
    opacity(value: number): this;
    opacity(): number;
    /** Saves the current canvas state */
    save(list?: EtchStack | EtchState[] | undefined): this;
    /** Restores the current canvas state */
    restore(list?: EtchStack | EtchState[] | undefined): this;
    textWidth(text: string): number;
    getBitmap(): Promise<ImageBitmap>;
    resizeCanvas(width: number, height: number): this;
    inside(callback: EtchCallback<this>): this;
    temp(callback: EtchCallback<this>): this;
    /**
     * Sets global composite operation
     * Default is source-over
     */
    rendering(mode?: globalThis.GlobalCompositeOperation): this;
    smoothing(value: boolean): this;
    smoothing(): boolean;
    color(color: string): this;
    font(newFont: string): this;
    generatedFont({ font, weight, size, }?: GeneratedFontOptions): this;
    /**
     * Clears selected region
     */
    clear(): this;
    rectangle(options?: {}): this;
    circle(override?: OverrideCircleOptions): this;
    image(image: RenderableInput, options?: RenderableImageOptions): this;
    /**
     * Renders text
     */
    text(text: string, options?: {
        align: "top" | "center" | "bottom";
    }): this;
}
export { Etch, EtchStack, EtchUtility };
export type { EtchState, EtchOptions };
