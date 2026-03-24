import { VNode } from "@orago/dom";
import { Ecs } from "@orago/ecs";
import { Emitter, Vector } from "@orago/lib";
import { Collision } from "../util/collision.js";
import { ObjectManager, PluginManager } from "./base.js";
import type BrushCanvas from "./brush/brush.js";
import Cursor from "./input/cursor.js";
import Keyboard from "./input/keyboard.js";
import { LegacyEntity, LegacySystem } from "./plugins/legacy.js";
import { Ticker } from "./repeater.js";
interface EngineObjectData {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    priority?: number;
    lifetime?: number;
}
declare function screenToWorld(screen: Vector.Point, options?: {
    center?: Vector.Point;
    offset?: Vector.Point;
    zoom?: number;
}): Vector.Point;
declare function worldToScreen(world: Vector.Point, options?: {
    center?: Vector.Point;
    offset?: Vector.Point;
    zoom?: number;
}): Vector.Point;
export interface Camera {
    x: number;
    y: number;
    zoom: number;
}
export default class Engine {
    static screenToWorld: typeof screenToWorld;
    static worldToScreen: typeof worldToScreen;
    static ECS: typeof Ecs;
    static display(engine: Engine, parent: VNode | HTMLElement): void;
    ecs: Ecs;
    legacy: LegacySystem;
    /** List of renderable objects */
    readonly camera: Camera;
    brush: BrushCanvas;
    cursor: Cursor;
    keyboard: Keyboard;
    tick: Ticker;
    frame: number;
    events: Emitter<{
        pause: (paused: boolean) => void;
    }, true>;
    dom: VNode<HTMLElement>;
    ui: VNode<HTMLElement>;
    plugins: PluginManager;
    objects: ObjectManager;
    paused: boolean;
    constructor(brush: BrushCanvas);
    collision: typeof Collision;
    object: (data: EngineObjectData, ref: (arg0: LegacyEntity) => void) => LegacyEntity;
    screenToWorld(point: Vector.Point, options?: {
        center?: boolean;
    }): Vector.Point;
    worldToScreen(point: Vector.Point, options?: {
        center?: boolean;
    }): Vector.Point;
    setCursor(url: string): this;
    pause(state?: boolean): void;
    destroy(): void;
}
export {};
