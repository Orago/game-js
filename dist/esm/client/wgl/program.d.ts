type TSpriteOptions = {
    color?: [r: number, g: number, b: number, a: number];
    source?: [x: number, y: number, w: number, h: number];
    destination?: [x: number, y: number, w: number, h: number];
    rotation?: number;
};
type TInstancedSpriteSlice = [
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dy: number,
    rotation: number,
    red: number,
    green: number,
    blue: number,
    alpha: number
];
export declare class WglProgram {
    static fpi: number;
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    instances: InstanceBuffer;
    u_resolution: WebGLUniformLocation;
    texture?: TextureAtlas;
    program: WebGLProgram;
    constructor();
    setup(): void;
    setTexture(texture: TextureAtlas): void;
    resize(width: number, height: number): void;
    render(): void;
}
export declare class TextureAtlas {
    texture: WebGLTexture;
    width: number;
    height: number;
    constructor(gl: WebGL2RenderingContext, img: TexImageSource & {
        width: number;
        height: number;
    });
    getSlice(x: number, y: number, w: number, h: number): [x: number, y: number, w: number, h: number];
}
export declare class InstanceBuffer {
    gl: WebGL2RenderingContext;
    floats_per_instance: number;
    static initial(): TInstancedSpriteSlice;
    capacity: number;
    count: number;
    data: Float32Array;
    buffer: WebGLBuffer;
    id_indexes: number;
    new_indexes: Record<number, number>;
    deleted: Set<number>;
    constructor(gl: WebGL2RenderingContext, floats_per_instance: number, initialCapacity?: number);
    ensureCapacity(min: number): void;
    reset(): void;
    shake(): void;
    toScreen(): void;
    fromScreen(): void;
    getSelection(index: number): TInstancedSpriteSlice;
    updateSelection(index: number, data: TSpriteOptions & {
        selection?: TInstancedSpriteSlice;
    }): void;
    setSelection(index: number, array: TInstancedSpriteSlice): boolean;
    addInstance(array?: TInstancedSpriteSlice): number;
    getIndex(input: WGLSprite | number): number;
    getValue(index: number, data: "source"): [x: number, y: number, w: number, h: number];
    getValue(index: number, data: "destination"): [x: number, y: number, w: number, h: number];
    getValue(index: number, data: "rotation"): number;
    getValue(index: number, data: "color"): [r: number, g: number, b: number, a: number];
    upload(): void;
    createSprite(options?: TSpriteOptions): WGLSprite;
}
export declare class WGLSprite {
    readonly id: number;
    constructor(id: number);
    getValues(reference: InstanceBuffer): TInstancedSpriteSlice;
    get(data: "source", reference: InstanceBuffer): [x: number, y: number, w: number, h: number];
    get(data: "destination", reference: InstanceBuffer): [x: number, y: number, w: number, h: number];
    get(data: "color", reference: InstanceBuffer): [r: number, g: number, b: number, a: number];
}
export {};
