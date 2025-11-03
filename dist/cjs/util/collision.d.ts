import type { PositionedRectangleLike, CircleLike } from "./shapes.js";
export declare class Collision {
    static rect(a: PositionedRectangleLike, b: PositionedRectangleLike): boolean;
    static rectContains(outer: PositionedRectangleLike, inner: PositionedRectangleLike): boolean;
    static circle(a: CircleLike, b: CircleLike): boolean;
}
