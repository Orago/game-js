import { RectWithPosition, RectOrPosition } from './shapes';
interface Circle {
    r: number;
    x: number;
    y: number;
}
export declare class Collision {
    static rect(rect1: RectWithPosition, rect2: RectWithPosition): boolean;
    static rectContains(p: RectWithPosition, c: RectOrPosition): boolean;
    static circle(a: Circle, b: Circle): boolean;
}
export {};
