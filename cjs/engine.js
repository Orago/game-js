"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _createObjectGroup_items;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineObject = exports.worldToScreen = exports.screenToWorld = void 0;
const ecs_1 = require("@orago/ecs");
const collision_js_1 = require("./collision.js");
const cursor_js_1 = __importDefault(require("./input/cursor.js"));
const keyboard_js_1 = __importDefault(require("./input/keyboard.js"));
const legacy_js_1 = require("./plugins/legacy.js");
const repeater_js_1 = require("./repeater.js");
__exportStar(require("@orago/ecs"), exports);
const zoomIncrement = .2;
function screenToWorld(screen, options) {
    var _a, _b, _c;
    const center = (_a = options === null || options === void 0 ? void 0 : options.center) !== null && _a !== void 0 ? _a : { x: 0, y: 0 };
    const offset = (_b = options === null || options === void 0 ? void 0 : options.offset) !== null && _b !== void 0 ? _b : { x: 0, y: 0 };
    const zoom = (_c = options === null || options === void 0 ? void 0 : options.zoom) !== null && _c !== void 0 ? _c : 1;
    return {
        x: (screen.x - center.x) / zoom + offset.x,
        y: (screen.y - center.y) / zoom + offset.y
    };
}
exports.screenToWorld = screenToWorld;
function worldToScreen(world, options) {
    var _a, _b, _c;
    const center = (_a = options === null || options === void 0 ? void 0 : options.center) !== null && _a !== void 0 ? _a : { x: 0, y: 0 };
    const offset = (_b = options === null || options === void 0 ? void 0 : options.offset) !== null && _b !== void 0 ? _b : { x: 0, y: 0 };
    const zoom = (_c = options === null || options === void 0 ? void 0 : options.zoom) !== null && _c !== void 0 ? _c : 1;
    return {
        x: (world.x - offset.x) * zoom + center.x,
        y: (world.y - offset.y) * zoom + center.y
    };
}
exports.worldToScreen = worldToScreen;
/**
 * Engine Object
 * ! SHOULD NOT BE USED ON IT'S OWN
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
        if (typeof data === 'object') {
            if (typeof data.x === 'number')
                this.x = data.x;
            if (typeof data.y === 'number')
                this.y = data.y;
            if (typeof data.width === 'number')
                this.width = data.width;
            if (typeof data.height === 'number')
                this.height = data.height;
            if (typeof data.priority === 'number')
                this.priority = data.priority;
            if (typeof data.lifetime === 'number') {
                const endAt = Date.now() + data.lifetime;
                this.events.on('update', () => Date.now() > endAt && this.removeType());
            }
        }
    }
    ref(fn) {
        fn.bind(this)(this);
        return this;
    }
    tick() {
        this.events.emit('update');
        this.events.emit('render');
    }
    removeType() {
        this.events.emit('remove');
        this.events.all.clear();
        if (this.engine instanceof World) {
            this.engine.objects.delete(this);
        }
    }
    addTo(...tags) {
        // this.events.emit('add');
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
            height: this.height * this.engine.zoom
        };
    }
    get canvas() {
        return this.engine.brush;
    }
    collides(restriction = () => false) {
        for (const otherObj of this.engine.objects.values()) {
            if (this != otherObj &&
                restriction(this, otherObj)) {
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
exports.EngineObject = EngineObject;
class createObjectGroup {
    constructor(engine) {
        this.isObjGroup = true;
        _createObjectGroup_items.set(this, new Set());
        this.engine = engine;
    }
    add() {
        for (const item of arguments) {
            __classPrivateFieldGet(this, _createObjectGroup_items, "f").add(item);
        }
    }
    kill() {
        for (const item of __classPrivateFieldGet(this, _createObjectGroup_items, "f")) {
            this.engine.objects.delete(item);
            __classPrivateFieldGet(this, _createObjectGroup_items, "f").delete(item);
        }
    }
    get items() {
        return [...__classPrivateFieldGet(this, _createObjectGroup_items, "f")];
    }
}
_createObjectGroup_items = new WeakMap();
class World {
    constructor(brush) {
        this.ecs = new ecs_1.ECS();
        this.legacy = new legacy_js_1.LegacySystem(this.ecs, this);
        /** List of renderable objects */
        this.objects = new Set();
        this.offset = { x: 0, y: 0 };
        this.zoom = 3;
        this.frame = 0;
        // get orderedObjects() {
        // 	return Array.from(this.objects).sort(
        // 		(a: LegacyEntity, b: LegacyEntity): number =>
        // 			a.priority - b.priority
        // 	);
        // }
        this.collision = collision_js_1.Collision;
        this.object = (data, ref) => {
            const entity = new legacy_js_1.LegacyEntity(this.ecs);
            if (data.priority != null)
                entity.priority = data.priority;
            ref(entity);
            return entity;
        };
        this.brush = brush;
        this.ecs.addSystem(this.legacy);
        if (brush.canvas instanceof HTMLCanvasElement != true)
            throw new Error('Cannot use offscreen canvas for engine');
        if (brush.canvas.parentElement == null)
            throw new Error('Cannot assign container');
        brush.canvas.setAttribute('tabindex', '1');
        this.cursor = new cursor_js_1.default(brush.canvas);
        this.keyboard = new keyboard_js_1.default(brush.canvas.parentElement);
        this.ticks = new repeater_js_1.Repeater(64, () => {
            var _a;
            this.ecs.update();
            this.frame = (_a = this === null || this === void 0 ? void 0 : this.ticks) === null || _a === void 0 ? void 0 : _a.frame;
            // for (const item of this.orderedObjects) {
            // 	item.tick();
            // }
        });
        this.ticks.start();
        // this.cursor.events.on('click', () => {
        // 	for (const obj of this.orderedObjects) {
        // 		if (obj.events.all.has('click') != true)
        // 			continue;
        // 		const screenObj = obj.toScreen();
        // 		const clicked = this.collision.rectContains(
        // 			screenObj,
        // 			this.cursor.pos
        // 		);
        // 		if (clicked == true && obj.enabled) {
        // 			obj.events.emit('click', this.cursor.pos);
        // 			// if (typeof obj.whileClick == 'function')
        // 			//   while (this.cursor.down == true)
        // 			//     obj.whileClick(this.cursor.pos);
        // 			// if (obj.button == true) break;
        // 		}
        // 	}
        // });
    }
    screenToWorld(point, options) {
        return screenToWorld(point, {
            center: (options === null || options === void 0 ? void 0 : options.center) === true ? this.brush.center() : { x: 0, y: 0 },
            offset: this.offset,
            zoom: this.zoom
        });
    }
    worldToScreen(point, options) {
        return worldToScreen(point, {
            center: (options === null || options === void 0 ? void 0 : options.center) === true ? this.brush.center() : { x: 0, y: 0 },
            offset: this.offset,
            zoom: this.zoom
        });
    }
    /**
     * @deprecated
     */
    get objectGroup() {
        return new createObjectGroup(this);
    }
    /**
     * @deprecated
     */
    findObjects(search) {
        return Array
            .from(this.objects)
            .filter(search);
    }
    setCursor(url) {
        const { canvas } = this.brush;
        if (canvas instanceof HTMLCanvasElement)
            canvas.style.cursor = `url(${url}), pointer`;
        return this;
    }
    destroy() {
        this.keyboard.events.all.clear();
        this.cursor.reInit();
        /* Queue for deletion */
        this.ecs.killEntities();
        /* Do final run / deletion */
        this.ecs.update();
        /* Wipe the canvas */
        this.brush.clear();
        for (const object of Array.from(this.objects))
            object.removeType();
    }
}
World.ECS = ecs_1.ECS;
exports.default = World;
