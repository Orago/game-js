import { VNode } from "@orago/dom";
import { Ecs } from "@orago/ecs";
import { Emitter } from "@orago/lib";
import { Collision } from "../util/collision.js";
import { ObjectManager, PluginManager } from "./base.js";
import Cursor from "./input/cursor.js";
import Keyboard from "./input/keyboard.js";
import { LegacyEntity, LegacySystem } from "./plugins/legacy.js";
import { Ticker } from "./repeater.js";
function screenToWorld(screen, options) {
    const center = options?.center ?? { x: 0, y: 0 };
    const offset = options?.offset ?? { x: 0, y: 0 };
    const zoom = options?.zoom ?? 1;
    return {
        x: (screen.x - center.x) / zoom + offset.x,
        y: (screen.y - center.y) / zoom + offset.y,
    };
}
function worldToScreen(world, options) {
    const center = options?.center ?? { x: 0, y: 0 };
    const offset = options?.offset ?? { x: 0, y: 0 };
    const zoom = options?.zoom ?? 1;
    return {
        x: (world.x - offset.x) * zoom + center.x,
        y: (world.y - offset.y) * zoom + center.y,
    };
}
export default class Engine {
    static screenToWorld = screenToWorld;
    static worldToScreen = worldToScreen;
    static ECS = Ecs;
    static display(engine, parent) {
        const full_float_styling = {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
        };
        new VNode(engine.brush.canvas).style.update(full_float_styling);
        const el = VNode.Util.extractEl(engine.dom);
        if (VNode.Util.extractEl(parent)?.contains(el) != true) {
            parent.append(el);
        }
        engine.dom.focus();
    }
    ecs = new Ecs();
    legacy = new LegacySystem(this.ecs, this);
    /** List of renderable objects */
    camera = { x: 0, y: 0, zoom: 1 };
    // /**
    //  * Replaced by engine.camera
    //  * @deprecated
    //  */
    // public readonly offset: Vector.Point = this.camera;
    // /**
    //  * Replaced by engine.camera.zoom
    //  * @deprecated
    //  */
    // public get zoom(): number {
    // 	return this.camera.zoom;
    // }
    brush;
    cursor;
    keyboard;
    tick = new Ticker(64);
    frame = 0;
    events = new Emitter();
    dom = new VNode("div");
    ui = new VNode("div");
    plugins = new PluginManager(this);
    objects = new ObjectManager(this);
    paused = false;
    constructor(brush) {
        this.brush = brush;
        this.ecs.systems.add(this.legacy);
        this.brush.canvas.setAttribute("tabindex", "1");
        this.dom.append(this.brush.canvas, this.ui);
        this.cursor = new Cursor(this.brush.canvas);
        this.keyboard = new Keyboard(this.dom.element);
        // 	this.cursor = new Cursor(this.dom.element);
        // this.keyboard = new Keyboard(this.dom.element as HTMLElement);
        this.tick.tick.on(() => {
            for (const plugin of this.plugins.ordered_list) {
                plugin.onUpdate?.(this);
                plugin.onRender?.(this);
            }
            for (const object of this.objects.ordered_list) {
                object.onUpdate?.(this);
                object.onRender?.(this);
            }
            this.ecs.update();
            this.frame = this?.tick?.frame;
        });
        this.tick.start();
    }
    collision = Collision;
    object = (data, ref) => {
        const entity = new LegacyEntity(this.ecs);
        if (data.priority != null) {
            entity.priority = data.priority;
        }
        ref(entity);
        return entity;
    };
    screenToWorld(point, options) {
        return screenToWorld(point, {
            center: options?.center === true ? this.brush.center() : { x: 0, y: 0 },
            offset: this.camera,
            zoom: this.camera.zoom,
        });
    }
    worldToScreen(point, options) {
        return worldToScreen(point, {
            center: options?.center === true ? this.brush.center() : { x: 0, y: 0 },
            offset: this.camera,
            zoom: this.camera.zoom,
        });
    }
    setCursor(url) {
        this.dom.style.update({ cursor: `url(${url}), pointer` });
        return this;
    }
    pause(state) {
        if (state != undefined && this.paused == state) {
            return;
        }
        this.paused = state ?? !this.paused;
        this.tick.pause(this.paused);
        // is now paused
        if (this.paused == true) {
            this.keyboard.dispose();
            this.cursor.dispose();
        }
        else {
            this.keyboard.init();
            this.cursor.init();
        }
        this.events.emit("pause", this.paused);
    }
    destroy() {
        this.keyboard.events.all.clear();
        this.cursor.reset();
        /* Queue for deletion */
        this.ecs.entities.clear();
        this.ecs.systems.clear();
        /* Do final run / deletion */
        this.plugins.clear();
        this.objects.clear();
        this.ecs.update();
        this.ecs.systems.add(this.legacy);
        /* Wipe the canvas */
        this.brush.clear();
    }
}
//# sourceMappingURL=engine.js.map