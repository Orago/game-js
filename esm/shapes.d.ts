import { type Point } from '@orago/lib/vector';
export interface Rectangle {
    width: number;
    height: number;
}
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
    static scaleToFit(containerWidth: number, containerHeight: number, rectWidth: number, rectHeight: number): RectangleUtil;
    static scale(width: number, height: number, scale: number): RectangleUtil;
    static FromObj(obj: Rectangle): RectangleUtil;
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
    static contains(parent: PositionedRectangle, child: PositionedRectangle): boolean;
    static centered(parent: RectBody, child: Rectangle): RectBody;
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
    set(...items: Array<[
        x1: number,
        x2: number,
        y1: number,
        y2: number
    ]>): void;
    toRect(): RectBody;
    get valid(): boolean;
    [Symbol.iterator](): Generator<number, void, unknown>;
}
