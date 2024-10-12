var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _createObjectGroup_items;
import { ECS } from '@orago/ecs';
import { Collision } from './collision.js';
import Cursor from './input/cursor.js';
import Keyboard from './input/keyboard.js';
import { LegacyEntity, LegacySystem } from './plugins/legacy.js';
import { Repeater } from './repeater.js';
export * from '@orago/ecs';
const zoomIncrement = .2;
export function screenToWorld(screen, options) {
    var _a, _b, _c;
    const center = (_a = options === null || options === void 0 ? void 0 : options.center) !== null && _a !== void 0 ? _a : { x: 0, y: 0 };
    const offset = (_b = options === null || options === void 0 ? void 0 : options.offset) !== null && _b !== void 0 ? _b : { x: 0, y: 0 };
    const zoom = (_c = options === null || options === void 0 ? void 0 : options.zoom) !== null && _c !== void 0 ? _c : 1;
    return {
        x: (screen.x - center.x) / zoom + offset.x,
        y: (screen.y - center.y) / zoom + offset.y
    };
}
export function worldToScreen(world, options) {
    var _a, _b, _c;
    const center = (_a = options === null || options === void 0 ? void 0 : options.center) !== null && _a !== void 0 ? _a : { x: 0, y: 0 };
    const offset = (_b = options === null || options === void 0 ? void 0 : options.offset) !== null && _b !== void 0 ? _b : { x: 0, y: 0 };
    const zoom = (_c = options === null || options === void 0 ? void 0 : options.zoom) !== null && _c !== void 0 ? _c : 1;
    return {
        x: (world.x - offset.x) * zoom + center.x,
        y: (world.y - offset.y) * zoom + center.y
    };
}
/**
 * Engine Object
 * ! SHOULD NOT BE USED ON IT'S OWN
 * @class
 */
export class EngineObject extends LegacyEntity {
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
        this.ecs = new ECS();
        this.legacy = new LegacySystem(this.ecs, this);
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
        this.collision = Collision;
        this.object = (data, ref) => {
            const entity = new LegacyEntity(this.ecs);
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
        this.cursor = new Cursor(brush.canvas);
        this.keyboard = new Keyboard(brush.canvas.parentElement);
        this.ticks = new Repeater(64, () => {
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
World.ECS = ECS;
export default World;
