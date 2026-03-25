"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dom_1 = require("@orago/dom");
const ecs_1 = require("@orago/ecs");
const lib_1 = require("@orago/lib");
const collision_js_1 = require("../util/collision.js");
const base_js_1 = require("./base.js");
const cursor_js_1 = __importDefault(require("./input/cursor.js"));
const keyboard_js_1 = __importDefault(require("./input/keyboard.js"));
const legacy_js_1 = require("./plugins/legacy.js");
const repeater_js_1 = require("./repeater.js");
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
class Engine {
    static screenToWorld = screenToWorld;
    static worldToScreen = worldToScreen;
    static ECS = ecs_1.Ecs;
    static display(engine, parent) {
        const full_float_styling = {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
        };
        new dom_1.VNode(engine.brush.canvas).style.update(full_float_styling);
        const el = dom_1.VNode.Util.extractEl(engine.dom);
        if (dom_1.VNode.Util.extractEl(parent)?.contains(el) != true) {
            parent.append(el);
        }
        engine.dom.focus();
    }
    ecs = new ecs_1.Ecs();
    legacy = new legacy_js_1.LegacySystem(this.ecs, this);
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
    tick = new repeater_js_1.Ticker(64);
    frame = 0;
    events = new lib_1.Emitter();
    dom = new dom_1.VNode("div");
    ui = new dom_1.VNode("div");
    plugins = new base_js_1.PluginManager(this);
    objects = new base_js_1.ObjectManager(this);
    paused = false;
    constructor(brush) {
        this.brush = brush;
        this.ecs.systems.add(this.legacy);
        this.brush.canvas.setAttribute("tabindex", "1");
        this.dom.append(this.brush.canvas, this.ui);
        this.cursor = new cursor_js_1.default(this.brush.canvas);
        this.keyboard = new keyboard_js_1.default(this.dom.element);
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
    collision = collision_js_1.Collision;
    object = (data, ref) => {
        const entity = new legacy_js_1.LegacyEntity(this.ecs);
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
exports.default = Engine;
//# sourceMappingURL=engine.js.map