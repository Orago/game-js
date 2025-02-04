import { type Point } from '@orago/lib/vector';
export interface Rectangle {
    width: number;
    height: number;
}
export type Circle = {
    r: number;
} & Point;
export type PositionedRectangle = Rectangle & Point;
/**
 * @deprecated
 * @see {PositionedRectangle}
 */
export type RectWithPosition = PositionedRectangle;
/**
 * @deprecated
 */
export interface RectOrPosition {
    x: number;
    y: number;
    width?: number;
    height?: number;
}
export type LikeBounds = [
    x1: number,
    y1: number,
    x2: number,
    y2: number
];
export declare class RectangleUtil {
    static scaleToFitRatio(container: Rectangle, child: Rectangle): number;
    static scaleToFit(container: Rectangle, child: Rectangle): Rectangle;
    static scale(width: number, height: number, scale: number): Rectangle;
    static from(obj: Rectangle): RectangleUtil;
    static contains(parent: PositionedRectangle, child: Point & Partial<Rectangle>): boolean;
    static centerChild(parent: PositionedRectangle, child: Rectangle): PositionedRectangle;
    static toBound(rect: Rectangle & {
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
     * @returns {RectangleUtil}
     */
    scaled(scale: number): RectangleUtil;
    toFit(_?: Rectangle): RectangleUtil;
}
export declare class RectBody extends RectangleUtil {
    static toBoundingBox(rect: RectBody | RectangleUtil): Bound | undefined;
    /**
     * @deprecated
     * Moved to RectangleUtil.contains
     */
    static contains: typeof RectangleUtil.contains;
    /**
     * @deprecated
     * Moved to RectangleUtil.centerChild
     */
    static centered: typeof RectangleUtil.centerChild;
    x: number;
    y: number;
    constructor(x: number, y: number, width?: number, height?: number);
    get pos(): Point;
    set pos(vector2: Point);
    copy(): RectBody;
    move(input: Point): RectBody;
    move(x: number, y: number): RectBody;
}
export declare class Bound {
    static toPositionalRect(bound: Bound): RectBody;
    positions: LikeBounds;
    constructor(x1?: number, y1?: number, x2?: number, y2?: number);
    clear(): void;
    set(...items: LikeBounds[]): void;
    toRect(): RectBody;
    get valid(): boolean;
    [Symbol.iterator](): Generator<number, void, unknown>;
}
