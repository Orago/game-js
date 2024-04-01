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
declare class Sprite {
    img: ImageType;
    constructor(image: ImageType);
}
export default class Sprites {
    static Slice(image: ImageType, bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    }): ImageType;
    canvas: import("./brush/brush.js").ChainableCanvas;
    host: string;
    sprites: Map<any, any>;
    loading: Set<unknown>;
    cache: Map<string, Sprite>;
    cacheDuration: number;
    spriteSheets: Map<string, Spritesheet>;
    constructor(options: {
        host?: string;
        cacheDuration?: number;
    });
    addSpritesheet(spritesheet: Spritesheet): void;
    parseUrl(url: string): string;
    has(url: string): boolean;
    get(url: string, options?: any): HTMLImageElement;
    loadSingle(url: string, onLoad?: Function): Sprite;
    fromCache(url: string): Promise<ImageType>;
    loadSinglePromise(url: string): Promise<Sprite['img']>;
    promise(url: string): Promise<ImageType>;
}
export {};
