(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.oragame = {}));
})(this, (function (exports) { 'use strict';

    class Component {
        constructor() {
            /**
             * Overridden by ECS once it tracks this Component.
             */
            this.signal = () => { };
        }
        /**
         * If a Component wants to support dirty Component optimization, it
         * manages its own bookkeeping of whether its state has changed,
         * and calls `dirty()` on itself when it has.
         */
        dirty() {
            this.signal();
        }
    }

    // Built off
    function queryEntities(ecs, components) {
        const entities = Array.from(new Set(ecs.entities.getAll()));
        const need = new Set(components);
        return entities.filter((entity) => {
            return entity.components.hasAll(need);
        });
    }
    class EcsKeepingUtility {
        constructor(ecs) {
            this.ecs = ecs;
            this.ecs = ecs;
        }
        // public __checkE(entity: Entity): void {
        // 	for (let system of this.ecs.systems.list.keys()) {
        // 		this.checkES(entity, system);
        // 	}
        // }
        checkEntity(entity) {
            for (let system of this.ecs.systems.list.keys()) {
                this.checkES(entity, system);
            }
        }
        checkES(entity, system) {
            const list = this.ecs.systems.list.get(system);
            const hasRequired = entity.components.hasAll(system.components);
            const hasExcluded = system.filter != undefined
                ? entity.components.hasAny(system.filter)
                : false;
            if (hasRequired && !hasExcluded) {
                // Should be in system
                list === null || list === void 0 ? void 0 : list.add(entity); // no-op if already in
            }
            else {
                // Should not be in system
                list === null || list === void 0 ? void 0 : list.delete(entity); // no-op if already out
            }
        }
        __componentDirty(entity, component) {
            var _a, _b;
            const got = this.ecs.systems.dirty.get(component.constructor);
            // For all systems that care about this Component becoming
            // dirty, tell them, but only if they're actually tracking
            // this Entity.
            if ((got === null || got === void 0 ? void 0 : got.size) == null) {
                return;
            }
            for (let system of got) {
                if ((_a = this.ecs.systems.list.get(system)) === null || _a === void 0 ? void 0 : _a.has(entity)) {
                    (_b = this.ecs.entities.dirty.get(system)) === null || _b === void 0 ? void 0 : _b.add(entity);
                }
            }
        }
    }
    class EcsSystemKeeping {
        constructor(ecs) {
            this.ecs = ecs;
            this.list = new Map();
            this.dirty = new Map();
            /**
             * @deprecated
             * ⚠️ INTERNAL — DO NOT CALL DIRECTLY!
             * This is managed by the ECS lifecycle.
             */
            this.destroyQueue = new Array();
            /**
             * @deprecated
             * ⚠️ INTERNAL — DO NOT CALL DIRECTLY!
             * This is managed by the ECS lifecycle.
             */
            this.priorities = [];
            this.ecs = ecs;
        }
        add(...systems) {
            var _a;
            for (const system of systems) {
                // Checking invariant: systems should not have an empty
                // Components list, or they'll run on every entity. Simply remove
                // or special case this check if you do want a System that runs
                // on everything.
                if (system.components.size == 0) {
                    console.warn("System not added: empty Components list.");
                    console.warn(system);
                    return;
                }
                // Give system a reference to the ECS so it can actually do
                // anything.
                // system.ecs = this;
                // Save system and set who it should track immediately.
                this.list.set(system, new Set());
                this.ecs.components.dirty.set(system, new Set());
                for (let entity of this.ecs.entities.getAll()) {
                    this.ecs._util.checkES(entity, system);
                }
                const dirtyComponents = this.ecs.components.dirty.get(system);
                if (dirtyComponents != undefined) {
                    // Bookkeeping for dirty Component optimization.
                    for (let c of dirtyComponents) {
                        if (!this.dirty.has(c)) {
                            this.dirty.set(c, new Set());
                        }
                        (_a = this.dirty.get(c)) === null || _a === void 0 ? void 0 : _a.add(system);
                    }
                }
                this.ecs.entities.dirty.set(system, new Set());
            }
            this.sortSystems();
        }
        /**
         * Marks `systems` for removal. The actual removal happens at the end
         * of the next `update()`.
         */
        remove(system) {
            this.destroyQueue.push(system);
        }
        getAll() {
            return Array.from(this.list.keys());
        }
        clear() {
            this.destroyQueue = this.getAll();
        }
        sortSystems() {
            // Extract all systems
            this.priorities = this.getAll();
            // Sort their priorities
            // Yes, you actually need a custom sorting function for numbers.
            this.priorities.sort((a, b) => a.priority - b.priority);
        }
    }
    class EcsComponentsKeeping {
        constructor(ecs) {
            this.ecs = ecs;
            this.dirty = new Map();
            this.ecs = ecs;
        }
        add(entity, components) {
            if (Array.isArray(components)) {
                this._handleMultiple(entity, components);
            }
            else {
                this._handleMultiple(entity, [components]);
            }
            this.ecs.entities.add(entity);
        }
        /**
         * @deprecated
         * ⚠️ INTERNAL — DO NOT CALL DIRECTLY!
         * This is managed by the ECS lifecycle.
         */
        _handleMultiple(entity, components) {
            for (const component of components) {
                entity.components.add(component);
                // Let Component signal ECS when it gets dirty.
                component.signal = () => this.ecs._util.__componentDirty(entity, component);
            }
            this.ecs._util.checkEntity(entity);
            for (const component of components) {
                // Initial dirty signal to broadcast to interested Systems so
                // that it gets a first update.
                component.signal();
            }
        }
        remove(entity, component_class) {
            if (component_class instanceof Component) {
                entity.components.delete(Component.constructor);
            }
            else {
                entity.components.delete(component_class);
            }
            this.ecs._util.checkEntity(entity);
        }
    }
    class EcsEntityKeeping {
        constructor(ecs) {
            this.ecs = ecs;
            // public readonly list = new Set<Entity>();
            this.dirty = new Map();
            /**
             * @deprecated
             * ⚠️ INTERNAL — DO NOT CALL DIRECTLY!
             * This is managed by the ECS lifecycle.
             */
            this.insertQueue = new Array();
            /**
             * @deprecated
             * ⚠️ INTERNAL — DO NOT CALL DIRECTLY!
             * This is managed by the ECS lifecycle.
             */
            this.destroyQueue = new Array();
            this.ecs = ecs;
        }
        add(entity) {
            // this.list.add(entity);
            // this.ecs._util.__checkE(entity);
            this.insertQueue.push(entity);
        }
        /**
         * Marks `entity` for removal. The actual removal happens at the end
         * of the next `update()`. This way we avoid subtle bugs where an
         * Entity is removed mid-`update()`, with some Systems seeing it and
         * others not.
         */
        remove(entity) {
            this.destroyQueue.push(entity);
        }
        clear() {
            this.destroyQueue = this.getAll();
        }
        getAll() {
            return Array.from(new Set([
                // ...Array.from(this.list).map((e) => e),
                ...Array.from(this.ecs.systems.list.values())
                    .map((e) => Array.from(e))
                    .flat(),
            ]));
        }
        query(...components) {
            return queryEntities(this.ecs, components);
        }
    }
    /**
     * The ECS is the main driver; it's the backbone of the engine that
     * coordinates Entities, Components, and Systems. You could have a single
     * one for your game, or make a different one for every level, or have
     * multiple for different purposes.
     */
    class Ecs {
        constructor() {
            /**
             * ⚠️ INTERNAL — Be careful when using this!
             */
            this._util = new EcsKeepingUtility(this);
            // Main state
            this.entities = new EcsEntityKeeping(this);
            this.systems = new EcsSystemKeeping(this);
            this.components = new EcsComponentsKeeping(this);
        }
        // Bookkeeping for entities.
        // private nextEntityID = 0
        // private entitiesToDestroy: Entity[] = new Array();
        // private systemsToDestroy: System[] = new Array();
        // Dirty Component optimization.
        // private readonly dirtySystemsCare = new Map<Function, Set<System>>();
        // private readonly dirtyEntities = new Map<System, Set<Entity>>();
        // private readonly dirtyComponents = new Map<System, Set<Function>>();
        /**
         * This is ordinarily called once per tick (e.g., every frame). It
         * updates all Systems, then destroys any Entities that were marked
         * for removal.
         */
        update() {
            // while (this.components.insertQueue.length > 0) {
            // 	const [entity, components] =
            // 		this.components.insertQueue.shift() as [Entity, Component[]];
            // 	this.components._handleMultiple(entity, components);
            // }
            while (this.entities.insertQueue.length > 0) {
                const entity = this.entities.insertQueue.pop();
                this._util.checkEntity(entity);
            }
            for (const system of this.systems.priorities) {
                const entities = this.systems.list.get(system);
                const dirtyEntities = this.entities.dirty.get(system);
                if (entities != undefined && dirtyEntities != undefined) {
                    system.update(entities, dirtyEntities);
                    dirtyEntities === null || dirtyEntities === void 0 ? void 0 : dirtyEntities.clear();
                }
            }
            // ! Old alive system
            // for (const entity of this.entities.getAll()) {
            // 	if (entity.alive == false) {
            // 		this.entities.remove(entity);
            // 	}
            // }
            // Update all systems. (Later, we'll add a way to specify the
            // update order.)
            // for (let [system, entities] of this.systems.entries()) {
            // 	system.update(entities, this.dirtyEntities.get(system) as Set<Entity>);
            // 	this.dirtyEntities.get(system)?.clear();
            // }
            // Remove any entities that were marked for deletion during the
            // update.
            while (this.entities.destroyQueue.length > 0) {
                this.destroyEntity(this.entities.destroyQueue.pop());
            }
            // Remove any systems that were marked for deletion during the
            // update.
            while (this.systems.destroyQueue.length > 0) {
                this.destroySystem(this.systems.destroyQueue.pop());
            }
        }
        // Private methods for doing internal state checks and mutations.
        destroyEntity(entity) {
            // this.entities.list.delete(entity);
            var _a;
            for (let [system, entities] of this.systems.list.entries()) {
                // Remove Entity from System (if applicable).
                entities.delete(entity); // no-op if doesn't have it
                // Remove Entity from dirty list if it was there.
                if (this.entities.dirty.has(system)) {
                    // Again, simply a no-op if it's not in there.
                    (_a = this.entities.dirty.get(system)) === null || _a === void 0 ? void 0 : _a.delete(entity);
                }
            }
        }
        destroySystem(system) {
            this.systems.list.delete(system);
            this.components.dirty.delete(system);
            this.systems.sortSystems();
        }
    }

    /**
     * This custom container is so that calling code can provide the
     * Component *instance* when adding (e.g., add(new Position(...))), and
     * provide the Component *class* otherwise (e.g., get(Position),
     * has(Position), delete(Position)).
     *
     * We also use two different types to refer to the Component's class:
     * `Function` and `ComponentClass<T>`. We use `Function` in most cases
     * because it is simpler to write. We use `ComponentClass<T>` in the
     * `get()` method, when we want TypeScript to know the type of the
     * instance that is returned. Just think of these both as referring to
     * the same thing: the underlying class of the Component.
     *
     * You might notice a footgun here: code that gets this object can
     * directly modify the Components inside (with add(...) and delete(...)).
     * This would screw up our ECS bookkeeping of mapping Systems to
     * Entities! We'll fix this later by only returning callers a view onto
     * the Components that can't change them.
     */
    class ComponentContainer {
        constructor() {
            /**
             * Don't tinker with this unless you know what you're doing
             */
            this.map = new Map();
        }
        add(component) {
            this.map.set(component.constructor, component);
        }
        get(component_class) {
            return this.map.get(component_class);
        }
        has(component_class) {
            return this.map.has(component_class);
        }
        hasAll(component_classes) {
            for (let cls of component_classes) {
                if (!this.map.has(cls)) {
                    return false;
                }
            }
            return true;
        }
        hasAny(component_classes) {
            for (let cls of component_classes) {
                if (this.map.has(cls)) {
                    return true;
                }
            }
            return false;
        }
        delete(component_class) {
            this.map.delete(component_class);
        }
    }
    class Entity {
        // protected readonly ecs: ECS
        constructor() {
            this.components = new ComponentContainer();
            this.id = Entity.count++;
            // this.ecs = ecs;
        }
    }
    Entity.Components = ComponentContainer;
    Entity.count = 0;

    class System {
        // public readonly dirtyComponents: Set<Function> = new Set();
        // public readonly remove_entity_queue: Set<Entity> = new Set();
        constructor() {
            this.priority = 1;
            this.id = System.count++;
        }
    }
    System.count = 0;

    var index = {
        Ecs,
        Component,
        Entity,
        System,
    };

    var index$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Component: Component,
        Ecs: Ecs,
        Entity: Entity,
        System: System,
        default: index
    });

    function gridFrame(obj, frames, fps) {
        const time = performance.now() / 1000;
        return (Math.floor(time / (1 / fps)) + obj.x + obj.y) % Math.max(frames, 1);
    }
    function getFrameCount(rect, gridSize) {
        return ((rect.width == gridSize.width ? 0 : rect.width) / gridSize.width +
            (rect.height == gridSize.height ? 0 : rect.height) / gridSize.height);
    }
    function gridsheetAnimation(frames, currentTime, endTime) {
        return Math.min(Math.floor((currentTime / endTime) * frames), frames - 1);
    }
    /**
     * Returns an offset vector
     */
    function calculateGridWrapOffset(rect, gridSize, frame) {
        var _a, _b;
        const gridWidth = (_a = gridSize === null || gridSize === void 0 ? void 0 : gridSize.width) !== null && _a !== void 0 ? _a : 0;
        const gridHeight = (_b = gridSize === null || gridSize === void 0 ? void 0 : gridSize.height) !== null && _b !== void 0 ? _b : 0;
        // Calculate the number of columns in the grid
        const numCols = Math.ceil(rect.width / gridWidth);
        // Calculate the row and column of the frame based on frame number
        const frameRow = Math.floor(frame / numCols);
        const frameCol = frame % numCols;
        // Calculate the offset of the frame within the grid
        const offsetX = frameCol * gridWidth;
        const offsetY = frameRow * gridHeight;
        return [offsetX, offsetY];
    }

    var boxes = /*#__PURE__*/Object.freeze({
        __proto__: null,
        calculateGridWrapOffset: calculateGridWrapOffset,
        getFrameCount: getFrameCount,
        gridFrame: gridFrame,
        gridsheetAnimation: gridsheetAnimation
    });

    class Collision {
        static rect(a, b) {
            return (a.x + a.width > b.x &&
                a.x < b.x + b.width &&
                a.y + a.height > b.y &&
                a.y < b.y + b.height);
        }
        static rectContains(outer, inner) {
            return (inner.x >= outer.x &&
                inner.x + inner.width <= outer.x + outer.width &&
                inner.y >= outer.y &&
                inner.y + inner.height <= outer.y + outer.height);
        }
        static circle(a, b) {
            const distX = Math.abs(b.x - a.x);
            const distY = Math.abs(b.y - a.y);
            const distance = Math.sqrt(distX * distX + distY * distY);
            return distance < a.r + b.r;
        }
    }

    class Rect {
        static scaleToFitRatio(container, child) {
            // Calculate aspect ratios
            const containerRatio = container.width / container.height;
            const rectRatio = child.width / child.height;
            // Scale the rectangle to fit within the container
            if (rectRatio > containerRatio)
                return container.width / child.width;
            else
                return container.height / child.height;
        }
        static scaleToFit(container, child) {
            // Calculate aspect ratios
            const scaleFactor = Rect.scaleToFitRatio(container, child);
            // Calculate the scaled dimensions
            const width = child.width * scaleFactor;
            const height = child.height * scaleFactor;
            return { width, height };
        }
        static scale(width, height, scale) {
            return { width: width * scale, height: height * scale };
        }
        static from(obj) {
            return new Rect(obj.width, obj.height);
        }
        static contains(parent, child) {
            var _a, _b;
            const parentx2 = parent.x + parent.width;
            const parenty2 = parent.y + parent.height;
            const childx2 = child.x + ((_a = child === null || child === void 0 ? void 0 : child.width) !== null && _a !== void 0 ? _a : 0);
            const childy2 = child.y + ((_b = child === null || child === void 0 ? void 0 : child.height) !== null && _b !== void 0 ? _b : 0);
            return (parent.x <= child.x &&
                parentx2 >= childx2 &&
                parent.y <= child.y &&
                parenty2 >= childy2);
        }
        static centerChild(parent, child) {
            var _a, _b;
            return {
                x: parent.x + (parent.width - child.width) / 2,
                y: parent.y + (parent.height - child.height) / 2,
                width: (_a = child.width) !== null && _a !== void 0 ? _a : 0,
                height: (_b = child.height) !== null && _b !== void 0 ? _b : 0,
            };
        }
        static toBound(rect) {
            var _a, _b;
            return [(_a = rect === null || rect === void 0 ? void 0 : rect.x) !== null && _a !== void 0 ? _a : 0, (_b = rect === null || rect === void 0 ? void 0 : rect.y) !== null && _b !== void 0 ? _b : 0, rect.width, rect.height];
        }
        constructor(width, height) {
            this.width = width;
            this.height = height;
        }
        *[Symbol.iterator]() {
            yield this.width;
            yield this.height;
        }
        /**
         * Upscales rectangle by scale factor
         * @param {number} scale
         * @returns {Rect}
         */
        scaled(scale) {
            return new Rect(this.width * scale, this.height * scale);
        }
        toFit(_ = this) {
            return Rect.from(Rect.scaleToFit(_, this));
        }
    }
    class Box extends Rect {
        static toBoundingBox(rect) {
            if (rect instanceof Box) {
                return new Bound(rect.x, rect.y, rect.width, rect.height);
            }
            if (rect instanceof Rect) {
                return new Bound(0, 0, rect.width, rect.height);
            }
        }
        constructor(x, y, width = 0, height = 0) {
            super(width, height);
            this.x = x;
            this.y = y;
        }
        position(vector) {
            if (vector == undefined) {
                return {
                    x: this.x,
                    y: this.y,
                };
            }
            this.x = vector.x;
            this.y = vector.y;
            return this;
        }
        clone() {
            return new Box(this.x, this.y, this.width, this.height);
        }
        move(...args) {
            if (typeof args[0] == "object") {
                this.x += args[0].x;
                this.y += args[0].y;
            }
            else if (typeof args[0] === "number" && typeof args[1] === "number") {
                this.x += args[0];
                this.y += args[1];
            }
            return this;
        }
    }
    class Bound {
        static toPositionalRect(bound) {
            const [x1, y1, x2, y2] = bound;
            const x = Math.min(x1, x2); // Get the minimum x-coordinate as the top-left corner x
            const y = Math.min(y1, y2); // Get the minimum y-coordinate as the top-left corner y
            const w = Math.abs(x2 - x1); // Calculate the width as the absolute difference between x2 and x1
            const h = Math.abs(y2 - y1); // Calculate the height as the absolute difference between y2 and y1
            return new Box(x, y, w, h);
        }
        constructor(x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
            this.positions = [0, 0, 0, 0];
            this.positions = [x1, y1, x2, y2];
        }
        clear() {
            this.positions = [0, 0, 0, 0];
        }
        set(...items) {
            if (Array.isArray(items) != true) {
                return;
            }
            this.clear();
            items.slice(0, 4).map((n, index) => {
                this.positions[index] = typeof n === "number" ? n : 0;
            });
        }
        toRect() {
            return Bound.toPositionalRect(this);
        }
        get valid() {
            return this.positions.some((n) => typeof n !== "number") != true;
        }
        *[Symbol.iterator]() {
            for (const p of this.positions) {
                yield p;
            }
        }
    }

    var shapes = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Bound: Bound,
        Box: Box,
        Rect: Rect
    });

    exports.Bound = Bound;
    exports.Box = Box;
    exports.BoxUtil = boxes;
    exports.Collision = Collision;
    exports.Ecs = index$1;
    exports.Rect = Rect;
    exports.Shapes = shapes;

}));
