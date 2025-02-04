import type { PositionedRectangle, Circle } from './shapes.js';
export declare class Collision {
    static rect(a: PositionedRectangle, b: PositionedRectangle): boolean;
    static rectContains(outer: PositionedRectangle, inner: PositionedRectangle): boolean;
    static circle(a: Circle, b: Circle): boolean;
}
