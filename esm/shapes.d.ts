import { Vector2 } from '@orago/vector';
export declare class Box {
    static scaleToFit(containerWidth: number, containerHeight: number, rectWidth: number, rectHeight: number): Box;
    static scale(width: number, height: number, scale: number): Box;
    static FromObj(obj: Box): Box;
    width: number;
    height: number;
    constructor(width: number, height: number);
    [Symbol.iterator](): Generator<number, void, unknown>;
    scaled(scale: number): Box;
    toFit({ width, height }?: {
        width: number;
        height: number;
    }): Box;
}
interface rectWithPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}
export declare class RectBody extends Box {
    static toBoundingBox(rect: RectBody | Box): Bound | undefined;
    static contains(parent: rectWithPosition, child: rectWithPosition): boolean;
    static centered(parent: RectBody, child: RectBody | Box): RectBody;
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
    positions: [
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ];
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
export {};
