import { ECS } from '@orago/ecs';
import type { Point } from '@orago/vector';
import BrushCanvas from './brush/brush.js';
import { Collision } from './collision.js';
import Cursor from './input/cursor.js';
import Keyboard from './input/keyboard.js';
import { LegacyEntity, LegacySystem } from './plugins/legacy.js';
import { Repeater } from './repeater.js';
export * from '@orago/ecs';
export interface EngineObjectData {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    priority?: number;
    lifetime?: number;
}
export declare function screenToWorld(screen: Point, options?: {
    center?: Point;
    offset?: Point;
    zoom?: number;
}): Point;
export declare function worldToScreen(world: Point, options?: {
    center?: Point;
    offset?: Point;
    zoom?: number;
}): Point;
/**
 * Engine Object
 * ! SHOULD NOT BE USED ON IT'S OWN
 * @class
 */
export declare class EngineObject extends LegacyEntity {
    x: number;
    y: number;
    width: number;
    height: number;
    enabled: boolean;
    visible: boolean;
    engine: World;
    constructor(engineRef: World, data?: EngineObjectData);
    ref(fn: (arg0: this) => void): this;
    tick(): void;
    removeType(): void;
    addTo(...tags: any[]): this;
    toScreen(): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    get canvas(): BrushCanvas;
    collides(restriction?: (arg0: EngineObject | null, arg1: EngineObject | null) => boolean): boolean;
    enable(): void;
    disable(): void;
}
declare class createObjectGroup {
    #private;
    engine: World;
    isObjGroup: boolean;
    constructor(engine: World);
    add(): void;
    kill(): void;
    get items(): EngineObject[];
}
export default class World {
    static ECS: typeof ECS;
    ecs: ECS;
    legacy: LegacySystem;
    /** List of renderable objects */
    objects: Set<EngineObject>;
    offset: Point;
    zoom: number;
    brush: BrushCanvas;
    cursor: Cursor;
    keyboard: Keyboard;
    ticks: Repeater;
    frame: number;
    constructor(brush: BrushCanvas);
    collision: typeof Collision;
    object: (data: EngineObjectData, ref: (arg0: LegacyEntity) => void) => LegacyEntity;
    screenToWorld(point: Point, options?: {
        center?: boolean;
    }): Point;
    worldToScreen(point: Point, options?: {
        center?: boolean;
    }): Point;
    /**
     * @deprecated
     */
    get objectGroup(): createObjectGroup;
    /**
     * @deprecated
     */
    findObjects(search: (arg0: EngineObject) => boolean): Array<EngineObject>;
    setCursor(url: string): this;
    destroy(): void;
}
