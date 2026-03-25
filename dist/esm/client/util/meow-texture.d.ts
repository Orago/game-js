import { DebouncedSignal, Rectangle, Signal } from "@orago/lib";
declare class QueueChain<S> {
    private source;
    queue: Promise<void>;
    constructor(source: S);
    isDone(): Promise<void>;
    enqueue<T>(task: (img: S) => Promise<T> | T): Promise<T>;
}
interface SpriteInjectOptions {
    sprites: [key: string, data: Rectangle][];
    image: HTMLImageElement | string;
    /**
     * fails after timeout
     * default: 10_000 ms
     */
    timeout?: number;
}
interface SpriteData {
    x: number;
    y: number;
    width: number;
    height: number;
    created: number;
    last: number;
}
type SpriteID = string;
interface PendingSprite {
    bitmap: ImageBitmap;
}
type ImageInputType = HTMLImageElement | HTMLCanvasElement | Blob | ImageBitmap;
type CanvasSpriteSource = Rectangle & {
    id: SpriteID;
    data: HTMLImageElement | ImageBitmap | HTMLCanvasElement | undefined;
};
declare class SpriteUtility {
    static blankSource(id?: string): CanvasSpriteSource;
    static normalizeBitmap(input: ImageInputType): Promise<ImageBitmap>;
    static sliceBitmap(bitmap: ImageBitmap, options?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }): Promise<ImageBitmap>;
    static getBitmap(texture: MeowTexture, id: string): Promise<ImageBitmap | void>;
    static resizeCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, width: number, height: number): void;
    static getBoxes(texture: MeowTexture): {
        id: string;
        width: number;
        height: number;
    }[];
    static sliceUrlOrPass(url: string, tex: SpriteRef): Promise<void>;
    static injectSprites(texture: MeowTexture, options: SpriteInjectOptions): Promise<void>;
}
declare class TextureHandler {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    queue: QueueChain<TextureHandler>;
    repack(texture: MeowTexture): void;
    private getBlob;
    getUrl(): Promise<string>;
    /**
     * Draws a section of the canvas onto
     * @param texture
     * @param s - selection
     * @param image
     */
    selectionToUrl(texture: MeowTexture, s: {
        x: number;
        y: number;
        width: number;
        height: number;
    }): Promise<string>;
    bitmapToUrl(bitmap: ImageBitmap): Promise<string>;
}
declare class SpriteRef {
    texture: MeowTexture;
    id: SpriteID;
    static Utility: typeof SpriteUtility;
    queue: QueueChain<SpriteRef>;
    bitmap?: ImageBitmap;
    constructor(texture: MeowTexture, id: SpriteID);
    /**
     * Applies effect if bitmap is resolved,
     * does nothing if it cannot obtain a bitmap
     */
    afterEffect<T>(task: (obj: {
        sprite: SpriteRef;
        bitmap: ImageBitmap;
    }) => Promise<T> | T): Promise<void>;
    getNormalBitmap(): ImageBitmap | undefined;
    getBitmap(): Promise<ImageBitmap | undefined>;
    urlCallback(callback: (url: string) => void): void;
    getImage(): HTMLImageElement;
    /**
     * Should only be used once as a lazy promised source
     */
    livingSource(): CanvasSpriteSource;
    getSource(): CanvasSpriteSource;
    drawToCanvas(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void;
    ready(id: string, ready_for: "image" | "canvas"): boolean;
    replace(input: ImageInputType): Promise<void>;
}
declare class SpriteStore {
    records: Map<string, {
        sprite: SpriteRef;
        time: number;
    }>;
    lifetime: number;
    debounce: DebouncedSignal<() => void>;
    constructor();
    useOrGen(id: string, callback: () => SpriteRef): SpriteRef;
}
declare class MeowTexture {
    static Utility: typeof SpriteUtility;
    static Handler: TextureHandler;
    sprites: Record<string, SpriteData>;
    pending_sprites: Record<string, PendingSprite>;
    loading: Record<string, Signal<() => void>>;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    debounce: DebouncedSignal<(...args: any[]) => any>;
    store: SpriteStore;
    options: {
        host: string;
    };
    constructor(options?: {
        host?: string;
    });
    resolveUrlOrigin(url: string): string;
    resolveUrl(url: string): string;
    exists(id: string): boolean;
    getUrl(url: string): SpriteRef;
    addSprite(id: string, input: ImageInputType): Promise<void>;
    removeSprite(id: string): void;
    promise(id: string): Promise<void>;
}
export { SpriteUtility, TextureHandler, SpriteRef, MeowTexture, SpriteStore };
export type { CanvasSpriteSource };
