import type { Point } from "@orago/lib";
/**
 * @deprecated
 */
export interface RectangleLike {
    width: number;
    height: number;
}
/**
 * @deprecated
 */
export type CircleLike = {
    r: number;
} & Point;
/**
 * @deprecated
 */
export type PositionedRectangleLike = RectangleLike & Point;
/**
 * @deprecated
 */
export type BoundsLike = [x1: number, y1: number, x2: number, y2: number];
export declare class Rect {
    static scaleToFitRatio(container: RectangleLike, child: RectangleLike): number;
    static scaleToFit(container: RectangleLike, child: RectangleLike): RectangleLike;
    static scale(width: number, height: number, scale: number): RectangleLike;
    static from(obj: RectangleLike): Rect;
    static contains(parent: PositionedRectangleLike, child: Point & Partial<RectangleLike>): boolean;
    static centerChild(parent: PositionedRectangleLike, child: RectangleLike): PositionedRectangleLike;
    static toBound(rect: RectangleLike & {
        x?: number;
        y?: number;
    }): [x: number, y: number, width: number, height: number];
    width: number;
    height: number;
    constructor(width: number, height: number);
    [Symbol.iterator](): Generator<number, void, unknown>;
    /**
     * Upscales rectangle by scale factor
     * @param {number} scale
     * @returns {Rect}
     */
    scaled(scale: number): Rect;
    toFit(_?: RectangleLike): Rect;
}
export declare class Box extends Rect {
    static toBoundingBox(rect: Box | Rect): Bound | undefined;
    x: number;
    y: number;
    constructor(x: number, y: number, width?: number, height?: number);
    position(): Point;
    position(vector2: Point): this;
    clone(): Box;
    move(input: Point): Box;
    move(x: number, y: number): Box;
}
export declare class Bound {
    static toPositionalRect(bound: Bound): Box;
    positions: BoundsLike;
    constructor(x1?: number, y1?: number, x2?: number, y2?: number);
    clear(): void;
    set(...items: BoundsLike[]): void;
    toRect(): Box;
    get valid(): boolean;
    [Symbol.iterator](): Generator<number, void, unknown>;
}
