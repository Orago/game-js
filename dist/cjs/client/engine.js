"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dom_1 = require("@orago/dom");
const ecs_1 = require("@orago/ecs");
const collision_js_1 = require("../util/collision.js");
const cursor_js_1 = __importDefault(require("./input/cursor.js"));
const keyboard_js_1 = __importDefault(require("./input/keyboard.js"));
const legacy_js_1 = require("./plugins/legacy.js");
const repeater_js_1 = require("./repeater.js");
function screenToWorld(screen, options) {
    var _a, _b, _c;
    const center = (_a = options === null || options === void 0 ? void 0 : options.center) !== null && _a !== void 0 ? _a : { x: 0, y: 0 };
    const offset = (_b = options === null || options === void 0 ? void 0 : options.offset) !== null && _b !== void 0 ? _b : { x: 0, y: 0 };
    const zoom = (_c = options === null || options === void 0 ? void 0 : options.zoom) !== null && _c !== void 0 ? _c : 1;
    return {
        x: (screen.x - center.x) / zoom + offset.x,
        y: (screen.y - center.y) / zoom + offset.y,
    };
}
function worldToScreen(world, options) {
    var _a, _b, _c;
    const center = (_a = options === null || options === void 0 ? void 0 : options.center) !== null && _a !== void 0 ? _a : { x: 0, y: 0 };
    const offset = (_b = options === null || options === void 0 ? void 0 : options.offset) !== null && _b !== void 0 ? _b : { x: 0, y: 0 };
    const zoom = (_c = options === null || options === void 0 ? void 0 : options.zoom) !== null && _c !== void 0 ? _c : 1;
    return {
        x: (world.x - offset.x) * zoom + center.x,
        y: (world.y - offset.y) * zoom + center.y,
    };
}
/**
 * Engine Object
 * ! SHOULD NOT BE USED ON IT"S OWN
 * @class
 */
class EngineObject extends legacy_js_1.LegacyEntity {
    // options: {
    // 	zoom: boolean;
    // 	offset: boolean;
    // } = {
    // 		zoom: false,
    // 		offset: false,
    // 	};
    // events = new Emitter();
    constructor(engineRef, data = {}) {
        super(engineRef.ecs);
        // id = uuidV4();
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.enabled = true;
        this.visible = true;
        this.engine = engineRef;
        if (typeof data === "object") {
            if (typeof data.x === "number")
                this.x = data.x;
            if (typeof data.y === "number")
                this.y = data.y;
            if (typeof data.width === "number")
                this.width = data.width;
            if (typeof data.height === "number")
                this.height = data.height;
            if (typeof data.priority === "number")
                this.priority = data.priority;
            if (typeof data.lifetime === "number") {
                const ends_at = Date.now() + data.lifetime;
                this.events.on("update", () => Date.now() > ends_at && this.removeType());
            }
        }
    }
    ref(fn) {
        fn.bind(this)(this);
        return this;
    }
    tick() {
        this.events.emit("update");
        this.events.emit("render");
    }
    removeType() {
        this.events.emit("remove");
        this.events.all.clear();
        if (this.engine instanceof Engine) {
            this.engine.objects.delete(this);
        }
    }
    addTo(...tags) {
        // this.events.emit("add");
        // if (this.engine instanceof World) {
        // 	this.engine.objects.add(this);
        // }
        // tags.forEach(tag => tag?.isObjGroup == true && tag.add(this));
        return this;
    }
    toScreen() {
        const pos = this.engine.worldToScreen({ x: this.x, y: this.y });
        return {
            x: pos.x,
            y: pos.y,
            width: this.width * this.engine.zoom,
            height: this.height * this.engine.zoom,
        };
    }
    get canvas() {
        return this.engine.brush;
    }
    collides(restriction = () => false) {
        for (const other_obj of this.engine.objects.values()) {
            if (this != other_obj && restriction(this, other_obj)) {
                return true;
            }
        }
        return false;
    }
    enable() {
        this.visible = true;
        this.enabled = true;
    }
    disable() {
        this.visible = false;
        this.enabled = false;
    }
}
class Engine {
    static display(engine, parent) {
        var _a;
        const full_float_styling = {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
        };
        new dom_1.VNode(engine.brush.canvas).style.update(full_float_styling);
        const el = dom_1.VNode.Util.extractEl(engine.dom);
        if (((_a = dom_1.VNode.Util.extractEl(parent)) === null || _a === void 0 ? void 0 : _a.contains(el)) != true) {
            parent.append(el);
        }
        engine.dom.focus();
    }
    constructor(brush) {
        this.ecs = new ecs_1.Ecs();
        this.legacy = new legacy_js_1.LegacySystem(this.ecs, this);
        /** List of renderable objects */
        this.objects = new Set();
        this.offset = { x: 0, y: 0 };
        this.zoom = 3;
        this.frame = 0;
        this.dom = dom_1.VNode.new.div;
        this.ui = dom_1.VNode.new.div;
        this.collision = collision_js_1.Collision;
        this.object = (data, ref) => {
            const entity = new legacy_js_1.LegacyEntity(this.ecs);
            if (data.priority != null) {
                entity.priority = data.priority;
            }
            ref(entity);
            return entity;
        };
        this.brush = brush;
        this.ecs.systems.add(this.legacy);
        this.brush.canvas.setAttribute("tabindex", "1");
        this.dom.append(this.brush.canvas, this.ui);
        this.cursor = new cursor_js_1.default(this.brush.canvas);
        this.keyboard = new keyboard_js_1.default(this.dom.element);
        // 	this.cursor = new Cursor(this.dom.element);
        // this.keyboard = new Keyboard(this.dom.element as HTMLElement);
        this.ticks = new repeater_js_1.Repeater(64, () => {
            var _a;
            this.ecs.update();
            this.frame = (_a = this === null || this === void 0 ? void 0 : this.ticks) === null || _a === void 0 ? void 0 : _a.frame;
        });
        this.ticks.start();
    }
    screenToWorld(point, options) {
        return screenToWorld(point, {
            center: (options === null || options === void 0 ? void 0 : options.center) === true ? this.brush.center() : { x: 0, y: 0 },
            offset: this.offset,
            zoom: this.zoom,
        });
    }
    worldToScreen(point, options) {
        return worldToScreen(point, {
            center: (options === null || options === void 0 ? void 0 : options.center) === true ? this.brush.center() : { x: 0, y: 0 },
            offset: this.offset,
            zoom: this.zoom,
        });
    }
    setCursor(url) {
        this.dom.style.update({ cursor: `url(${url}), pointer` });
        return this;
    }
    destroy() {
        this.keyboard.events.all.clear();
        this.cursor.init();
        /* Queue for deletion */
        this.ecs.entities.clear();
        this.ecs.systems.clear();
        /* Do final run / deletion */
        this.ecs.update();
        this.ecs.systems.add(this.legacy);
        /* Wipe the canvas */
        this.brush.clear();
        for (const object of Array.from(this.objects)) {
            object.removeType();
        }
    }
}
Engine.screenToWorld = screenToWorld;
Engine.worldToScreen = worldToScreen;
Engine.Object = EngineObject;
Engine.ECS = ecs_1.Ecs;
exports.default = Engine;
