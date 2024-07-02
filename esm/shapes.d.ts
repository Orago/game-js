import { Vector2 } from '@orago/vector';
export interface LikeRectangle {
    width: number;
    height: number;
}
export interface RectWithPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}
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
export declare class Rectangle {
    static scaleToFit(containerWidth: number, containerHeight: number, rectWidth: number, rectHeight: number): Rectangle;
    static scale(width: number, height: number, scale: number): Rectangle;
    static FromObj(obj: LikeRectangle): Rectangle;
    width: number;
    height: number;
    constructor(width: number, height: number);
    [Symbol.iterator](): Generator<number, void, unknown>;
    scaled(scale: number): Rectangle;
    toFit(_?: LikeRectangle): Rectangle;
}
export declare class RectBody extends Rectangle {
    static toBoundingBox(rect: RectBody | Rectangle): Bound | undefined;
    static contains(parent: RectWithPosition, child: RectWithPosition): boolean;
    static centered(parent: RectBody, child: LikeRectangle): RectBody;
    x: number;
    y: number;
    constructor(x: number, y: number, width?: number, height?: number);
    get pos(): Vector2;
    set pos(vector2: Vector2);
    copy(): RectBody;
    move(x: number | Vector2, y: number): RectBody;
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
