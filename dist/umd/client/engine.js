var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@orago/dom", "@orago/ecs", "@orago/lib", "../util/collision.js", "./base.js", "./input/cursor.js", "./input/keyboard.js", "./plugins/legacy.js", "./repeater.js"], factory);
    }
})(function (require, exports) {
    "use strict";
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
            this.camera = { x: 0, y: 0, zoom: 1 };
            this.tick = new repeater_js_1.Ticker(64);
            this.frame = 0;
            this.events = new lib_1.Emitter();
            this.dom = new dom_1.VNode("div");
            this.ui = new dom_1.VNode("div");
            this.plugins = new base_js_1.PluginManager(this);
            this.objects = new base_js_1.ObjectManager(this);
            this.paused = false;
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
            this.tick.tick.on(() => {
                var _a, _b, _c, _d, _e;
                for (const plugin of this.plugins.ordered_list) {
                    (_a = plugin.onUpdate) === null || _a === void 0 ? void 0 : _a.call(plugin, this);
                    (_b = plugin.onRender) === null || _b === void 0 ? void 0 : _b.call(plugin, this);
                }
                for (const object of this.objects.ordered_list) {
                    (_c = object.onUpdate) === null || _c === void 0 ? void 0 : _c.call(object, this);
                    (_d = object.onRender) === null || _d === void 0 ? void 0 : _d.call(object, this);
                }
                this.ecs.update();
                this.frame = (_e = this === null || this === void 0 ? void 0 : this.tick) === null || _e === void 0 ? void 0 : _e.frame;
            });
            this.tick.start();
        }
        screenToWorld(point, options) {
            return screenToWorld(point, {
                center: (options === null || options === void 0 ? void 0 : options.center) === true ? this.brush.center() : { x: 0, y: 0 },
                offset: this.camera,
                zoom: this.camera.zoom,
            });
        }
        worldToScreen(point, options) {
            return worldToScreen(point, {
                center: (options === null || options === void 0 ? void 0 : options.center) === true ? this.brush.center() : { x: 0, y: 0 },
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
            this.paused = state !== null && state !== void 0 ? state : !this.paused;
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
    Engine.screenToWorld = screenToWorld;
    Engine.worldToScreen = worldToScreen;
    Engine.ECS = ecs_1.Ecs;
    exports.default = Engine;
});
