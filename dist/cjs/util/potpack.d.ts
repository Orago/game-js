interface TRectangle {
    width: number;
    height: number;
}
export interface TBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export declare class BoxUtil {
    static from(x: number, y: number, width: number, height: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    static asArray(obj: TBox): [x: number, y: number, width: number, height: number];
    static asRect(obj: TBox): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export default function potpack<T extends TRectangle[]>(boxes: T, padding?: number): {
    width: number;
    height: number;
    fill: number;
    boxes: (T[number] & TBox)[];
};
export {};
