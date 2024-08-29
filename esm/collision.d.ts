import { RectWithPosition, RectOrPosition } from './shapes';
interface Circle {
    r: number;
    x: number;
    y: number;
}
export declare class Collision {
    static rect(a: RectWithPosition, b: RectWithPosition): boolean;
    static rectContains(p: RectWithPosition, c: RectOrPosition): boolean;
    static circle(a: Circle, b: Circle): boolean;
}
export {};
