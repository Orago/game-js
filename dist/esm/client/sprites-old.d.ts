type ImageType = HTMLImageElement;
export declare function getDataUrl(image: ImageType | HTMLCanvasElement): string;
export declare function cloneToCanvas(image: ImageType): HTMLCanvasElement;
export declare function cloneImage(image: ImageType | HTMLCanvasElement): ImageType;
export declare function responseToImageUrl(response: Response): Promise<any>;
export declare function imageToResponse(image: any): Response;
type spriteCfg = {
    x: number;
    y: number;
    width: number;
    height: number;
};
interface SpritesheetConfig {
    fileName: string;
    sprites: {
        [name: string]: spriteCfg;
    };
}
export declare class Spritesheet {
    id: string;
    loaded: boolean;
    sprite: HTMLImageElement;
    config: SpritesheetConfig;
    constructor(options: {
        id: string;
        url: string;
        cache?: true;
        config: SpritesheetConfig;
    });
}
declare class SpriteOld {
    img: ImageType;
    constructor(image: ImageType);
}
export default class Sprites {
    static slice(image: ImageType, bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    }): ImageType;
    static Slice: typeof Sprites.slice;
    canvas: import("./brush/chainable-canvas.js").ChainableCanvas;
    /**
     * Host domain and or path
     * it's essentially just a url prefix
     */
    host: string;
    sprites: Map<any, any>;
    loading: Set<unknown>;
    readonly cache: Map<string, SpriteOld>;
    /** Seconds */
    cache_duration: number;
    readonly sheets: Map<string, Spritesheet>;
    constructor(options?: {
        host?: string;
        cacheDuration?: number;
    });
    addSpritesheet(spritesheet: Spritesheet): void;
    parseUrl(url: string): string;
    has(url: string): boolean;
    get(url: string, options?: any): HTMLImageElement;
    loadSingle(url: string, onLoad?: Function): SpriteOld;
    fromCache(url: string): Promise<ImageType>;
    loadSinglePromise(url: string): Promise<SpriteOld["img"]>;
    promise(url: string): Promise<ImageType>;
}
export declare class TextureSheet {
    id: string;
    sprites: Map<string, [x: number, y: number, w: number, h: number]>;
    texture: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    constructor(id: string);
    set(list: [id: string, image: HTMLImageElement][]): void;
    getImage(id: string): HTMLImageElement;
    getAll(): [id: string, image: HTMLImageElement][];
    inject(id: string, image: HTMLImageElement): void;
}
export declare class Textures {
    static tempPromised(promise: Promise<HTMLImageElement>): HTMLImageElement;
    cache: {
        sheets: Set<TextureSheet>;
        url_map: Map<string, string>;
        loading: Map<string, HTMLImageElement>;
    };
    options: {
        host: string;
    };
    private index_counter;
    constructor(options?: {
        host?: string;
        cacheDuration?: number;
    });
    getDefaultSheet(): TextureSheet;
    private resolveUrl;
    /**
     * return sheet id or undefined
     */
    has(url: string): string | undefined;
    getCached(url: string): HTMLImageElement | undefined;
    get(url: string): HTMLImageElement;
    private load;
    fromCache(url: string): Promise<HTMLImageElement>;
    private loadAsync;
}
export {};
