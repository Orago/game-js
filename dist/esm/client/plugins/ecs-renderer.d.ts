import { Ecs, Engine } from "../index.js";
import { Matrix3D, Transform } from "../../util/meowtrix.js";
export declare function getCanvasMatrix(matrix: Matrix3D): readonly [number, number, number, number, number, number];
export declare enum RenderType {
    TEXT = 0,
    RECTANGLE = 1,
    IMAGE = 2
}
export declare class RenderingComponent extends Ecs.Component {
    visuals: Set<RenderComponent>;
    constructor(visuals: RenderComponent[]);
}
declare enum EngineFlags {
    NONE = 0,
    OFFSET = 1,
    SCALE = 2
}
export declare class RenderComponent {
    static Flags: typeof EngineFlags;
    static makeFlags(flags: EngineFlags[]): EngineFlags;
    transform: Transform;
    rotation: [x: number, y: number];
    scale: [x: number, y: number];
    translate: [x: number, y: number, z: number];
    layer: number;
    engine_flags: number;
}
export declare class TextRenderComponent extends RenderComponent {
    text: string;
    size: number;
    cache_canvas?: HTMLCanvasElement;
    private cache_ctx?;
    private cache_key?;
    font: string;
    options: {
        font: string;
        size: number;
        color: string;
    };
    width: number;
    height: number;
    constructor(text: string, size: number);
    preloadCanvas(): {
        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
    };
    getTextCache(): HTMLCanvasElement;
    updateText(text: string): void;
}
export declare class RectangleRenderComponent extends RenderComponent {
    width: number;
    height: number;
    color?: string;
    constructor(width: number, height?: number, color?: string);
}
export declare class ImageRenderComponent extends RenderComponent {
    image: HTMLImageElement | HTMLCanvasElement;
    opacity?: number;
    source?: [x: number, y: number, w: number, h: number];
    destination?: [x: number, y: number, w: number, h: number];
    constructor(image: HTMLImageElement | HTMLCanvasElement);
}
export declare class RenderSystem extends Ecs.System {
    engine: Engine;
    components: Set<typeof RenderingComponent>;
    clear: boolean;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    constructor(engine: Engine);
    update(entities: Set<Ecs.Entity>): void;
    render(components: RenderComponent[]): void;
    private drawRectangle;
    private drawText;
    private drawImage;
}
export declare class RenderParticleGenerator extends Ecs.Component {
    constructor();
    generator(callback: () => RenderComponent): void;
}
export declare class RenderParticleSystem extends Ecs.System {
    components: Set<Function>;
    constructor();
    update(entities: Set<Ecs.Entity>, dirty: Set<Ecs.Entity>): void;
}
export {};
