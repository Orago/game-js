interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}
export declare class Collision {
    static rect(rect1: Rect, rect2: Rect): boolean;
    static rectContains(p: Rect, c: {
        x: number;
        y: number;
        w?: number;
        h?: number;
    }): boolean;
    static circle(a: {
        r: number;
        x: number;
        y: number;
    }, b: {
        r: number;
        x: number;
        y: number;
    }): boolean;
}
export {};
