"use strict";
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
const emitter_1 = __importDefault(require("@orago/lib/emitter"));
const vector_1 = require("@orago/vector");
const uuid_1 = require("uuid");
const collision_js_1 = require("./collision.js");
const cursor_js_1 = __importDefault(require("./input/cursor.js"));
const keyboard_js_1 = __importDefault(require("./input/keyboard.js"));
const repeater_js_1 = require("./repeater.js");
const zoomIncrement = .2;
function screenToWorld(pos, options) {
    var _a, _b, _c;
    const center = (_a = options === null || options === void 0 ? void 0 : options.center) !== null && _a !== void 0 ? _a : { x: 0, y: 0 };
    const offset = (_b = options === null || options === void 0 ? void 0 : options.offset) !== null && _b !== void 0 ? _b : { x: 0, y: 0 };
    const zoom = (_c = options === null || options === void 0 ? void 0 : options.zoom) !== null && _c !== void 0 ? _c : 1;
    return new vector_1.Vector2((pos.x - offset.x) * zoom + center.x, (pos.y - offset.y) * zoom + center.y);
}
exports.screenToWorld = screenToWorld;
function worldToScreen(pos, options) {
    var _a, _b, _c;
    const center = (_a = options === null || options === void 0 ? void 0 : options.center) !== null && _a !== void 0 ? _a : { x: 0, y: 0 };
    const offset = (_b = options === null || options === void 0 ? void 0 : options.offset) !== null && _b !== void 0 ? _b : { x: 0, y: 0 };
    const zoom = (_c = options === null || options === void 0 ? void 0 : options.zoom) !== null && _c !== void 0 ? _c : 1;
    return new vector_1.Vector2((pos.x + offset.x) * zoom + (center.x / zoom), (pos.y + offset.y) * zoom + (center.y / zoom));
}
exports.worldToScreen = worldToScreen;
class EngineObject {
    constructor(engineRef, data = {}) {
        this.id = (0, uuid_1.v4)();
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.priority = 1;
        this.enabled = true;
        this.visible = true;
        this.events = new emitter_1.default();
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
        if (this.engine instanceof Engine) {
            this.engine.objects.delete(this);
        }
    }
    addTo(...tags) {
        this.events.emit('add');
        if (this.engine instanceof Engine) {
            this.engine.objects.add(this);
        }
        tags.forEach(tag => (tag === null || tag === void 0 ? void 0 : tag.isObjGroup) == true && tag.add(this));
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
        if ((engine === null || engine === void 0 ? void 0 : engine._pc_by_orago) != 'orago is the coolest lol') {
            throw 'Cannot Create Tag Set';
        }
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
class Engine {
    constructor(brush) {
        this._pc_by_orago = 'orago is the coolest lol';
        this.objects = new Set();
        this.offset = new vector_1.Vector2;
        this.zoom = 3;
        this.frame = 0;
        this.collision = collision_js_1.Collision;
        this.object = (data, ref) => new EngineObject(this, data)
            .ref(ref);
        this.brush = brush;
        if (brush.canvas instanceof HTMLCanvasElement != true) {
            throw new Error('Cannot use offscreen canvas for engine');
        }
        else if (brush.canvas.parentElement == null) {
            throw new Error('Cannot assign container');
        }
        brush.canvas.setAttribute('tabindex', '1');
        this.cursor = new cursor_js_1.default(brush.canvas);
        this.keyboard = new keyboard_js_1.default(brush.canvas.parentElement);
        this.ticks = new repeater_js_1.Repeater(64, () => {
            var _a;
            this.frame = (_a = this === null || this === void 0 ? void 0 : this.ticks) === null || _a === void 0 ? void 0 : _a.frame;
            for (const item of this.orderedObjects) {
                item.tick();
            }
        });
        this.ticks.start();
        this.cursor.events.on('click', () => {
            for (const obj of this.orderedObjects) {
                const screenObj = obj.toScreen();
                const clicked = this.collision.rectContains({
                    x: screenObj.x,
                    y: screenObj.y,
                    w: screenObj.width,
                    h: screenObj.height
                }, this.cursor.pos);
                if (clicked == true && obj.enabled) {
                    obj.events.emit('click', this.cursor.pos);
                }
            }
        });
    }
    get orderedObjects() {
        return Array.from(this.objects).sort((a, b) => a.priority - b.priority);
    }
    screenToWorld(pos, options) {
        return screenToWorld(pos, {
            center: (options === null || options === void 0 ? void 0 : options.center) === true ? this.brush.center() : { x: 0, y: 0 },
            offset: this.offset,
            zoom: this.zoom
        });
    }
    worldToScreen(pos, options) {
        return worldToScreen(pos, {
            center: (options === null || options === void 0 ? void 0 : options.center) === true ? this.brush.center() : { x: 0, y: 0 },
            offset: this.offset,
            zoom: this.zoom
        });
    }
    get objectGroup() {
        return new createObjectGroup(this);
    }
    findObjects(search) {
        return Array.from(this.objects).filter(search);
    }
    allowZoom() {
        const eng = this;
        this.brush.canvas.addEventListener('wheel', (evt) => {
            if (evt instanceof WheelEvent) {
                if (evt.deltaY > 0 && eng.zoom > zoomIncrement)
                    eng.zoom -= zoomIncrement;
                else if (evt.deltaY < 0 && eng.zoom < 20)
                    eng.zoom += zoomIncrement;
            }
        }, false);
        let initialDistance;
        let pinch_Start_Scale;
        let engine_Mobile_Zoom;
        function parsePinchScale(event) {
            if (event.touches.length !== 2)
                return;
            const [touch1, touch2] = Array.from(event.touches);
            const distance = Math.sqrt(Math.pow((touch2.pageX - touch1.pageX), 2) + Math.pow((touch2.pageY - touch1.pageY), 2));
            if (initialDistance == null) {
                initialDistance = distance;
                return;
            }
            return distance / initialDistance;
        }
        this.brush.canvas.addEventListener('touchstart', function handlePinchStart(event) {
            event.preventDefault();
            if (event instanceof TouchEvent) {
                pinch_Start_Scale = parsePinchScale(event);
                engine_Mobile_Zoom = eng.zoom;
            }
        });
        this.brush.canvas.addEventListener('touchmove', function handlePinch(event) {
            event.preventDefault();
            if (event instanceof TouchEvent) {
                const scale = parsePinchScale(event);
                if (scale == null ||
                    pinch_Start_Scale == null ||
                    engine_Mobile_Zoom == null)
                    return;
                eng.zoom = Math.floor(engine_Mobile_Zoom + (scale - pinch_Start_Scale));
            }
        });
        this.brush.canvas.addEventListener('touchend', function handlePinch(event) {
            event.preventDefault();
            engine_Mobile_Zoom = undefined;
            pinch_Start_Scale = undefined;
        });
        return this;
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
        for (const object of Array.from(this.objects))
            object.removeType();
    }
}
exports.default = Engine;
