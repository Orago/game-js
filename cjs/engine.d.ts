import Emitter from '@orago/lib/emitter';
import { Vector2 } from '@orago/vector';
import { Collision } from './collision.js';
import BrushCanvas from './brush/brush.js';
import Cursor from './input/cursor.js';
import Keyboard from './input/keyboard.js';
import { Repeater } from './repeater.js';
import { RectBody } from './shapes.js';
interface EngineObjectData {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    priority?: number;
    lifetime?: number;
}
export declare class EngineObject {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    priority: number;
    enabled: boolean;
    visible: boolean;
    engine: Engine;
    events: Emitter;
    constructor(engineRef: Engine, data?: EngineObjectData);
    ref(fn: (arg0: EngineObject) => void): this;
    tick(): void;
    removeType(): void;
    addTo(...tags: any[]): this;
    get canvas(): BrushCanvas;
    collides(restriction?: (arg0: EngineObject | null, arg1: EngineObject | null) => boolean): boolean;
    enable(): void;
    disable(): void;
}
declare class createObjectGroup {
    #private;
    engine: Engine;
    isObjGroup: boolean;
    constructor(engine: Engine);
    add(): void;
    kill(): void;
    get items(): EngineObject[];
}
export default class Engine {
    _pc_by_orago: string;
    objects: Set<EngineObject>;
    offset: Vector2;
    zoom: number;
    brush: BrushCanvas;
    cursor: Cursor;
    keyboard: Keyboard;
    ticks: Repeater;
    frame: number;
    constructor(brush: BrushCanvas);
    get orderedObjects(): EngineObject[];
    collision: typeof Collision;
    object: (data: EngineObjectData, ref: (arg0: EngineObject) => void) => EngineObject;
    screenToWorld(pos: Vector2 | RectBody, options: {
        center?: boolean;
    }): Vector2;
    worldToScreen(pos: Vector2, options: {
        center?: boolean;
    }): Vector2;
    get objectGroup(): createObjectGroup;
    findObjects(search: (arg0: EngineObject) => boolean): Array<EngineObject>;
    allowZoom(): this;
    setCursor(url: string): this;
    destroy(): void;
}
export {};
