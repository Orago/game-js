export declare class OraSlice {
    static lex(input: string): never[] | RegExpMatchArray;
    static chunk(lexed: any[]): any[][];
    static parseVec(values: string[]): any[];
    static getValues(input: string): {
        source: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        destination: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    };
}
