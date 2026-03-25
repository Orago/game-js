import { Size, Rectangle } from "@orago/lib";
export declare class BoxUtil {
    static from(x: number, y: number, width: number, height: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    static asArray(obj: Rectangle): [x: number, y: number, width: number, height: number];
    static asRect(obj: Rectangle): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export default function potpack<T extends Size[]>(boxes: T, padding?: number): {
    width: number;
    height: number;
    fill: number;
    boxes: (T[number] & Rectangle)[];
};
