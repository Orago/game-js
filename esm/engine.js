var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _createObjectGroup_items;
import Emitter from '@orago/lib/emitter';
import { Vector2 } from '@orago/vector';
import { v4 as uuidV4 } from 'uuid';
import { Collision } from './collision.js';
import Cursor from './input/cursor.js';
import Keyboard from './input/keyboard.js';
import { Repeater } from './repeater.js';
const zoomIncrement = .2;
export class EngineObject {
    constructor(engineRef, data = {}) {
        this.id = uuidV4();
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.priority = 1;
        this.enabled = true;
        this.visible = true;
        this.events = new Emitter();
        this.engine = engineRef;
        if (typeof data === 'object') {
            if (typeof data.x === 'number') {
                this.x = data.x;
            }
            if (typeof data.y === 'number') {
                this.y = data.y;
            }
            if (typeof data.width === 'number') {
                this.width = data.width;
            }
            if (typeof data.height === 'number') {
                this.height = data.height;
            }
            if (typeof data.priority === 'number') {
                this.priority = data.priority;
            }
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
export default class Engine {
    constructor(brush) {
        this._pc_by_orago = 'orago is the coolest lol';
        this.objects = new Set();
        this.offset = new Vector2;
        this.zoom = 3;
        this.frame = 0;
        this.collision = Collision;
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
        this.cursor = new Cursor(brush.canvas);
        this.keyboard = new Keyboard(brush.canvas.parentElement);
        this.ticks = new Repeater(64, () => {
            var _a;
            this.frame = (_a = this === null || this === void 0 ? void 0 : this.ticks) === null || _a === void 0 ? void 0 : _a.frame;
            for (const item of this.orderedObjects) {
                item.tick();
            }
        });
        this.ticks.start();
        this.cursor.events.on('click', () => {
            for (const obj of this.orderedObjects) {
                const clicked = this.collision.rectContains({
                    x: obj.x,
                    y: obj.y,
                    w: obj.width,
                    h: obj.height
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
        const center = (options === null || options === void 0 ? void 0 : options.center) === true ? this.brush.center() : { x: 0, y: 0 };
        pos.x - 5;
        return new Vector2((pos.x - this.offset.x) * this.zoom + center.x, (pos.y - this.offset.y) * this.zoom + center.y);
    }
    worldToScreen(pos, options) {
        const center = (options === null || options === void 0 ? void 0 : options.center) === true ? this.brush.center() : { x: 0, y: 0 };
        return new Vector2((pos.x / this.zoom - this.offset.x) - center.x / this.zoom, (pos.y / this.zoom - this.offset.y) - center.y / this.zoom);
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
                if (evt.deltaY > 0 && eng.zoom > zoomIncrement) {
                    eng.zoom -= zoomIncrement;
                }
                else if (evt.deltaY < 0 && eng.zoom < 20) {
                    eng.zoom += zoomIncrement;
                }
            }
        }, false);
        let initialDistance;
        let pinch_Start_Scale;
        let engine_Mobile_Zoom;
        function parsePinchScale(event) {
            if (event.touches.length !== 2) {
                return;
            }
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
                if (scale == null || pinch_Start_Scale == null || engine_Mobile_Zoom == null)
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
        if (canvas instanceof HTMLCanvasElement) {
            canvas.style.cursor = `url(${url}), pointer`;
        }
        return this;
    }
    destroy() {
        this.keyboard.events.all.clear();
        this.cursor.reInit();
        for (const object of Array.from(this.objects)) {
            object.removeType();
        }
    }
}
