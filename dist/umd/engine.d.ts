import type { Point } from "@orago/lib/vector";
import { Ecs } from "@orago/ecs";
import BrushCanvas from "./brush/brush.js";
import { Collision } from "./collision.js";
import Cursor from "./input/cursor.js";
import Keyboard from "./input/keyboard.js";
import { LegacyEntity, LegacySystem } from "./plugins/legacy.js";
import { Repeater } from "./repeater.js";
import { VNode } from "@orago/dom";
interface EngineObjectData {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    priority?: number;
    lifetime?: number;
}
declare function screenToWorld(screen: Point, options?: {
    center?: Point;
    offset?: Point;
    zoom?: number;
}): Point;
declare function worldToScreen(world: Point, options?: {
    center?: Point;
    offset?: Point;
    zoom?: number;
}): Point;
/**
 * Engine Object
 * ! SHOULD NOT BE USED ON IT"S OWN
 * @class
 */
declare class EngineObject extends LegacyEntity {
    x: number;
    y: number;
    width: number;
    height: number;
    enabled: boolean;
    visible: boolean;
    engine: Engine;
    constructor(engineRef: Engine, data?: EngineObjectData);
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
export default class Engine {
    static screenToWorld: typeof screenToWorld;
    static worldToScreen: typeof worldToScreen;
    static Object: typeof EngineObject;
    static ECS: typeof Ecs;
    static display(engine: Engine, parent: VNode | HTMLElement): void;
    ecs: Ecs;
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
    dom: VNode<HTMLElement>;
    ui: VNode<HTMLElement>;
    constructor(brush: BrushCanvas);
    collision: typeof Collision;
    object: (data: EngineObjectData, ref: (arg0: LegacyEntity) => void) => LegacyEntity;
    screenToWorld(point: Point, options?: {
        center?: boolean;
    }): Point;
    worldToScreen(point: Point, options?: {
        center?: boolean;
    }): Point;
    setCursor(url: string): this;
    destroy(): void;
}
export {};
