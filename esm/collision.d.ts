interface rect {
    x: number;
    y: number;
    w: number;
    h: number;
}
export declare class Collision {
    static rect(rect1: rect, rect2: rect): boolean;
    static rectContains(p: rect, c: {
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
