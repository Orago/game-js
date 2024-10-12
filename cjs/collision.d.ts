import { PositionedRectangle } from './shapes';
interface Circle {
    r: number;
    x: number;
    y: number;
}
export declare class Collision {
    static rect(a: PositionedRectangle, b: PositionedRectangle): boolean;
    static rectContains(p: PositionedRectangle, c: PositionedRectangle): boolean;
    static circle(a: Circle, b: Circle): boolean;
}
export {};
