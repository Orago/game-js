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
        this.map = new Map();
    }
    add(component) {
        this.map.set(component.constructor, component);
    }
    get(componentClass) {
        return this.map.get(componentClass);
    }
    has(componentClass) {
        return this.map.has(componentClass);
    }
    hasAll(componentClasses) {
        for (let cls of componentClasses)
            if (!this.map.has(cls))
                return false;
        return true;
    }
    delete(componentClass) {
        this.map.delete(componentClass);
    }
}
class Entity {
    constructor(
    // protected readonly ecs: ECS
    ) {
        this.components = new ComponentContainer();
        this.id = Entity.count++;
        // this.ecs = ecs;
    }
}
Entity.Components = ComponentContainer;
Entity.count = 0;

class System {
    constructor() {
        this.priority = 1;
        this.dirtyComponents = new Set();
        this.id = System.count++;
    }
}
System.count = 0;

// Built off 
// https://maxwellforbes.com/posts/typescript-ecs-systems/
/**
 * The ECS is the main driver; it's the backbone of the engine that
 * coordinates Entities, Components, and Systems. You could have a single
 * one for your game, or make a different one for every level, or have
 * multiple for different purposes.
 */
class ECS {
    constructor() {
        // Main state
        this.entities = new Set();
        this.systems = new Map();
        // Bookkeeping for entities.
        // private nextEntityID = 0
        this.entitiesToDestroy = new Array();
        this.systemsToDestroy = new Array();
        // Dirty Component optimization.
        this.dirtySystemsCare = new Map();
        this.dirtyEntities = new Map();
        this.priorities = [];
    }
    // API: Entities
    addEntity(entity) {
        this.entities.add(entity);
        this.__checkE(entity);
    }
    getEntities() {
        return Array.from(new Set([
            ...Array
                .from(this.entities)
                .map(e => e),
            ...Array
                .from(this.systems.values())
                .map(e => Array.from(e)).flat()
        ]));
    }
    /**
     * Marks `entity` for removal. The actual removal happens at the end
     * of the next `update()`. This way we avoid subtle bugs where an
     * Entity is removed mid-`update()`, with some Systems seeing it and
     * others not.
     */
    removeEntity(entity) {
        this.entitiesToDestroy.push(entity);
    }
    killEntities() {
        this.entitiesToDestroy = this.getEntities();
    }
    killSystems() {
        this.systemsToDestroy = Array.from(new Set([
            ...Array
                .from(this.systems)
                .map(e => e[0])
        ]));
    }
    // API: Systems
    addSystem(system) {
        var _a;
        // Checking invariant: systems should not have an empty
        // Components list, or they'll run on every entity. Simply remove
        // or special case this check if you do want a System that runs
        // on everything.
        if (system.componentsRequired.size == 0) {
            console.warn("System not added: empty Components list.");
            console.warn(system);
            return;
        }
        // Give system a reference to the ECS so it can actually do
        // anything.
        // system.ecs = this;
        // Save system and set who it should track immediately.
        this.systems.set(system, new Set());
        for (let entity of this.entities.keys()) {
            this.checkES(entity, system);
        }
        // Bookkeeping for dirty Component optimization.
        for (let c of system.dirtyComponents) {
            if (!this.dirtySystemsCare.has(c))
                this.dirtySystemsCare.set(c, new Set());
            (_a = this.dirtySystemsCare.get(c)) === null || _a === void 0 ? void 0 : _a.add(system);
        }
        this.dirtyEntities.set(system, new Set());
        // (a) Make a sorted list for calling updates in order.
        this.priorities = Array.from((new Set(this.priorities)).add(system));
        // Yes, you actually need a custom sorting function for numbers.
        this.priorities.sort((a, b) => a.priority - b.priority);
    }
    addComponent(entity, component) {
        entity.components.add(component);
        // Let Component signal ECS when it gets dirty.
        component.signal = () => this.__componentDirty(entity, component);
        this.__checkE(entity);
        // Initial dirty signal to broadcast to interested Systems so
        // that it gets a first update.
        component.signal();
    }
    removeComponent(entity, componentClass) {
        if (componentClass instanceof Component)
            entity.components.delete(Component.constructor);
        else
            entity.components.delete(componentClass);
        this.__checkE(entity);
    }
    /**
     * Note: Removed the removeSystem() function here because it was
     * just for proof-of-concept in the initial post. If we kept it,
     * we'd need to remove the system from `dirtySystemsCare` and
     * `dirtyEntities`.

    /**
     * This is ordinarily called once per tick (e.g., every frame). It
     * updates all Systems, then destroys any Entities that were marked
     * for removal.
     */
    update() {
        var _a;
        for (const system of this.priorities) {
            const entities = this.systems.get(system);
            system.update(entities, this.dirtyEntities.get(system));
            (_a = this.dirtyEntities.get(system)) === null || _a === void 0 ? void 0 : _a.clear();
        }
        // Update all systems. (Later, we'll add a way to specify the
        // update order.)
        // for (let [system, entities] of this.systems.entries()) {
        // 	system.update(entities, this.dirtyEntities.get(system) as Set<Entity>);
        // 	this.dirtyEntities.get(system)?.clear();
        // }
        // Remove any entities that were marked for deletion during the
        // update.
        while (this.entitiesToDestroy.length > 0)
            this.destroyEntity(this.entitiesToDestroy.pop());
        // Remove any entities that were marked for deletion during the
        // update.
        while (this.systemsToDestroy.length > 0)
            this.destroySystem(this.systemsToDestroy.pop());
    }
    // Private methods for doing internal state checks and mutations.
    destroyEntity(entity) {
        var _a;
        this.entities.delete(entity);
        for (let [system, entities] of this.systems.entries()) {
            // Remove Entity from System (if applicable).
            entities.delete(entity); // no-op if doesn't have it
            // Remove Entity from dirty list if it was there.
            if (this.dirtyEntities.has(system)) {
                // Again, simply a no-op if it's not in there.
                (_a = this.dirtyEntities.get(system)) === null || _a === void 0 ? void 0 : _a.delete(entity);
            }
        }
    }
    destroySystem(system) {
        this.systems.delete(system);
        this.priorities = this.priorities.filter(e => e != system);
    }
    __checkE(entity) {
        for (let system of this.systems.keys())
            this.checkES(entity, system);
    }
    checkES(entity, system) {
        const need = system.componentsRequired;
        const list = this.systems.get(system);
        if (entity.components.hasAll(need))
            // should be in system
            list === null || list === void 0 ? void 0 : list.add(entity); // no-op if in
        else
            // should not be in system
            list === null || list === void 0 ? void 0 : list.delete(entity); // no-op if out
    }
    __componentDirty(entity, component) {
        var _a, _b;
        const got = this.dirtySystemsCare.get(component.constructor);
        // For all systems that care about this Component becoming
        // dirty, tell them, but only if they're actually tracking
        // this Entity.
        if ((got === null || got === void 0 ? void 0 : got.size) == null)
            return;
        for (let system of got)
            if ((_a = this.systems.get(system)) === null || _a === void 0 ? void 0 : _a.has(entity))
                (_b = this.dirtyEntities.get(system)) === null || _b === void 0 ? void 0 : _b.add(entity);
    }
}
ECS.System = System;
ECS.Entity = Entity;

var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Component: Component,
    ECS: ECS,
    Entity: Entity,
    System: System
});

function gridFrame(obj, frames, fps) {
    const time = performance.now() / 1000;
    return ((Math.floor(time / (1 / fps))
        + obj.x
        + obj.y)
        % Math.max(frames, 1));
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

class CanvasRender {
    static Image(context, image, from = [], to = []) {
        if ((image instanceof HTMLImageElement ||
            image instanceof HTMLCanvasElement ||
            image instanceof OffscreenCanvas) != true)
            return;
        const [preX = 0, preY = 0, preW = image.width, preH = image.height] = Array.isArray(from) ? from : [];
        const [x = 0, y = 0, w = image.width, h = image.height] = Array.isArray(to) ? to : [];
        try {
            context.drawImage(image, preX, preY, preW, preH, x, y, w, h);
        }
        catch (err) { }
    }
    static text(context, text, { x, y, w }) {
        x |= 0;
        y |= 0;
        context.fillText(text, x, y, w);
    }
    static partialCircle(context, values) {
        let { x = 0, y = 0, radius = 10, percent, strokeWidth } = values;
        const color = context.fillStyle;
        radius /= 2;
        context.save();
        context.beginPath();
        let amt = ((2 / 100) * percent) + 1.5;
        if (amt > 2)
            amt = amt - 2;
        context.arc(x, y, radius, amt * Math.PI, 1.5 * Math.PI, false); //25%
        context.fillStyle = "transparent";
        context.fill();
        context.lineWidth = strokeWidth !== null && strokeWidth !== void 0 ? strokeWidth : (radius - .3) * 2;
        context.strokeStyle = color;
        context.stroke();
        context.restore();
    }
    static fullCircle(context, values) {
        const { x = 0, y = 0, radius = 10, stroke, strokeWidth } = values;
        context.save();
        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI, false);
        context.fill();
        if (typeof stroke == "string") {
            if (typeof strokeWidth === "number")
                context.lineWidth = strokeWidth;
            context.strokeStyle = stroke;
            context.stroke();
        }
        context.restore();
    }
    static circle(context, values) {
        if (typeof values.percent === "number")
            CanvasRender.partialCircle(context, values);
        else
            CanvasRender.fullCircle(context, values);
    }
}

let Emitter$1 = class Emitter {
    constructor(all) {
        this.all = new Map();
        if (all instanceof Map)
            this.all = all;
        else if (Array.isArray(all))
            this.all = new Map(all);
    }
    /** Adds a listener */
    on(event, callback) {
        const handlers = this.all.get(event);
        if (handlers)
            handlers.push(callback);
        else
            this.all.set(event, [callback]);
        return this;
    }
    /** Disables a listener */
    off(event, callback) {
        const handlers = this.all.get(event);
        if (handlers) {
            if (callback) {
                const index = handlers.indexOf(callback);
                if (index !== -1)
                    handlers.splice(index, 1);
            }
            else
                this.all.set(event, []);
        }
        return this;
    }
    /** Notifies all active listeners */
    emit(event, ...args) {
        let handlers = this.all.get(event);
        if (handlers)
            for (const handler of handlers.slice())
                handler(...args);
        if (handlers = this.all.get('*'))
            for (const handler of handlers.slice())
                handler(event, ...args);
        return this;
    }
    once(event, callback) {
        const once_callback = (...args) => {
            this.off(event, once_callback);
            callback(...args);
            return void 0;
        };
        this.on(event, once_callback);
        return this;
    }
    *[Symbol.iterator]() {
        for (const entry of this.all.entries())
            yield entry;
    }
};

class ChainableConfig {
    constructor(data) {
        this.canvas = document.createElement("canvas");
        this.color = "black";
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.ctx = data.ctx;
        if (data.canvas != null)
            this.canvas = data.canvas;
        if (typeof data.color === "string")
            this.color = data.color;
        if (typeof data.x === "number")
            this.x = data.x;
        if (typeof data.y === "number")
            this.y = data.y;
        if (typeof data.w === "number")
            this.w = data.w;
        if (typeof data.h === "number")
            this.h = data.h;
    }
    get rect() {
        return [this.x, this.y, this.w, this.h];
    }
}
/**
 * ! Should not be used on it"s own
 */
class ChainableCanvas {
    constructor(brush) {
        this.stack = [];
        this.stack.push(new ChainableConfig({
            canvas: brush.canvas,
            ctx: brush.ctx
        }));
        this.last_config = this.getConfig();
        this.canvas = this.last_config.canvas;
        this.ctx = this.last_config.ctx;
    }
    update_config() {
        this.last_config = this.getConfig();
        this.canvas = this.last_config.canvas;
        this.ctx = this.last_config.ctx;
        return this.last_config;
    }
    getConfig() {
        return this.stack[this.stack.length - 1];
    }
    x(x) { this.last_config.x = x; return this; }
    y(y) { this.last_config.y = y; return this; }
    w(w) { this.last_config.w = w; return this; }
    h(h) { this.last_config.h = h; return this; }
    pos(x, y) {
        const config = this.last_config;
        if (typeof x == "number")
            config.x = x;
        if (typeof y == "number")
            config.y = y;
        return this;
    }
    size(width, height = width) {
        const config = this.last_config;
        if (typeof width == "number")
            config.w = width;
        if (typeof height == "number")
            config.h = height;
        return this;
    }
    // get recentConfig(): ChainableConfig {
    // 	return this.last_config;
    // }
    // getContext() { return this.last_config.ctx; }
    // get canvas() { return this.last_config.canvas; }
    // get ctx() { return this.last_config.ctx; }
    rotate(rotation, center) {
        var _a, _b;
        const config = this.getConfig();
        if (typeof center != "object") {
            center = {
                x: config.w / 2,
                y: config.h / 2
            };
        }
        (_a = center.x) !== null && _a !== void 0 ? _a : (center.x = config.w / 2);
        (_b = center.y) !== null && _b !== void 0 ? _b : (center.y = config.h / 2);
        this.last_config.ctx.translate(config.x + center.x, config.y + center.y);
        this.last_config.ctx.rotate(rotation * Math.PI / 180);
        config.x = -center.x;
        config.y = -center.y;
        return this;
    }
    opacity(amount) {
        this.last_config.ctx.globalAlpha = amount;
        return this;
    }
    image(image, fromPos, toPos = this.last_config.rect) {
        CanvasRender.Image(this.last_config.ctx, image, fromPos, toPos);
        return this;
    }
    /**
     * Renders text
     */
    text(text) {
        const [x, y] = this.last_config.rect;
        CanvasRender.text(this.last_config.ctx, text, { x, y });
        return this;
    }
    textWidth(text) {
        return this.last_config.ctx.measureText(text).width;
    }
    circle(override) {
        const [x, y, w] = this.last_config.rect;
        CanvasRender.circle(this.last_config.ctx, Object.assign({ x, y, radius: w }, override));
        return this;
    }
    /**
     * Sets global composite operation
     * Default is source-over
     */
    rendering(mode = "source-over") {
        this.last_config.ctx.globalCompositeOperation = mode;
        return this;
    }
    /** Sets color */
    color(color) { this.last_config.ctx.fillStyle = color; return this; }
    font(newFont) { this.last_config.ctx.font = newFont; return this; }
    generatedFont({ font = "Arial", weight = "normal", size = 16 } = {}) {
        return this.font(`${weight} ${size}px ${font}`);
    }
    /** Draws a rect to the screen */
    get rect() {
        this.last_config.ctx
            .fillRect(...this.last_config.rect);
        return this;
    }
    /** Saves the current canvas state */
    get save() {
        this.last_config.ctx.save();
        this.stack.push(new ChainableConfig(this.last_config));
        this.update_config();
        return this;
    }
    /** Restores the current canvas state */
    get restore() {
        this.last_config.ctx.restore();
        if (this.stack.length > 1)
            this.stack.pop();
        this.update_config();
        return this;
    }
    temp(callback) {
        this.last_config.ctx.save();
        callback(this);
        this.last_config.ctx.restore();
        return this;
    }
    get clear_stack() {
        let context = this;
        while (this.stack.length > 1)
            context = this.restore;
        return context;
    }
    ref(func) {
        func(this);
        return this;
    }
    /**
     * Flips rendering on horizontal axis
     * ! Mutates
     */
    get flipX() {
        const config = this.last_config;
        config.ctx.scale(-1, 1);
        config.x = config.x * -1 - config.w;
        return this;
    }
    /**
     * Flips Y rendering
     * ! Mutates
     */
    get flipY() {
        const config = this.last_config;
        config.ctx.scale(1, -1);
        config.y = config.y * -1 - config.h;
        return this;
    }
    /** Sets canvas size */
    canvasSize(width, height) {
        const smoothing = this.last_config.ctx.imageSmoothingEnabled;
        this.last_config.canvas.width = width;
        this.last_config.canvas.height = height;
        this.size(width, height);
        this.last_config.ctx.imageSmoothingEnabled = smoothing;
        return this;
    }
    /** Clears the canvas */
    get clear() {
        this.last_config.ctx.clearRect(0, 0, this.last_config.canvas.width, this.last_config.canvas.height);
        return this;
    }
    /** Clears cached rect */
    clearRect() {
        this.last_config.ctx.clearRect(...this.last_config.rect);
        return this;
    }
    get url() {
        return this.last_config.canvas.toDataURL();
    }
    temporaryOffset(x, y, callback) {
        const ctx = this.last_config.ctx;
        const _ = ctx.getTransform();
        ctx.setTransform(_.a, _.b, _.c, _.d, _.e + x, _.f + y);
        callback(this);
        ctx.setTransform(_.a, _.b, _.c, _.d, _.e, _.f);
        return this;
    }
    temporaryRotate(args, callback) {
        this.temp(chain => {
            chain.rotate(...args);
            callback(this);
        });
        return this;
    }
}

let colorKeywords = {
    aliceblue: "#f0f8ff",
    antiquewhite: "#faebd7",
    aqua: "#00ffff",
    aquamarine: "#7fffd4",
    azure: "#f0ffff",
    beige: "#f5f5dc",
    bisque: "#ffe4c4",
    black: "#000000",
    blanchedalmond: "#ffebcd",
    blue: "#0000ff",
    blueviolet: "#8a2be2",
    brown: "#a52a2a",
    burlywood: "#deb887",
    cadetblue: "#5f9ea0",
    chartreuse: "#7fff00",
    chocolate: "#d2691e",
    coral: "#ff7f50",
    cornflowerblue: "#6495ed",
    cornsilk: "#fff8dc",
    crimson: "#dc143c",
    cyan: "#00ffff",
    darkblue: "#00008b",
    darkcyan: "#008b8b",
    darkgoldenrod: "#b8860b",
    darkgray: "#a9a9a9",
    darkgreen: "#006400",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkseagreen: "#8fbc8f",
    darkslateblue: "#483d8b",
    darkslategray: "#2f4f4f",
    darkturquoise: "#00ced1",
    darkviolet: "#9400d3",
    deeppink: "#ff1493",
    deepskyblue: "#00bfff",
    dimgray: "#696969",
    dodgerblue: "#1e90ff",
    firebrick: "#b22222",
    floralwhite: "#fffaf0",
    forestgreen: "#228b22",
    fuchsia: "#ff00ff",
    gainsboro: "#dcdcdc",
    ghostwhite: "#f8f8ff",
    gold: "#ffd700",
    goldenrod: "#daa520",
    gray: "#808080",
    green: "#008000",
    greenyellow: "#adff2f",
    grey: "#808080",
    honeydew: "#f0fff0",
    hotpink: "#ff69b4",
    indianred: "#cd5c5c",
    indigo: "#4b0082",
    ivory: "#fffff0",
    khaki: "#f0e68c",
    lavender: "#e6e6fa",
    lavenderblush: "#fff0f5",
    lawngreen: "#7cfc00",
    lemonchiffon: "#fffacd",
    lightblue: "#add8e6",
    lightcoral: "#f08080",
    lightcyan: "#e0ffff",
    lightgoldenrodyellow: "#fafad2",
    lightgrey: "#d3d3d3",
    lightgreen: "#90ee90",
    lightpink: "#ffb6c1",
    lightsalmon: "#ffa07a",
    lightseagreen: "#20b2aa",
    lightskyblue: "#87cefa",
    lightslategray: "#778899",
    lightsteelblue: "#b0c4de",
    lightyellow: "#ffffe0",
    lime: "#00ff00",
    limegreen: "#32cd32",
    linen: "#faf0e6",
    magenta: "#ff00ff",
    maroon: "#800000",
    mediumaquamarine: "#66cdaa",
    mediumblue: "#0000cd",
    mediumorchid: "#ba55d3",
    mediumpurple: "#9370d8",
    mediumseagreen: "#3cb371",
    mediumslateblue: "#7b68ee",
    mediumspringgreen: "#00fa9a",
    mediumturquoise: "#48d1cc",
    mediumvioletred: "#c71585",
    midnightblue: "#191970",
    mintcream: "#f5fffa",
    mistyrose: "#ffe4e1",
    moccasin: "#ffe4b5",
    navajowhite: "#ffdead",
    navy: "#000080",
    oldlace: "#fdf5e6",
    olive: "#808000",
    olivedrab: "#6b8e23",
    orange: "#ffa500",
    orangered: "#ff4500",
    orchid: "#da70d6",
    palegoldenrod: "#eee8aa",
    palegreen: "#98fb98",
    paleturquoise: "#afeeee",
    palevioletred: "#d87093",
    papayawhip: "#ffefd5",
    peachpuff: "#ffdab9",
    peru: "#cd853f",
    pink: "#ffc0cb",
    plum: "#dda0dd",
    powderblue: "#b0e0e6",
    purple: "#800080",
    red: "#ff0000",
    rosybrown: "#bc8f8f",
    royalblue: "#4169e1",
    saddlebrown: "#8b4513",
    salmon: "#fa8072",
    sandybrown: "#f4a460",
    seagreen: "#2e8b57",
    seashell: "#fff5ee",
    sienna: "#a0522d",
    silver: "#c0c0c0",
    skyblue: "#87ceeb",
    slateblue: "#6a5acd",
    slategray: "#708090",
    snow: "#fffafa",
    springgreen: "#00ff7f",
    steelblue: "#4682b4",
    tan: "#d2b48c",
    teal: "#008080",
    thistle: "#d8bfd8",
    tomato: "#ff6347",
    turquoise: "#40e0d0",
    violet: "#ee82ee",
    wheat: "#f5deb3",
    white: "#ffffff",
    whitesmoke: "#f5f5f5",
    yellow: "#ffff00",
    yellowgreen: "#9acd32"
};

/**
 *  WebGL-2D.js - HTML5 Canvas2D API in a WebGL context
 *
 *  Created by Corban Brook <corbanbrook@gmail.com> on 2011-03-02.
 *  Amended to by Bobby Richter <secretrobotron@gmail.com> on 2011-03-03
 *  CubicVR.js by Charles Cliffe <cj@cubicproductions.com> on 2011-03-03
 *
 */
/*
 *  Copyright (c) 2011 Corban Brook
 *
 *  Permission is hereby granted, free of charge, to any person obtaining
 *  a copy of this software and associated documentation files (the
 *  "Software"), to deal in the Software without restriction, including
 *  without limitation the rights to use, copy, modify, merge, publish,
 *  distribute, sublicense, and/or sell copies of the Software, and to
 *  permit persons to whom the Software is furnished to do so, subject to
 *  the following conditions:
 *
 *  The above copyright notice and this permission notice shall be
 *  included in all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 *  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 *  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 *  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 *  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
/**
 * Usage:
 *
 *    var cvs = document.getElementById("myCanvas");
 *
 *    WebGL2D.enable(cvs); // adds "webgl-2d" to cvs
 *
 *    cvs.getContext("webgl-2d");
 *
 */
function isPOT(value) {
    return value > 0 && ((value - 1) & value) === 0;
}
function IsImageOk(img) {
    // During the onload event, IE correctly identifies any images that
    // weren’t downloaded as not complete. Others should too. Gecko-based
    // browsers act like NS4 in that they report this incorrectly.
    if (!img.complete) {
        return false;
    }
    // However, they do have two very useful properties: naturalWidth and
    // naturalHeight. These give the true size of the image. If it failed
    // to load, either of these should be zero.
    if (img.naturalWidth === 0) {
        return false;
    }
    // No other way of checking: assume it’s ok.
    return true;
}
let mat3 = {
    identity: [1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0],
    multiply(m1, m2) {
        var m10 = m1[0], m11 = m1[1], m12 = m1[2], m13 = m1[3], m14 = m1[4], m15 = m1[5], m16 = m1[6], m17 = m1[7], m18 = m1[8], m20 = m2[0], m21 = m2[1], m22 = m2[2], m23 = m2[3], m24 = m2[4], m25 = m2[5], m26 = m2[6], m27 = m2[7], m28 = m2[8];
        m2[0] = m20 * m10 + m23 * m11 + m26 * m12;
        m2[1] = m21 * m10 + m24 * m11 + m27 * m12;
        m2[2] = m22 * m10 + m25 * m11 + m28 * m12;
        m2[3] = m20 * m13 + m23 * m14 + m26 * m15;
        m2[4] = m21 * m13 + m24 * m14 + m27 * m15;
        m2[5] = m22 * m13 + m25 * m14 + m28 * m15;
        m2[6] = m20 * m16 + m23 * m17 + m26 * m18;
        m2[7] = m21 * m16 + m24 * m17 + m27 * m18;
        m2[8] = m22 * m16 + m25 * m17 + m28 * m18;
    },
    vec2_multiply(m1, m2) {
        var mOut = [];
        mOut[0] = m2[0] * m1[0] + m2[3] * m1[1] + m2[6];
        mOut[1] = m2[1] * m1[0] + m2[4] * m1[1] + m2[7];
        return mOut;
    },
    transpose(m) {
        return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
    }
}; //mat3
// Transform library from CubicVR.js
class Transform {
    constructor(mat) {
        this.m_stack = [];
        this.m_cache = [];
        this.c_stack = 0;
        this.valid = 0;
        this.result = null;
        this.translateMatrix = Transform.prototype.getIdentity();
        this.scaleMatrix = Transform.prototype.getIdentity();
        this.rotateMatrix = Transform.prototype.getIdentity();
        this.clearStack(mat);
    }
    clearStack(init_mat) {
        this.m_stack = [];
        this.m_cache = [];
        this.c_stack = 0;
        this.valid = 0;
        this.result = null;
        for (var i = 0; i < Transform.STACK_DEPTH_LIMIT; i++) {
            this.m_stack[i] = this.getIdentity();
        }
        if (init_mat !== undefined) {
            this.m_stack[0] = init_mat;
        }
        else {
            this.setIdentity();
        }
    }
    setIdentity() {
        this.m_stack[this.c_stack] = this.getIdentity();
        if (this.valid === this.c_stack && this.c_stack) {
            this.valid--;
        }
    }
    ;
    getIdentity() {
        return [1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0];
    }
    ;
    getResult() {
        if (!this.c_stack) {
            return this.m_stack[0];
        }
        let m = mat3.identity;
        if (this.valid > this.c_stack - 1) {
            this.valid = this.c_stack - 1;
        }
        for (var i = this.valid; i < this.c_stack + 1; i++) {
            m = mat3.multiply(this.m_stack[i], m);
            this.m_cache[i] = m;
        }
        this.valid = this.c_stack - 1;
        this.result = this.m_cache[this.c_stack];
        return this.result;
    }
    ;
    pushMatrix() {
        this.c_stack++;
        this.m_stack[this.c_stack] = this.getIdentity();
    }
    ;
    popMatrix() {
        if (this.c_stack === 0) {
            return;
        }
        this.c_stack--;
    }
    ;
    translate(x, y) {
        this.translateMatrix[6] = x;
        this.translateMatrix[7] = y;
        mat3.multiply(this.translateMatrix, this.m_stack[this.c_stack]);
        /*
        if (this.valid === this.c_stack && this.c_stack) {
          this.valid--;
        }
        */
    }
    ;
    scale(x, y) {
        this.scaleMatrix[0] = x;
        this.scaleMatrix[4] = y;
        mat3.multiply(this.scaleMatrix, this.m_stack[this.c_stack]);
        /*
        if (this.valid === this.c_stack && this.c_stack) {
          this.valid--;
        }
        */
    }
    ;
    rotate(ang) {
        var sAng, cAng;
        sAng = Math.sin(-ang);
        cAng = Math.cos(-ang);
        this.rotateMatrix[0] = cAng;
        this.rotateMatrix[3] = sAng;
        this.rotateMatrix[1] = -sAng;
        this.rotateMatrix[4] = cAng;
        mat3.multiply(this.rotateMatrix, this.m_stack[this.c_stack]);
        /*
        if (this.valid === this.c_stack && this.c_stack) {
          this.valid--;
        }
        */
    }
    ;
}
Transform.STACK_DEPTH_LIMIT = 16;
// Shader Pool BitMasks, i.e. sMask = (shaderMask.texture+shaderMask.stroke)
let shaderMask = {
    texture: 1,
    crop: 2,
    path: 4
};
let rectVertexPositionBuffer;
let pathVertexPositionBuffer;
// 2D Vertices and Texture UV coords
let rectVerts = new Float32Array([
    0, 0, 0, 0,
    0, 1, 0, 1,
    1, 1, 1, 1,
    1, 0, 1, 0
]);
class WebGLCanvas {
    static affect(canvas, options) {
        return (canvas === null || canvas === void 0 ? void 0 : canvas.gl2d) || new WebGLCanvas(canvas, options);
    }
    ;
    constructor(canvas, options) {
        this.gl = void 0;
        this.fs = void 0;
        this.vs = void 0;
        this.shaderProgram = void 0;
        this.transform = new Transform();
        this.shaderPool = [];
        this.maxTextureSize = void 0;
        this.canvas = canvas;
        this.options = options || {};
        this.transform = new Transform();
        // Save a reference to the WebGL2D instance on the canvas object
        // @ts-ignore
        canvas.gl2d = this;
        // Store getContext function for later use
        // @ts-ignore
        canvas.$getContext = canvas.getContext;
        // Override getContext function with "webgl-2d" enabled version
        canvas.getContext = (function (gl2d) {
            return function (context) {
                if ((gl2d.options.force || context === "webgl-2d") && !(canvas.width === 0 || canvas.height === 0)) {
                    if (gl2d.gl) {
                        return gl2d.gl;
                    }
                    let gl = gl2d.gl = gl2d.canvas.$getContext("experimental-webgl");
                    gl2d.initShaders();
                    gl2d.initBuffers();
                    // Append Canvas2D API features to the WebGL context
                    gl2d.initCanvas2DAPI();
                    gl.viewport(0, 0, gl2d.canvas.width, gl2d.canvas.height);
                    // Default white background
                    gl.clearColor(1, 1, 1, 1);
                    gl.clear(gl.COLOR_BUFFER_BIT); // | gl.DEPTH_BUFFER_BIT);
                    // Disables writing to dest-alpha
                    gl.colorMask(true, true, true, false);
                    // Depth options
                    //gl.enable(gl.DEPTH_TEST);
                    //gl.depthFunc(gl.LEQUAL);
                    // Blending options
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                    gl2d.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                    return gl;
                }
                else {
                    return gl2d.canvas.$getContext(context);
                }
            };
        }(this));
        this.postInit();
    }
    getFragmentShaderSource(sMask) {
        let fsSource = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "#define hasTexture " + ((sMask & shaderMask.texture) ? "1" : "0"),
            "#define hasCrop " + ((sMask & shaderMask.crop) ? "1" : "0"),
            "varying vec4 vColor;",
            "#if hasTexture",
            "varying vec2 vTextureCoord;",
            "uniform sampler2D uSampler;",
            "#if hasCrop",
            "uniform vec4 uCropSource;",
            "#endif",
            "#endif",
            "void main(void) {",
            "#if hasTexture",
            "#if hasCrop",
            "gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.x * uCropSource.z, vTextureCoord.y * uCropSource.w) + uCropSource.xy);",
            "#else",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "#endif",
            "#else",
            "gl_FragColor = vColor;",
            "#endif",
            "}"
        ].join("\n");
        return fsSource;
    }
    ;
    getVertexShaderSource(stackDepth, sMask) {
        let w = 2 / this.canvas.width, h = -2 / this.canvas.height;
        stackDepth = stackDepth || 1;
        let vsSource = [
            "#define hasTexture " + ((sMask & shaderMask.texture) ? "1" : "0"),
            "attribute vec4 aVertexPosition;",
            "#if hasTexture",
            "varying vec2 vTextureCoord;",
            "#endif",
            "uniform vec4 uColor;",
            "uniform mat3 uTransforms[" + stackDepth + "];",
            "varying vec4 vColor;",
            "const mat4 pMatrix = mat4(" + w + ",0,0,0, 0," + h + ",0,0, 0,0,1.0,1.0, -1.0,1.0,0,0);",
            "mat3 crunchStack(void) {",
            "mat3 result = uTransforms[0];",
            "for (int i = 1; i < " + stackDepth + "; ++i) {",
            "result = uTransforms[i] * result;",
            "}",
            "return result;",
            "}",
            "void main(void) {",
            "vec3 position = crunchStack() * vec3(aVertexPosition.x, aVertexPosition.y, 1.0);",
            "gl_Position = pMatrix * vec4(position, 1.0);",
            "vColor = uColor;",
            "#if hasTexture",
            "vTextureCoord = aVertexPosition.zw;",
            "#endif",
            "}"
        ].join("\n");
        return vsSource;
    }
    ;
    // Initialize fragment and vertex shaders
    initShaders(transformStackDepth, sMask) {
        let gl = this.gl;
        transformStackDepth = transformStackDepth || 1;
        sMask = sMask || 0;
        let storedShader = this.shaderPool[transformStackDepth];
        if (!storedShader) {
            storedShader = this.shaderPool[transformStackDepth] = [];
        }
        storedShader = storedShader[sMask];
        if (storedShader) {
            gl.useProgram(storedShader);
            this.shaderProgram = storedShader;
            return storedShader;
        }
        else {
            let fs = this.fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(this.fs, this.getFragmentShaderSource(sMask));
            gl.compileShader(this.fs);
            if (!gl.getShaderParameter(this.fs, gl.COMPILE_STATUS)) {
                throw "fragment shader error: " + gl.getShaderInfoLog(this.fs);
            }
            var vs = this.vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(this.vs, this.getVertexShaderSource(transformStackDepth, sMask));
            gl.compileShader(this.vs);
            if (!gl.getShaderParameter(this.vs, gl.COMPILE_STATUS)) {
                throw "vertex shader error: " + gl.getShaderInfoLog(this.vs);
            }
            let shaderProgram = this.shaderProgram = gl.createProgram();
            // @ts-ignore
            shaderProgram.stackDepth = transformStackDepth;
            gl.attachShader(shaderProgram, fs);
            gl.attachShader(shaderProgram, vs);
            gl.linkProgram(shaderProgram);
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                throw "Could not initialise shaders.";
            }
            gl.useProgram(shaderProgram);
            // @ts-ignore
            shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            // @ts-ignore
            gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
            // @ts-ignore
            shaderProgram.uColor = gl.getUniformLocation(shaderProgram, "uColor");
            // @ts-ignore
            shaderProgram.uSampler = gl.getUniformLocation(shaderProgram, "uSampler");
            // @ts-ignore
            shaderProgram.uCropSource = gl.getUniformLocation(shaderProgram, "uCropSource");
            // @ts-ignore
            shaderProgram.uTransforms = [];
            for (let i = 0; i < transformStackDepth; ++i) {
                // @ts-ignore
                shaderProgram.uTransforms[i] = gl.getUniformLocation(shaderProgram, "uTransforms[" + i + "]");
            } //for
            this.shaderPool[transformStackDepth][sMask] = shaderProgram;
            return shaderProgram;
        } //if
    }
    ;
    initBuffers() {
        let gl = this.gl;
        rectVertexPositionBuffer = gl.createBuffer();
        gl.createBuffer();
        pathVertexPositionBuffer = gl.createBuffer();
        gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, rectVerts, gl.STATIC_DRAW);
    }
    postInit() {
        WebGLCanvas.instances.push(this);
    }
    initCanvas2DAPI() {
        let gl2d = this, gl = this.gl;
        let ctx = gl;
        // Rendering Canvas for text fonts
        var textCanvas = document.createElement("canvas");
        textCanvas.width = gl2d.canvas.width;
        textCanvas.height = gl2d.canvas.height;
        var textCtx = textCanvas.getContext("2d");
        var reRGBAColor = /^rgb(a)?\(\s*(-?[\d]+)(%)?\s*,\s*(-?[\d]+)(%)?\s*,\s*(-?[\d]+)(%)?\s*,?\s*(-?[\d\.]+)?\s*\)$/;
        var reHSLAColor = /^hsl(a)?\(\s*(-?[\d\.]+)\s*,\s*(-?[\d\.]+)%\s*,\s*(-?[\d\.]+)%\s*,?\s*(-?[\d\.]+)?\s*\)$/;
        var reHex6Color = /^#([0-9A-Fa-f]{6})$/;
        var reHex3Color = /^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/;
        function HSLAToRGBA(h, s, l, a) {
            var r, g, b, m1, m2;
            // Clamp and Normalize values
            h = (((h % 360) + 360) % 360) / 360;
            s = s > 100 ? 1 : s / 100;
            s = s < 0 ? 0 : s;
            l = l > 100 ? 1 : l / 100;
            l = l < 0 ? 0 : l;
            m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
            m1 = l * 2 - m2;
            function getHue(value) {
                var hue;
                if (value * 6 < 1) {
                    hue = m1 + (m2 - m1) * value * 6;
                }
                else if (value * 2 < 1) {
                    hue = m2;
                }
                else if (value * 3 < 2) {
                    hue = m1 + (m2 - m1) * (2 / 3 - value) * 6;
                }
                else {
                    hue = m1;
                }
                return hue;
            }
            r = getHue(h + 1 / 3);
            g = getHue(h);
            b = getHue(h - 1 / 3);
            return [r, g, b, a];
        }
        // Converts rgb(a) color string to gl color vector
        function colorStringToVec4(value) {
            var result = [], match, channel, isPercent, hasAlpha, alphaChannel, sameType;
            if ((match = reRGBAColor.exec(value))) {
                hasAlpha = match[1], alphaChannel = parseFloat(match[8]);
                if ((hasAlpha && isNaN(alphaChannel)) || (!hasAlpha && !isNaN(alphaChannel))) {
                    return false;
                }
                sameType = match[3];
                for (var i = 2; i < 8; i += 2) {
                    channel = match[i], isPercent = match[i + 1];
                    if (isPercent !== sameType) {
                        return false;
                    }
                    // Clamp and normalize values
                    if (isPercent) {
                        channel = channel > 100 ? 1 : channel / 100;
                        channel = channel < 0 ? 0 : channel;
                    }
                    else {
                        channel = channel > 255 ? 1 : channel / 255;
                        channel = channel < 0 ? 0 : channel;
                    }
                    result.push(channel);
                }
                result.push(hasAlpha ? alphaChannel : 1.0);
            }
            else if ((match = reHSLAColor.exec(value))) {
                hasAlpha = match[1], alphaChannel = parseFloat(match[5]);
                result = HSLAToRGBA(match[2], match[3], match[4], parseFloat((hasAlpha && alphaChannel ? alphaChannel : 1.0) + ""));
            }
            else if ((match = reHex6Color.exec(value))) {
                var colorInt = parseInt(match[1], 16);
                result = [((colorInt & 0xFF0000) >> 16) / 255, ((colorInt & 0x00FF00) >> 8) / 255, (colorInt & 0x0000FF) / 255, 1.0];
            }
            else if ((match = reHex3Color.exec(value))) {
                var hexString = "#" + [match[1], match[1], match[2], match[2], match[3], match[3]].join("");
                result = colorStringToVec4(hexString);
            }
            else if (value.toLowerCase() in colorKeywords) {
                result = colorStringToVec4(colorKeywords[value.toLowerCase()]);
            }
            else if (value.toLowerCase() === "transparent") {
                result = [0, 0, 0, 0];
            }
            else {
                // Color keywords not yet implemented, ie "orange", return hot pink
                return false;
            }
            return result;
        }
        function colorVecToString(vec4) {
            return "rgba(" + (vec4[0] * 255) + ", " + (vec4[1] * 255) + ", " + (vec4[2] * 255) + ", " + parseFloat(vec4[3] + "") + ")";
        }
        // Maintain drawing state params during gl.save and gl.restore. see saveDrawState() and restoreDrawState()
        var drawState = {}, drawStateStack = [];
        function saveDrawState() {
            var bakedDrawState = {
                fillStyle: [drawState.fillStyle[0], drawState.fillStyle[1], drawState.fillStyle[2], drawState.fillStyle[3]],
                strokeStyle: [drawState.strokeStyle[0], drawState.strokeStyle[1], drawState.strokeStyle[2], drawState.strokeStyle[3]],
                globalAlpha: drawState.globalAlpha,
                globalCompositeOperation: drawState.globalCompositeOperation,
                lineCap: drawState.lineCap,
                lineJoin: drawState.lineJoin,
                lineWidth: drawState.lineWidth,
                miterLimit: drawState.miterLimit,
                shadowColor: drawState.shadowColor,
                shadowBlur: drawState.shadowBlur,
                shadowOffsetX: drawState.shadowOffsetX,
                shadowOffsetY: drawState.shadowOffsetY,
                textAlign: drawState.textAlign,
                font: drawState.font,
                textBaseline: drawState.textBaseline
            };
            drawStateStack.push(bakedDrawState);
        }
        function restoreDrawState() {
            if (drawStateStack.length) {
                drawState = drawStateStack.pop();
            }
        }
        // WebGL requires colors as a vector while Canvas2D sets colors as an rgba string
        // These getters and setters store the original rgba string as well as convert to a vector
        drawState.fillStyle = [0, 0, 0, 1]; // default black
        Object.defineProperty(gl, "fillStyle", {
            get: function () { return colorVecToString(drawState.fillStyle); },
            set: function (value) {
                drawState.fillStyle = colorStringToVec4(value) || drawState.fillStyle;
            }
        });
        drawState.strokeStyle = [0, 0, 0, 1]; // default black
        Object.defineProperty(gl, "strokeStyle", {
            get: function () { return colorVecToString(drawState.strokeStyle); },
            set: function (value) {
                drawState.strokeStyle = colorStringToVec4(value) || drawState.strokeStyle;
            }
        });
        // WebGL already has a lineWidth() function but Canvas2D requires a lineWidth property
        // Store the original lineWidth() function for later use
        // @ts-ignore
        gl.$lineWidth = gl.lineWidth;
        drawState.lineWidth = 1.0;
        Object.defineProperty(gl, "lineWidth", {
            get: function () { return drawState.lineWidth; },
            set: function (value) {
                // @ts-ignore
                gl.$lineWidth(value);
                drawState.lineWidth = value;
            }
        });
        // Currently unsupported attributes and their default values
        drawState.lineCap = "butt";
        Object.defineProperty(gl, "lineCap", {
            get: function () { return drawState.lineCap; },
            set: function (value) {
                drawState.lineCap = value;
            }
        });
        drawState.lineJoin = "miter";
        Object.defineProperty(gl, "lineJoin", {
            get: function () { return drawState.lineJoin; },
            set: function (value) {
                drawState.lineJoin = value;
            }
        });
        drawState.miterLimit = 10;
        Object.defineProperty(gl, "miterLimit", {
            get: function () { return drawState.miterLimit; },
            set: function (value) {
                drawState.miterLimit = value;
            }
        });
        drawState.shadowOffsetX = 0;
        Object.defineProperty(gl, "shadowOffsetX", {
            get: function () { return drawState.shadowOffsetX; },
            set: function (value) {
                drawState.shadowOffsetX = value;
            }
        });
        drawState.shadowOffsetY = 0;
        Object.defineProperty(gl, "shadowOffsetY", {
            get: function () { return drawState.shadowOffsetY; },
            set: function (value) {
                drawState.shadowOffsetY = value;
            }
        });
        drawState.shadowBlur = 0;
        Object.defineProperty(gl, "shadowBlur", {
            get: function () { return drawState.shadowBlur; },
            set: function (value) {
                drawState.shadowBlur = value;
            }
        });
        drawState.shadowColor = "rgba(0, 0, 0, 0.0)";
        Object.defineProperty(gl, "shadowColor", {
            get: function () { return drawState.shadowColor; },
            set: function (value) {
                drawState.shadowColor = value;
            }
        });
        drawState.font = "10px sans-serif";
        Object.defineProperty(gl, "font", {
            get: function () { return drawState.font; },
            set: function (value) {
                // @ts-ignore
                textCtx.font = value;
                drawState.font = value;
            }
        });
        drawState.textAlign = "start";
        Object.defineProperty(gl, "textAlign", {
            get: function () { return drawState.textAlign; },
            set: function (value) {
                drawState.textAlign = value;
            }
        });
        drawState.textBaseline = "alphabetic";
        Object.defineProperty(gl, "textBaseline", {
            get: function () { return drawState.textBaseline; },
            set: function (value) {
                drawState.textBaseline = value;
            }
        });
        // This attribute will need to control global alpha of objects drawn.
        drawState.globalAlpha = 1.0;
        Object.defineProperty(gl, "globalAlpha", {
            get: function () { return drawState.globalAlpha; },
            set: function (value) {
                drawState.globalAlpha = value;
            }
        });
        // This attribute will need to set the gl.blendFunc mode
        drawState.globalCompositeOperation = "source-over";
        Object.defineProperty(gl, "globalCompositeOperation", {
            get: function () { return drawState.globalCompositeOperation; },
            set: function (value) {
                drawState.globalCompositeOperation = value;
            }
        });
        // Need a solution for drawing text that isnt stupid slow
        ctx.fillText = function fillText(text, x, y) {
            /*
            textCtx.clearRect(0, 0, gl2d.canvas.width, gl2d.canvas.height);
            textCtx.fillStyle = gl.fillStyle;
            textCtx.fillText(text, x, y);
      
            gl.drawImage(textCanvas, 0, 0);
            */
        };
        ctx.strokeText = function strokeText() { };
        ctx.measureText = function measureText(value) { return new TextMetrics(); };
        let tempCanvas = document.createElement("canvas");
        let tempCtx = tempCanvas.getContext("2d");
        ctx.save = function save() {
            gl2d.transform.pushMatrix();
            saveDrawState();
        };
        ctx.restore = function restore() {
            gl2d.transform.popMatrix();
            restoreDrawState();
        };
        ctx.translate = function translate(x, y) {
            gl2d.transform.translate(x, y);
        };
        ctx.rotate = function rotate(a) {
            gl2d.transform.rotate(a);
        };
        ctx.scale = function scale(x, y) {
            gl2d.transform.scale(x, y);
        };
        // @ts-ignore
        ctx.createImageData = function createImageData(width, height) {
            return tempCtx.createImageData(width, height);
        };
        ctx.getImageData = function getImageData(x, y, width, height) {
            var data = tempCtx.createImageData(width, height);
            var buffer = new Uint8Array(width * height * 4);
            gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
            var w = width * 4, h = height;
            for (var i = 0, maxI = h / 2; i < maxI; ++i) {
                for (var j = 0, maxJ = w; j < maxJ; ++j) {
                    var index1 = i * w + j;
                    var index2 = (h - i - 1) * w + j;
                    data.data[index1] = buffer[index2];
                    data.data[index2] = buffer[index1];
                } //for
            } //for
            return data;
        };
        ctx.putImageData = function putImageData(imageData, x, y) {
            ctx.drawImage(imageData, x, y);
        };
        ctx.transform = function transform(m11, m12, m21, m22, dx, dy) {
            var m = gl2d.transform.m_stack[gl2d.transform.c_stack];
            m[0] *= m11;
            m[1] *= m21;
            m[2] *= dx;
            m[3] *= m12;
            m[4] *= m22;
            m[5] *= dy;
            m[6] = 0;
            m[7] = 0;
        };
        function sendTransformStack(sp) {
            let stack = gl2d.transform.m_stack;
            for (let i = 0, maxI = gl2d.transform.c_stack + 1; i < maxI; ++i) {
                gl.uniformMatrix3fv(sp.uTransforms[i], false, stack[maxI - 1 - i]);
            } //for
        }
        // @ts-ignore
        ctx.setTransform = function setTransform(m11, m12, m21, m22, dx, dy) {
            gl2d.transform.setIdentity();
            // @ts-ignore
            gl.transform.apply(this, arguments);
            return;
        };
        ctx.fillRect = function fillRect(x, y, width, height) {
            var transform = gl2d.transform;
            var shaderProgram = gl2d.initShaders(transform.c_stack + 2, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);
            transform.pushMatrix();
            transform.translate(x, y);
            transform.scale(width, height);
            sendTransformStack(shaderProgram);
            gl.uniform4f(shaderProgram.uColor, drawState.fillStyle[0], drawState.fillStyle[1], drawState.fillStyle[2], drawState.fillStyle[3]);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
            transform.popMatrix();
        };
        // @ts-ignore
        ctx.strokeRect = function strokeRect(x, y, width, height) {
            var transform = gl2d.transform;
            var shaderProgram = gl2d.initShaders(transform.c_stack + 2, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);
            transform.pushMatrix();
            transform.translate(x, y);
            transform.scale(width, height);
            sendTransformStack(shaderProgram);
            gl.uniform4f(shaderProgram.uColor, drawState.strokeStyle[0], drawState.strokeStyle[1], drawState.strokeStyle[2], drawState.strokeStyle[3]);
            gl.drawArrays(gl.LINE_LOOP, 0, 4);
            transform.popMatrix();
        };
        // @ts-ignore
        ctx.clearRect = function clearRect(x, y, width, height) { };
        var subPaths = [];
        class SubPath {
            constructor(x, y) {
                this.closed = false;
                this.verts = [x, y, 0, 0];
            }
        }
        // Empty the list of subpaths so that the context once again has zero subpaths
        ctx.beginPath = function beginPath() {
            subPaths.length = 0;
        };
        // Mark last subpath as closed and create a new subpath with the same starting point as the previous subpath
        ctx.closePath = function closePath() {
            if (subPaths.length) {
                // Mark last subpath closed.
                var prevPath = subPaths[subPaths.length - 1], startX = prevPath.verts[0], startY = prevPath.verts[1];
                prevPath.closed = true;
                // Create new subpath using the starting position of previous subpath
                var newPath = new SubPath(startX, startY);
                subPaths.push(newPath);
            }
        };
        // Create a new subpath with the specified point as its first (and only) point
        ctx.moveTo = function moveTo(x, y) {
            subPaths.push(new SubPath(x, y));
        };
        ctx.lineTo = function lineTo(x, y) {
            if (subPaths.length) {
                subPaths[subPaths.length - 1].verts.push(x, y, 0, 0);
            }
            else {
                // Create a new subpath if none currently exist
                // @ts-ignore
                gl.moveTo(x, y);
            }
        };
        ctx.quadraticCurveTo = function quadraticCurveTo(cp1x, cp1y, x, y) { };
        ctx.bezierCurveTo = function bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) { };
        ctx.arcTo = function arcTo() { };
        // Adds a closed rect subpath and creates a new subpath
        ctx.rect = function rect(x, y, w, h) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x, y + h);
            ctx.closePath();
        };
        ctx.arc = function arc(x, y, radius, startAngle, endAngle, anticlockwise) { };
        function fillSubPath(index) {
            var transform = gl2d.transform;
            var shaderProgram = gl2d.initShaders(transform.c_stack + 2, 0);
            var subPath = subPaths[index];
            var verts = subPath.verts;
            gl.bindBuffer(gl.ARRAY_BUFFER, pathVertexPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);
            transform.pushMatrix();
            sendTransformStack(shaderProgram);
            gl.uniform4f(shaderProgram.uColor, drawState.fillStyle[0], drawState.fillStyle[1], drawState.fillStyle[2], drawState.fillStyle[3]);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, verts.length / 4);
            transform.popMatrix();
        }
        ctx.fill = function fill() {
            for (var i = 0; i < subPaths.length; i++) {
                fillSubPath(i);
            }
        };
        function strokeSubPath(index) {
            var transform = gl2d.transform;
            var shaderProgram = gl2d.initShaders(transform.c_stack + 2, 0);
            var subPath = subPaths[index];
            var verts = subPath.verts;
            gl.bindBuffer(gl.ARRAY_BUFFER, pathVertexPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);
            transform.pushMatrix();
            sendTransformStack(shaderProgram);
            gl.uniform4f(shaderProgram.uColor, drawState.strokeStyle[0], drawState.strokeStyle[1], drawState.strokeStyle[2], drawState.strokeStyle[3]);
            if (subPath.closed) {
                gl.drawArrays(gl.LINE_LOOP, 0, verts.length / 4);
            }
            else {
                gl.drawArrays(gl.LINE_STRIP, 0, verts.length / 4);
            }
            transform.popMatrix();
        }
        ctx.stroke = function stroke() {
            for (var i = 0; i < subPaths.length; i++) {
                strokeSubPath(i);
            }
        };
        ctx.clip = function clip() { };
        // @ts-ignore
        ctx.isPointInPath = function isPointInPath() { };
        // @ts-ignore
        ctx.drawFocusRing = function drawFocusRing() { };
        var imageCache = [], textureCache = [];
        class Texture {
            constructor(image) {
                this.obj = gl.createTexture();
                this.index = textureCache.push(this);
                imageCache.push(image);
                // we may wish to consider tiling large images like this instead of scaling and
                // adjust appropriately (flip to next texture source and tile offset) when drawing
                if (image.width > gl2d.maxTextureSize || image.height > gl2d.maxTextureSize) {
                    var canvas = document.createElement("canvas");
                    canvas.width = (image.width > gl2d.maxTextureSize) ? gl2d.maxTextureSize : image.width;
                    canvas.height = (image.height > gl2d.maxTextureSize) ? gl2d.maxTextureSize : image.height;
                    let ctx = canvas.getContext("2d");
                    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
                    image = canvas;
                }
                gl.bindTexture(gl.TEXTURE_2D, this.obj);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                // Enable Mip mapping on power-of-2 textures
                if (isPOT(image.width) && isPOT(image.height)) {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                    gl.generateMipmap(gl.TEXTURE_2D);
                }
                else {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                }
                // Unbind texture
                gl.bindTexture(gl.TEXTURE_2D, null);
            }
        }
        ctx.drawImage = function drawImage(image, a, b, c, d, e, f, g, h) {
            if (image.getContext2D == null && IsImageOk(image) != true)
                return;
            var transform = gl2d.transform;
            transform.pushMatrix();
            var sMask = shaderMask.texture;
            var doCrop = false;
            //drawImage(image, dx, dy)
            if (arguments.length === 3) {
                transform.translate(a !== null && a !== void 0 ? a : 0, b !== null && b !== void 0 ? b : 0);
                transform.scale(image.width, image.height);
            }
            //drawImage(image, dx, dy, dw, dh)
            else if (arguments.length === 5) {
                transform.translate(a !== null && a !== void 0 ? a : 0, b !== null && b !== void 0 ? b : 0);
                transform.scale(c !== null && c !== void 0 ? c : 0, d !== null && d !== void 0 ? d : 0);
            }
            //drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
            else if (arguments.length === 9) {
                transform.translate(e !== null && e !== void 0 ? e : 0, f !== null && f !== void 0 ? f : 0);
                transform.scale(g !== null && g !== void 0 ? g : 0, h !== null && h !== void 0 ? h : 0);
                sMask = sMask | shaderMask.crop;
                doCrop = true;
            }
            var shaderProgram = gl2d.initShaders(transform.c_stack, sMask);
            var texture, cacheIndex = imageCache.indexOf(image);
            if (cacheIndex !== -1) {
                texture = textureCache[cacheIndex];
            }
            else {
                texture = new Texture(image);
            }
            if (doCrop) {
                gl.uniform4f(shaderProgram.uCropSource, (a !== null && a !== void 0 ? a : 0) / image.width, (b !== null && b !== void 0 ? b : 0) / image.height, (c !== null && c !== void 0 ? c : 0) / image.width, (d !== null && d !== void 0 ? d : 0) / image.height);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);
            gl.bindTexture(gl.TEXTURE_2D, texture.obj);
            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(shaderProgram.uSampler, 0);
            sendTransformStack(shaderProgram);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
            transform.popMatrix();
        };
    }
}
WebGLCanvas.instances = [];

class BrushCanvas {
    constructor(settings = {}) {
        this.resolution = 1;
        this.smoothing = true;
        this.ctx = undefined;
        this.events = new Emitter$1();
        this.experimental = false;
        /**
         * Toggles smoothing
         * ON - blurred when using low resolution assets and smooth on high resolution
         * OFF - Crisp on low resolution assets and jagged on high resolution
         */
        this.setSmoothing = (state) => {
            if (this.experimental)
                return this;
            this.ctx.imageSmoothingEnabled =
                this.smoothing = (state == true);
            return this;
        };
        if (typeof settings != "object")
            settings = {};
        const { dimensions = [100, 100], inputCanvas: canvas = document.createElement("canvas"), } = settings;
        canvas.width = dimensions[0];
        canvas.height = dimensions[1];
        this.canvas = canvas;
        if ((settings === null || settings === void 0 ? void 0 : settings.experimental_gl) == true) {
            this.experimental = true;
            WebGLCanvas.affect(canvas);
            const ctx = this.canvas.getContext("webgl-2d");
            this.ctx = ctx;
        }
        const ctx = this.canvas.getContext("2d");
        this.ctx = ctx;
        if (Array.isArray(dimensions))
            this.updateSize(...dimensions);
    }
    updateResolution(resolution) {
        // const amount = ForceType.Number(resolution);
        // this.resolution = clamp(amount, { min: .5, max: 1 });
    }
    updateSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.events.emit("resize", width, height);
        this.setSmoothing(this.smoothing);
    }
    center() { return { x: this.width / 2, y: this.height / 2 }; }
    dimensions() { return { width: this.width, height: this.height }; }
    /**
     * Makes brush the active dom element
     */
    focus() {
        if (this.canvas)
            this.canvas.focus();
    }
    get width() { return this.canvas.width; }
    ;
    get height() { return this.canvas.height; }
    ;
    /**
     * @deprecated
     */
    forceDimensions({ width, height }) {
        if (typeof width == "number" &&
            this.canvas.width != width)
            this.canvas.width = width;
        if (typeof height == "number" &&
            this.canvas.height != height)
            this.canvas.height = height;
    }
    ;
    image(image, from, to) {
        CanvasRender.Image(this.ctx, image, from, to);
        return this;
    }
    text(values) {
        if (this.ctx instanceof CanvasRenderingContext2D != true)
            return;
        let { text, color, x = 0, y = 0, font, weight, size } = values;
        x |= 0;
        y |= 0;
        this.chainable
            .generatedFont({
            font,
            weight,
            size
        })
            .color(color)
            .pos(x, y)
            .text(text);
    }
    shape(values) {
        if (this.ctx instanceof CanvasRenderingContext2D != true)
            return;
        let { color = "pink", x = 0, y = 0, w = 0, h = 0 } = values;
        x |= 0;
        y |= 0;
        w |= 0;
        h |= 0;
        this.chainable
            .color(color)
            .size(w, h)
            .pos(x, y)
            .rect;
    }
    circle(values) {
        CanvasRender.circle(this.ctx, values);
    }
    gradient({ shape = "square", percent: { w: percentW = 0, h: percentH = 0 } = {}, colorStart = "black", colorEnd = "white", x = 0, y = 0, w = 0, h = 0, radius = .5 } = {}) {
        if (this.ctx instanceof CanvasRenderingContext2D != true)
            return;
        const { ctx } = this;
        const [gx, gy] = [(x + w * percentW), (y + h * percentH)];
        let gradient;
        if (shape == "radial")
            gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * radius);
        else
            gradient = ctx.createLinearGradient(gx, gy, x + w, y + h);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);
    }
    getTextWidth(values) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx)
            ctx.font = "";
        if (typeof values.font === "string" ||
            typeof values.size === "number") {
            this.text({
                color: "white",
                font: values.font || "Tahoma",
                size: values.size || 20,
                text: "",
                x: -10000,
                y: -10000
            });
        }
        return this.ctx.measureText(values.text).width;
    }
    ;
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        return this;
    }
    clearRect(x, y, width, height) {
        this.ctx.clearRect(x, y, width, height);
        return this;
    }
    resizable() {
        const resize = () => {
            const { canvas, setSmoothing } = this;
            const { documentElement: dE } = document;
            if (canvas instanceof HTMLCanvasElement &&
                document.body.contains(canvas)) {
                canvas.style.width = `${100 * this.resolution}%`;
                canvas.style.height = `${100 * this.resolution}%`;
            }
            canvas.width = dE.clientWidth * this.resolution;
            canvas.height = dE.clientHeight * this.resolution;
            setSmoothing(false);
            this.events.emit("resize", canvas.width, canvas.height);
        };
        if ("addEventListener" in window)
            window.addEventListener("resize", resize);
        resize();
        return this;
    }
    get get() { return this; }
    get chainable() { return new ChainableCanvas(this); }
}

// Define a mapping of word colors to their corresponding RGB values
class $A {
}
$A.Full = 255;
$A.Half = 128;
$A.None = 0;
const wordsToRgb = {
    red: [$A.Full, $A.None, $A.None],
    orange: [$A.Full, $A.Half, $A.None],
    yellow: [$A.Full, $A.Full, $A.None],
    lime: [$A.Half, $A.Full, $A.None],
    green: [$A.None, $A.Full, $A.None],
    aqua: [$A.None, $A.Full, $A.Half],
    cyan: [$A.None, $A.Full, $A.Full],
    azure: [$A.None, $A.Half, $A.Full],
    blue: [$A.None, $A.None, $A.Full],
    purple: [$A.Half, $A.None, $A.Full],
    violet: [$A.Full, $A.None, $A.Full],
    rose: [$A.Full, $A.None, $A.Half],
    black: [$A.None, $A.None, $A.None],
    gray: [$A.Half, $A.Half, $A.Half],
    white: [$A.Full, $A.Full, $A.Full],
    brown: [165, 42, 42]
    // Add more colors as needed
};
/** Checks if an input is a valid wordColor */
function isWordColor(input) {
    return wordsToRgb.hasOwnProperty(input);
}
/**
 * Checks if all items in an array match
 * Faster yet slightly different version of badlyColorImage
 */
function convertWordColorToRGB(input) {
    /* Convert the word color to lowercase for case-insensitive matching */
    const wordColor = (input + '').toLowerCase();
    /* Check if the word color exists in the color map */
    if (wordsToRgb.hasOwnProperty(wordColor))
        return wordsToRgb[wordColor];
    return [0, 0, 0];
}
/**
 * Tests with regex whether a string fits a hex code with hashtag
 */
function isHexadecimal(hexcode) {
    // Regular expression to match hexadecimal color patterns: # followed by 3 or 6 hexadecimal digits
    // Check if the input matches the hexadecimal pattern
    return /^#([0-9a-fA-F]{3}){1,2}$/.test(hexcode);
}
/**
 * Returns an rgb array based off a hex code string with hashtag
 */
function convertHexToRGB(hexColor) {
    // Remove the "#" symbol if present
    const hex = hexColor.replace('#', '');
    // Split the hexadecimal color code into red, green, and blue components
    const red = parseInt(hex.substring(0, 2), 16);
    const green = parseInt(hex.substring(2, 4), 16);
    const blue = parseInt(hex.substring(4, 6), 16);
    return [red, green, blue];
}
const rgbStringRegex = /^rgb\(\s*((1?[0-9]{1,2}|2([0-4][0-9]|5[0-5])),\s*){2}(1?[0-9]{1,2}|2([0-4][0-9]|5[0-5]))\s*\)$/;
/** Checks if a string is a css RGB code ('rgb(255, 255, 255)') */
function isRGB(rgbString) {
    // Regular expression to match RGB color patterns: rgb(x, y, z) where x, y, and z are integers between 0 and 255
    // Check if the input matches the RGB pattern
    return rgbStringRegex.test(rgbString);
}
/** Checks if a string is a css RGB code ('rgb(255, 255, 255)') */
function getRGBValues(input) {
    /**
     * Check if the input matches the RGB pattern
     * Extract the RGB values from the input, then return the RGB values as an array
     */
    if (isRGB(input) != true) {
        const matched = input.match(/\d+/g);
        if (Array.isArray(matched) && matched.length === 3)
            return matched.map(Number);
    }
    /* Return [0, 0, 0] for non-RGB colors */
    return [0, 0, 0];
}
/** Attempts to return an array of rgb color values */
function tryRgb(input) {
    if (Array.isArray(input) && input.length === 3) {
        const [r = 0, g = 0, b = 0] = input;
        return [r, g, b];
    }
    if (typeof input === 'string') {
        if (isHexadecimal(input))
            return convertHexToRGB(input);
        if (isWordColor(input))
            return convertWordColorToRGB(input);
        if (typeof input === 'string' &&
            isRGB(input))
            return getRGBValues(input);
    }
    return null;
}
/** Always returns an array of rgb color values */
function forceRgb(input) {
    var _a;
    return (_a = tryRgb(input)) !== null && _a !== void 0 ? _a : [0, 0, 0];
}
/** Converts RGB values to a Hue */
function rgbToHue(red, green, blue) {
    red /= 255;
    green /= 255;
    blue /= 255;
    let max = Math.max(red, green, blue);
    let min = Math.min(red, green, blue);
    let c = max - min;
    let hue = 0;
    let segment, shift;
    if (c == 0) {
        hue = 0;
    }
    else {
        switch (max) {
            case red:
                segment = (green - blue) / c;
                shift = 0 / 60; // R° / (360° / hex sides)
                if (segment < 0) { // hue > 180, full rotation
                    shift = 360 / 60; // R° / (360° / hex sides)
                }
                hue = segment + shift;
                break;
            case green:
                segment = (blue - red) / c;
                shift = 120 / 60; // G° / (360° / hex sides)
                hue = segment + shift;
                break;
            case blue:
                segment = (red - green) / c;
                shift = 240 / 60; // B° / (360° / hex sides)
                hue = segment + shift;
                break;
        }
    }
    return hue * 60; // hue is in [0,6], scale it up
}

const colorableCanvas = new BrushCanvas({
    inputCanvas: document.createElement("canvas")
});
const colorChain = colorableCanvas.chainable;
/**
 * Draws an overlay tint to canvas
 * Faster yet slightly different version of badlyColorImage
 */
function rgbTintImage(sprite, [red = 0, green = 0, blue = 0, tint = .2]) {
    const image = new Image();
    colorChain
        .canvasSize(sprite.width, sprite.height)
        .size(sprite.width, sprite.height)
        .clear
        .pos(0, 0)
        .image(sprite)
        .opacity(tint)
        .rendering("source-atop")
        .color(`rgb(${[red, green, blue].join(",")})`)
        .rect.rendering("source-over");
    if (colorChain.last_config.canvas instanceof HTMLCanvasElement) {
        image.src = colorChain.last_config.canvas.toDataURL("image/png");
    }
    return sprite;
}
/**
 * Old default is 100
 */
function lightenOverlay(chain, light) {
    if (typeof light != "number")
        return;
    chain
        .rendering(light < 100 ? "color-burn" : "color-dodge");
    // Modify future light after color-effect
    light = light >= 100 ? light - 100 : 100 - (100 - light);
    // light
    chain
        .color(`hsl(0, 50%, ${light}%)`)
        .rect;
}
/**
 * Saturates the image
 * Old default is 100
 */
function saturateOverlay(chain, saturation) {
    if (typeof saturation != "number")
        return;
    chain
        .rendering("saturation")
        .color(`hsl(0,${saturation}%, 50%)`)
        .rect;
}
/**
 * Quickly Sets canvas size and draws sprite once
 */
function plainDraw(chain, sprite) {
    chain
        .canvasSize(sprite.width, sprite.height)
        .size(sprite.width, sprite.height)
        .clear
        .pos(0, 0)
        .rendering("source-over")
        .image(sprite);
}
/**
 * Tints overlay with Hue
 */
function hueOverlay(chain, hue) {
    if (typeof hue != "number")
        return;
    chain
        .rendering("hue")
        .color(`hsl(${hue},10%, 50%)`)
        .rect;
}
/**
 * Used to clip over the same image and remove excess pixels quickly
 */
function clipEditFrom(chain, sprite) {
    chain
        .rendering("destination-in")
        .image(sprite)
        .rendering("source-over");
}
/**
 * Checks if all items in an array match
 * Best image color manipulation method
 */
function hslTintImage(sprite, options) {
    plainDraw(colorChain, sprite);
    if (typeof (options === null || options === void 0 ? void 0 : options.light) === "number")
        lightenOverlay(colorChain, options.light);
    if (typeof (options === null || options === void 0 ? void 0 : options.saturation) === "number")
        saturateOverlay(colorChain, options.saturation);
    if ((options === null || options === void 0 ? void 0 : options.rgb) != null)
        hueOverlay(colorChain, rgbToHue(...forceRgb(options.rgb)));
    else if ((options === null || options === void 0 ? void 0 : options.tint) != null)
        hueOverlay(colorChain, rgbToHue(...forceRgb(options.tint)));
    else if (typeof (options === null || options === void 0 ? void 0 : options.hue) === "number")
        hueOverlay(colorChain, options.hue);
    // Clipping
    clipEditFrom(colorChain, sprite);
    const image = new Image();
    if (colorChain.last_config.canvas instanceof HTMLCanvasElement) {
        image.src = colorChain.canvas.toDataURL("image/png");
    }
    return image;
}

var colorImage = /*#__PURE__*/Object.freeze({
    __proto__: null,
    hslTintImage: hslTintImage,
    hueOverlay: hueOverlay,
    lightenOverlay: lightenOverlay,
    plainDraw: plainDraw,
    rgbTintImage: rgbTintImage,
    saturateOverlay: saturateOverlay
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

function isTouchEvent(input) {
    const __TouchEvent = typeof TouchEvent != "undefined" ? TouchEvent : window.TouchEvent;
    if (!__TouchEvent) {
        return false;
    }
    else {
        return typeof input === "object" && input instanceof __TouchEvent;
    }
}
function isTouch(input) {
    const __Touch = typeof Touch != "undefined" ? Touch : window.Touch;
    if (!__Touch) {
        return false;
    }
    else {
        return typeof input === "object" && input instanceof __Touch;
    }
}
const cursorActionDict = {
    0: "Left",
    1: "Middle",
    2: "Right",
    3: "Back",
    4: "Forward",
    10: "Touch",
};
const reverseCursorActionDict = Object.fromEntries(Object.entries(cursorActionDict).map((e) => [e[1], Number(e[0])]));
class Cursor {
    static buttonToAction(value) {
        return cursorActionDict[value];
    }
    static actionToButtonID(value) {
        return reverseCursorActionDict[value];
    }
    // private _mobile_mode?: 0 | 2;
    constructor(object = document.body) {
        this.events = new Emitter$1();
        this.position = { x: 0, y: 0 };
        this.start = { x: 0, y: 0 };
        this.end = { x: 0, y: 0 };
        this.buttons = new Set();
        this.mouse_down = false;
        this.touching = false;
        this.start_time = 0;
        this.bound_events = new Set();
        this.on = {
            click: (e) => e.preventDefault(),
            contextmenu: (e) => e.preventDefault(),
            mousemove: (e) => e instanceof MouseEvent &&
                this.events.emit("move", e.clientX, e.clientY),
            touchmove: (e) => isTouchEvent(e) &&
                this.events.emit("move", e.touches[0].clientX, e.touches[0].clientY),
            mouseup: (e) => this.events.emit("end", e),
            touchend: (e) => (e.preventDefault(),
                isTouchEvent(e) && this.events.emit("end", e.changedTouches[0])),
            mousedown: (e) => this.events.emit("start", e),
            touchstart: (e) => isTouchEvent(e) && this.events.emit("start", e.touches[0]),
        };
        this.object = object;
        this.init();
    }
    reconnect(object) {
        this.object = object;
        this.init();
    }
    hasButton(which) {
        return this.buttons.has(reverseCursorActionDict[which]);
    }
    init() {
        this.dispose();
        for (const [method, func] of Object.entries(this.on)) {
            const fn = func.bind(this);
            this.bound_events.add([method, fn]);
            this.object.addEventListener(method, fn);
        }
        this.events
            .on("move", (x, y) => this.setPosition(x, y))
            .on("start", (e) => this.onStart(e))
            .on("end", (e) => this.onEnd(e));
    }
    dispose() {
        this.events.all.clear();
        for (const bound_event of this.bound_events) {
            this.object.removeEventListener(bound_event[0], bound_event[1]);
            this.bound_events.delete(bound_event);
        }
    }
    setPosition(x, y) {
        this.position = this.getPosition(x, y);
    }
    getPosition(x, y) {
        const { object } = this;
        const b = object.getBoundingClientRect();
        return {
            x: Math.floor(((x - b.left) / (b.right - b.left)) * b.width),
            y: Math.floor(((y - b.top) / (b.bottom - b.top)) * b.height),
        };
    }
    onStart(event) {
        this.start_time = performance.now();
        if (isTouch(event)) {
            this.events.emit("button-down", "Touch", event, this);
            this.buttons.add(10);
            // setTimeout(() => {
            // 	if (this.down == true && this._mobile_mode == 0) {
            // 		this.events.emit("context", event, this);
            // 		this.events.emit("button-down", "Right", event, this);
            // 		this.buttons.add(this._mobile_mode = 2);
            // 	}
            // 	else {
            // 		this.events.emit("click", event, this);
            // 		this.events.emit("button-down", "Left", event, this);
            // 		this.buttons.add(this._mobile_mode = 0);
            // 	}
            // }, holdTime);
        }
        else {
            this.events.emit("button-down", Cursor.buttonToAction(event.button), event, this);
            this.buttons.add(event.button);
            // switch (event.button) {
            // 	case 0: this.events.emit("click", event, this); break;
            // 	case 1: this.events.emit("middle", event, this); break;
            // 	case 2: this.events.emit("context", event, this); break;
            // }
        }
        this.position = this.getPosition(event.clientX, event.clientY);
        this.start = this.getPosition(event.clientX, event.clientY);
        this.mouse_down = true;
        this.events.emit("touch", event, this);
    }
    onEnd(event) {
        if (isTouch(event)) {
            this.events.emit("button-up", "Touch", event, this);
            this.buttons.delete(10);
            // if (this._mobile_mode != undefined)
            // 	this.buttons.delete(this._mobile_mode);
            // delete this._mobile_mode;
            // 	case 0: this.events.emit("click-release", event, this); break;
            // 	case 1: this.events.emit("middle-release", event, this); break;
            // 	case 2: this.events.emit("context-release", event, this); break;
            // }
        }
        else {
            this.events.emit("button-up", Cursor.buttonToAction(event.button), event, this);
            this.buttons.delete(event.button);
        }
        this.end = this.getPosition(event.clientX, event.clientY);
        this.mouse_down = false;
        this.events.emit("release", event, this);
    }
}
Cursor.actionDict = cursorActionDict;
Cursor.reverseActionDict = reverseCursorActionDict;

class Emitter {
    constructor(all) {
        this.all = new Map();
        if (all instanceof Map) {
            this.all = all;
        }
        else if (Array.isArray(all)) {
            this.all = new Map(all);
        }
    }
    /** Adds a listener */
    on(event, callback) {
        const handlers = this.all.get(event);
        if (handlers) {
            handlers.push(callback);
        }
        else {
            this.all.set(event, [callback]);
        }
        return this;
    }
    /** Disables a listener */
    off(event, callback) {
        const handlers = this.all.get(event);
        if (handlers) {
            if (callback) {
                const index = handlers.indexOf(callback);
                if (index !== -1) {
                    handlers.splice(index, 1);
                }
            }
            else {
                this.all.set(event, []);
            }
        }
        return this;
    }
    /** Notifies all active listeners */
    emit(event, ...args) {
        let handlers = this.all.get(event);
        if (handlers) {
            for (const handler of handlers.slice()) {
                handler(...args);
            }
        }
        if ((handlers = this.all.get("*"))) {
            for (const handler of handlers.slice()) {
                handler(event, ...args);
            }
        }
        return this;
    }
    once(event, callback) {
        const once_callback = (...args) => {
            this.off(event, once_callback);
            callback(...args);
            return void 0;
        };
        this.on(event, once_callback);
        return this;
    }
    *[Symbol.iterator]() {
        for (const entry of this.all.entries()) {
            yield entry;
        }
    }
}

class ObserverTracking {
    static inDom(element) {
        return this.tracked_in_dom.get(element) == true;
    }
    static handle(element) {
        var _a, _b;
        if (document.body.contains(element)) {
            if (this.inDom(element) != true) {
                (_a = ProxyNode.getEvents(element)) === null || _a === void 0 ? void 0 : _a.emit("append");
            }
            this.tracked_in_dom.set(element, true);
        }
        else if (this.inDom(element)) {
            this.tracked_in_dom.set(element, false);
            (_b = ProxyNode.getEvents(element)) === null || _b === void 0 ? void 0 : _b.emit("remove");
        }
    }
    constructor() {
        this.list = new Set();
        this.observer = new MutationObserver(() => {
            for (const element of this.list) {
                ObserverTracking.handle(element);
            }
        });
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
}
ObserverTracking.tracked_in_dom = new WeakMap();

class SubMap {
    constructor() {
        this.all = new Map();
    }
    get(event) {
        var _a;
        return (_a = this.all.get(event)) !== null && _a !== void 0 ? _a : [];
    }
    add(event, ...items) {
        let list = this.all.get(event);
        if (list) {
            list.push(...items.filter((e) => (list === null || list === void 0 ? void 0 : list.includes(e)) != true));
        }
        else {
            this.all.set(event, [...items]);
        }
        return this;
    }
    remove(event, ...items) {
        const list = this.all.get(event);
        if (list) {
            for (const item of items) {
                const index = list.indexOf(item);
                if (index !== -1) {
                    list.splice(index, 1);
                }
            }
        }
        return this;
    }
    removeAll(event) {
        this.all.delete(event);
        return this;
    }
}

function VNodeExtractEl(node) {
    if ("element" in node) {
        return node.element;
    }
    return node;
}
class PNodeUtil {
    static resetStyles(vnode, to_reset) {
        const options = to_reset.length > 0 ? to_reset : ["content", "style", "class"];
        for (const option of options) {
            if (option === "content") {
                vnode.element.innerHTML = "";
            }
            else if (option === "style") {
                if (vnode.element instanceof HTMLElement) {
                    const style_ref = vnode.element.style;
                    for (let i = style_ref.length; i--;) {
                        const name_string = style_ref[i];
                        style_ref.removeProperty(name_string);
                    }
                }
            }
            else if (option === "class") {
                vnode.element.className = "";
            }
        }
        return vnode;
    }
}
class P_VNodeUtil {
    static setStyles(element, styles = {}) {
        if (typeof styles != "object" ||
            element instanceof HTMLElement != true) {
            return;
        }
        for (const [key, value] of Object.entries(styles)) {
            if (key === "variables") {
                for (const [prop_key, prop_value] of Object.entries(value)) {
                    element.style.setProperty(`--${prop_key}`, prop_value);
                }
            }
            if (value == undefined) {
                continue;
            }
            element.style[key] = `${value}`;
        }
    }
    static removeStyles(element, styles) {
        if (element instanceof HTMLElement) {
            for (const style of styles) {
                element.style.removeProperty(style);
            }
        }
    }
    static injectItems(vnode, direction = "append", objs) {
        if (objs.length < 1) {
            return vnode;
        }
        for (const el of objs) {
            if (Array.isArray(el)) {
                objs.splice(objs.indexOf(el), 1, ...el);
            }
        }
        for (const item of objs) {
            if (item == false || item == null || Array.isArray(item)) {
                continue;
            }
            const extracted = typeof item === "string" ? item : VNodeExtractEl(item);
            if (direction === "append") {
                vnode.element.append(extracted);
            }
            else {
                vnode.element.prepend(extracted);
            }
        }
        return vnode;
    }
    static attr(element, attributes = {}) {
        if (typeof attributes == "object" && attributes !== null) {
            for (const [key, value] of Object.entries(attributes)) {
                element.setAttribute(key, value + "");
            }
        }
    }
}

(undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

var Helpers;
(function (Helpers) {
    class VecLike {
        static toString(args) {
            return `(${this.clean(args).join(",")})`;
        }
        static clean(args) {
            return args;
        }
        static valid(args) {
            return true;
        }
    }
    class VectorNumber extends VecLike {
        static clean(args) {
            return new Array(this.size).fill(0).map((v, i) => { var _a; return (_a = args === null || args === void 0 ? void 0 : args[i]) !== null && _a !== void 0 ? _a : v; });
        }
        static valid(args) {
            return (args.length == this.size &&
                args.every((n) => typeof n === "number"));
        }
    }
    VectorNumber.size = 0;
    Helpers.VectorNumber = VectorNumber;
    class VectorNumberInt extends VectorNumber {
        static clean(args) {
            return super.clean(args).map((n) => n | 0);
        }
        static valid(args) {
            return super.valid(args) && args.every((n) => n == (n | 0));
        }
    }
    VectorNumberInt.size = 0;
    Helpers.VectorNumberInt = VectorNumberInt;
})(Helpers || (Helpers = {}));
class Vector2 extends Helpers.VectorNumber {
    static clean(args) {
        return super.clean(args);
    }
    static valid(args) {
        return super.valid(args);
    }
    static fromObject(point) {
        return this.clean([point.x, point.y]);
    }
    static toObject(args) {
        return { x: args[0], y: args[0] };
    }
}
Vector2.size = 2;
class Vector2i extends Helpers.VectorNumberInt {
    static clean(args) {
        return super.clean(args);
    }
    static valid(args) {
        return super.valid(args);
    }
    static fromObject(point) {
        return this.clean([point.x, point.y]);
    }
    static toObject(args) {
        this.type;
        return { x: args[0] | 0, y: args[1] | 0 };
    }
}
Vector2i.size = 2;
class Vector3 extends Helpers.VectorNumber {
    static clean(args) {
        return super.clean(args);
    }
    static valid(args) {
        return super.valid(args);
    }
    static fromObject(point) {
        return this.clean([point.x, point.y, point.z]);
    }
    static toObject(args) {
        return { x: args[0], y: args[1], z: args[2] };
    }
}
Vector3.size = 3;
class Vector3i extends Helpers.VectorNumberInt {
    static clean(args) {
        return super.clean(args);
    }
    static valid(args) {
        return super.valid(args);
    }
    static toObject(args) {
        return { x: args[0] | 0, y: args[1] | 0, z: args[2] | 0 };
    }
}
Vector3i.size = 3;

function valueTrap(obj, property, callback) {
    Object.defineProperty(obj, property, {
        configurable: true,
        get() {
            const value = callback();
            Object.defineProperty(obj, property, {
                value,
                writable: false,
                configurable: false,
                enumerable: true,
            });
            return value;
        },
    });
}
class VNodeAnimation {
    constructor(node, styles, options) {
        this.node = node;
        this.node = node;
        this.animation = this.node.element.animate(styles, options.animation);
        const use_reverse = options.animation.direction == "reverse" ||
            options.animation.direction == "alternate-reverse";
        const end_index = use_reverse ? 0 : styles.length - 1;
        if (typeof options === "object") {
            this.animation.addEventListener("finish", () => {
                if (options.save === true) {
                    P_VNodeUtil.setStyles(this.node.element, styles[end_index]);
                }
            });
        }
    }
}
class VNodeUtilityClass {
    constructor(node) {
        this.node = node;
        this.node = node;
    }
    nest(run) {
        run(this);
        return this.node;
    }
}
class VNodeStyle extends VNodeUtilityClass {
    update(styles = {}) {
        P_VNodeUtil.setStyles(this.node.element, styles);
        return this;
    }
    remove(...styles) {
        P_VNodeUtil.removeStyles(this.node.element, styles);
        return this;
    }
    animate(styles, options) {
        return new VNodeAnimation(this.node, styles, options);
    }
}
class VNodeClasses extends VNodeUtilityClass {
    static addClasses(element, args) {
        for (const arg of args) {
            if (arg.includes(" ")) {
                args.splice(args.indexOf(arg), 1, ...arg.split(" "));
            }
            else if (Array.isArray(arg)) {
                args.splice(args.indexOf(arg), 1, ...arg);
            }
        }
        if (Array.isArray(args)) {
            element.classList.add(...args);
        }
    }
    static removeClasses(element, args) {
        for (const arg of args) {
            if (arg.includes(" ")) {
                args.splice(args.indexOf(arg), 1, ...arg.split(" "));
            }
        }
        if (Array.isArray(args)) {
            element.classList.remove(...args);
        }
    }
    has(class_name) {
        return this.node.element.classList.contains(class_name);
    }
    add(...classes) {
        VNodeClasses.addClasses(this.node.element, classes);
        return this;
    }
    remove(...classes) {
        VNodeClasses.removeClasses(this.node.element, classes);
        return this;
    }
    set(...classes) {
        this.node.element.className = classes.join(" ");
        return this;
    }
    toggleClass(class_name, status = !this.has(class_name)) {
        if (status) {
            this.add(class_name);
        }
        else {
            this.remove(class_name);
        }
        return this;
    }
}
class VNodeEvents extends VNodeUtilityClass {
    static getEvents(element) {
        const existing = VNodeEvents.weak_events.get(element);
        if (existing) {
            return existing;
        }
        else {
            const emitter = new Emitter();
            VNodeEvents.weak_events.set(element, emitter);
            return emitter;
        }
    }
    static getCallbacksGroup(element) {
        const got = VNodeEvents.stored_listeners.get(element);
        if (got) {
            return got;
        }
        else {
            const submap = new SubMap();
            VNodeEvents.stored_listeners.set(element, submap);
            return submap;
        }
    }
    static on(element, event, callback) {
        if (VNodeEvents.reserved_events.includes(event)) {
            VNodeEvents.getEvents(element).on(event, callback);
        }
        else {
            if (event == "keypress" || event == "keydown" || event == "keyup") {
                P_VNodeUtil.attr(element, { tabIndex: 0 });
            }
            VNodeEvents.getCallbacksGroup(element).add(event, callback);
            element.addEventListener(event, callback);
        }
    }
    static off(element, event, callback) {
        if (VNodeEvents.reserved_events.includes(event)) {
            VNodeEvents.getEvents(element).off(event, callback);
        }
        else {
            const group = VNodeEvents.getCallbacksGroup(element);
            if (callback) {
                group.remove(event, callback);
                element.removeEventListener(event, callback);
            }
            else {
                for (const callback of group.get(event)) {
                    element.removeEventListener(event, callback);
                }
                group.removeAll(event);
            }
        }
    }
    static once(element, event, callback) {
        const once_callback = (...args) => {
            this.off(element, event, once_callback);
            callback(...args);
            return void 0;
        };
        this.on(element, event, (...args) => once_callback(...args));
    }
    constructor(node) {
        super(node);
        this.element = this.node.element;
    }
    on(event, callback) {
        VNodeEvents.on(this.element, event, callback);
        return this;
    }
    off(event, callback) {
        VNodeEvents.off(this.element, event, callback);
        return this;
    }
    once(event, callback) {
        VNodeEvents.once(this.element, event, callback);
        return this;
    }
}
VNodeEvents.reserved_events = [
    "append",
    "remove",
];
VNodeEvents.stored_listeners = new WeakMap();
VNodeEvents.weak_events = new WeakMap();

var _a;
class VNode {
    static from(el) {
        if (typeof el === "string") {
            return new VNode(document.createElement(el));
        }
        else if (el instanceof HTMLElement ||
            el instanceof HTMLInputElement) {
            return new VNode(el);
        }
        else if (el instanceof VNode) {
            return new VNode(el.element);
        }
        else if (el instanceof ProxyNode) {
            return new VNode(el.element);
        }
        else {
            throw new Error("Invalid element");
        }
    }
    constructor(element) {
        valueTrap(this, "style", () => new VNodeStyle(this));
        valueTrap(this, "class", () => new VNodeClasses(this));
        valueTrap(this, "events", () => new VNodeEvents(this));
        if (typeof element === "string") {
            this.element = document.createElement(element);
        }
        else {
            this.element = VNode.extractEl(element);
        }
        if (VNode.send_events === true) {
            VNode.events.emit("create", this);
        }
    }
    attr(attributes = {}) {
        P_VNodeUtil.attr(this.element, attributes);
        return this;
    }
    swap(node) {
        const new_node = VNode.extractEl(node);
        this.element.replaceWith(new_node);
        this.element = new_node;
        return this;
    }
    id(value = undefined) {
        if (value == undefined) {
            return this.element.id;
        }
        else {
            this.element.id = value;
            return this;
        }
    }
    append(...objs) {
        return P_VNodeUtil.injectItems(this, "append", objs);
    }
    prepend(...objs) {
        return P_VNodeUtil.injectItems(this, "prepend", objs);
    }
    appendTo(obj, direction = "append") {
        if (obj == false) {
            return this;
        }
        if (direction === "append") {
            obj.append(VNodeExtractEl(this.element));
        }
        else {
            obj.prepend(VNodeExtractEl(this.element));
        }
        return this;
    }
    getBounds() {
        return this.element.getBoundingClientRect();
    }
    value(value = undefined) {
        if (this.element instanceof HTMLInputElement) {
            if (value == undefined) {
                return this.element.value;
            }
            else {
                this.element.value = value;
                return this;
            }
        }
        else {
            if (value == undefined) {
                return this.element.textContent;
            }
            else {
                this.element.textContent = value;
                return this;
            }
        }
    }
    focus() {
        if (this.inDom()) {
            if (this.element instanceof HTMLElement) {
                this.element.focus();
            }
        }
        else {
            setTimeout(() => {
                if (this.element instanceof HTMLElement) {
                    this.element.focus();
                }
            }, 0);
        }
        return this;
    }
    ref(run) {
        run(this);
        return this;
    }
    remove() {
        this.element.remove();
        return this;
    }
    setContent(...content) {
        return this.clear().append(...content);
    }
    clear() {
        this.element.textContent = "";
        return this;
    }
    setStyles(styles) {
        this.style.update(styles);
        return this;
    }
    setClasses(...classes) {
        this.class.set(...classes);
        return this;
    }
    inDom(parent = document.body) {
        return parent.contains(this.element);
    }
    scroll(x = 0, y = 0) {
        this.element.scroll(x, y);
        return this;
    }
}
VNode.Util = (_a = class VNodeUtilExtend {
        static qs(selector, element = document) {
            const current = element.querySelector(selector);
            return current ? new VNode(current) : null;
        }
        static qsAll(selector, element = document) {
            return Array.from(element.querySelectorAll(selector)).map((current) => {
                return new VNode(current);
            });
        }
        static getChildren(extractable) {
            const extracted = this.extractEl(extractable);
            return Array.from(extracted.children).map((document_el) => new VNode(document_el));
        }
    },
    _a.extractEl = VNodeExtractEl,
    _a);
VNode.indexing = new Map();
VNode.new = new Proxy({}, {
    get(target, element_tag) {
        return new VNode(document.createElement(element_tag));
    },
});
VNode.extractEl = VNodeExtractEl;
VNode.send_events = false;
VNode.events = new Emitter();

let reserved_events = ["append", "remove"];
class ProxyNode {
    static getEvents(element) {
        const existing = ProxyNode.weak_events.get(element);
        if (existing) {
            return existing;
        }
        else {
            const emitter = new Emitter();
            ProxyNode.weak_events.set(element, emitter);
            return emitter;
        }
    }
    static extractEl(node) {
        if (node instanceof ProxyNode || node instanceof VNode) {
            return node.element;
        }
        else {
            return node;
        }
    }
    static isNode(el) {
        return el instanceof ProxyNode;
    }
    static getCallbacksGroup(element) {
        const got = ProxyNode.stored_listeners.get(element);
        if (got) {
            return got;
        }
        else {
            const submap = new SubMap();
            ProxyNode.stored_listeners.set(element, submap);
            return submap;
        }
    }
    static getListeners(element, event) {
        const group = ProxyNode.getCallbacksGroup(element);
        return group.get(event);
    }
    constructor(el) {
        this.listeners = {};
        if (typeof el === "string") {
            this.element = document.createElement(el);
        }
        else if (el instanceof HTMLElement ||
            el instanceof HTMLInputElement)
            this.element = el;
        else if (el instanceof ProxyNode) {
            this.element = el.element;
        }
        else {
            throw new Error("Invalid element");
        }
    }
    get focused() {
        return document.activeElement === this.element;
    }
    get childFocused() {
        return this.focused || this.element.contains(document.activeElement);
    }
    get bounds() {
        return this.element.getBoundingClientRect();
    }
    get parent() {
        const parent = this.element.parentElement;
        if (parent != null) {
            return new ProxyNode(parent);
        }
    }
    get value() {
        var _a;
        if (this.element instanceof HTMLInputElement) {
            return this.element.value;
        }
        else {
            return (_a = this.element.textContent) !== null && _a !== void 0 ? _a : "";
        }
    }
    set value(value) {
        if (this.element instanceof HTMLInputElement) {
            this.element.value = value;
        }
        else {
            this.element.textContent = value;
        }
    }
    get wrapper() {
        return this.ref;
    }
    ref(run) {
        run(this);
        return this;
    }
    text(content) {
        this.element.textContent = content;
        return this;
    }
    id(value) {
        this.element.id = value;
        return this;
    }
    attr(attributes = {}) {
        if (typeof attributes != "object") {
            return this;
        }
        for (const [key, value] of Object.entries(attributes)) {
            this.element.setAttribute(key, value + "");
        }
        return this;
    }
    swap(node) {
        const new_node = ProxyNode.extractEl(node);
        this.element.replaceWith(new_node);
        this.element = new_node;
        return this;
    }
    clone() {
        return new ProxyNode(this.element.cloneNode(true));
    }
    clear() {
        this.element.textContent = "";
        return this;
    }
    exists() {
        return document.body.contains(this.element);
    }
    getChildren() {
        return Array.from(this.element.children).map((documentEl) => new ProxyNode(documentEl));
    }
    reset(...to_reset) {
        return PNodeUtil.resetStyles(this, to_reset);
    }
    class(...args) {
        this.element.className = args.join(" ");
        return this;
    }
    hasClass(className) {
        return this.element.classList.contains(className);
    }
    addClass(...args) {
        for (const arg of args) {
            if (arg.includes(" ")) {
                args.splice(args.indexOf(arg), 1, ...arg.split(" "));
            }
            else if (Array.isArray(arg)) {
                args.splice(args.indexOf(arg), 1, ...arg);
            }
        }
        if (Array.isArray(args)) {
            this.element.classList.add(...args);
        }
        return this;
    }
    removeClass(...args) {
        for (const arg of args) {
            if (arg.includes(" ")) {
                args.splice(args.indexOf(arg), 1, ...arg.split(" "));
            }
        }
        if (Array.isArray(args)) {
            this.element.classList.remove(...args);
        }
        return this;
    }
    toggleClass(className, status = !this.hasClass(className)) {
        status ? this.addClass(className) : this.removeClass(className);
        return this;
    }
    styles(styles = {}) {
        if (typeof styles != "object") {
            return this;
        }
        else if (this.element instanceof HTMLElement != true) {
            return this;
        }
        for (const [key, value] of Object.entries(styles)) {
            if (key === "props") {
                for (const [prop_key, prop_value] of Object.entries(value)) {
                    this.element.style.setProperty(`--${prop_key}`, prop_value);
                }
            }
            this.element.style[key] = value;
        }
        return this;
    }
    removeStyles(...styles) {
        if (this.element instanceof HTMLElement != true) {
            return this;
        }
        for (const style of styles) {
            this.element.style.removeProperty(style);
        }
        return this;
    }
    getEvents() {
        return ProxyNode.getEvents(this.element);
    }
    on(event, callback) {
        if (reserved_events.includes(event)) {
            this.getEvents().on(event, callback);
        }
        else {
            if (event == "keypress" || event == "keydown" || event == "keyup") {
                this.attr({ tabindex: 0 });
            }
            ProxyNode.getCallbacksGroup(this.element).add(event, callback);
            this.element.addEventListener(event, callback);
        }
        return this;
    }
    off(event, callback) {
        if (reserved_events.includes(event)) {
            this.getEvents().off(event, callback);
        }
        else {
            const group = ProxyNode.getCallbacksGroup(this.element);
            if (callback) {
                group.remove(event, callback);
                this.element.removeEventListener(event, callback);
            }
            else {
                for (const callback of group.get(event)) {
                    this.element.removeEventListener(event, callback);
                }
                group.removeAll(event);
            }
        }
        return this;
    }
    once(event, callback) {
        const once_callback = (...args) => {
            this.off(event, once_callback);
            callback(...args);
            return void 0;
        };
        this.on(event, (...args) => once_callback(...args));
        return this;
    }
    addListener(events) {
        var _a;
        var _b;
        for (const [key, event] of Object.entries(events)) {
            for (const [listener, fn] of Object.entries(event)) {
                if (listener == "keypress" ||
                    listener == "keydown" ||
                    listener == "keyup") {
                    this.attr({ tabindex: 0 });
                }
                const func = fn.bind(this);
                (_a = (_b = this.listeners)[key]) !== null && _a !== void 0 ? _a : (_b[key] = {});
                this.listeners[key][listener] = func;
                this.element.addEventListener(listener, func);
            }
        }
        return this;
    }
    removeListener(key) {
        for (const listener in this.listeners[key]) {
            this.element.removeEventListener(listener, this.listeners[key][listener]);
        }
        delete this.listeners[key];
        return this;
    }
    interval(callback, time = 1000, immediate = false) {
        const toCall = () => callback.bind(this)(this, () => clearInterval(temp_interval));
        if (immediate) {
            toCall();
        }
        const temp_interval = setInterval(toCall, time);
        this.on("remove", () => clearInterval(temp_interval));
        return this;
    }
    remove() {
        this.element.remove();
        return this;
    }
    setContent(...content) {
        return this.clear().append(...content);
    }
    append(...objs) {
        if (objs.length < 1) {
            return this;
        }
        for (const el of objs) {
            if (Array.isArray(el)) {
                objs.splice(objs.indexOf(el), 1, ...el);
            }
        }
        for (const item of objs) {
            if (item == false || item == null || Array.isArray(item)) {
                continue;
            }
            this.element.append(typeof item === "string" ? item : ProxyNode.extractEl(item));
        }
        return this;
    }
    appendTo(obj) {
        if (obj == false) {
            return this;
        }
        obj.append(ProxyNode.extractEl(this.element));
        return this;
    }
    prependTo(obj) {
        if (obj == null) {
            return this;
        }
        obj.prepend(ProxyNode.extractEl(this.element));
        return this;
    }
    prepend(...objs) {
        if (objs.length < 1) {
            return this;
        }
        for (const el of objs) {
            if (Array.isArray(el)) {
                const i = objs.indexOf(el);
                objs.splice(i, i + el.length);
                objs.push(...el);
            }
        }
        for (const el of objs) {
            this.element.prepend(ProxyNode.extractEl(el));
        }
        return this;
    }
    focus() {
        setTimeout(() => this.element instanceof HTMLElement && this.element.focus(), 0);
        return this;
    }
    scroll(x = 0, y = 0) {
        setTimeout(() => this.element.scroll(x, y), 500);
        return this;
    }
    setTabIndex(index) {
        if (typeof index == "number") {
            if (0 > index) {
                this.element.removeAttribute("tabindex");
            }
            else {
                this.element.setAttribute("tabindex", "0");
            }
        }
        return this;
    }
    horizontalScrolling() {
        this.on("wheel", (event) => {
            event.preventDefault();
            this.element.scrollLeft += event.deltaY;
        });
        return this;
    }
    animate(styles, options) {
        var _a;
        const instance = this.element.animate(styles, options);
        if (typeof options === "object") {
            instance.onfinish = (ev) => {
                var _a, _b;
                if (options.save === true) {
                    this.styles(styles[styles.length - 1]);
                }
                (_b = (_a = options.onFinish) === null || _a === void 0 ? void 0 : _a.bind(instance)) === null || _b === void 0 ? void 0 : _b(ev);
            };
            options.onCancel && (instance.oncancel = options.onCancel);
            options.onRemove && (instance.onremove = options.onRemove);
            (_a = options.animationReference) === null || _a === void 0 ? void 0 : _a.call(options, instance);
        }
        return this;
    }
}
ProxyNode.stored_listeners = new WeakMap();
ProxyNode.weak_events = new WeakMap();
ProxyNode.tracking = new ObserverTracking();
new Proxy({}, {
    get(target, element_tag) {
        return new ProxyNode(document.createElement(element_tag));
    },
});

const unions = {
    ShiftLeft: "Shift",
    ShiftRight: "Shift",
    BracketLeft: "Bracket",
    BracketRight: "Bracket",
    ControlLeft: "Control",
    ControlRight: "Control",
    AltLeft: "Alt",
    AltRight: "Alt",
};
class VNodeEventGroup {
    constructor(node) {
        this.node = node;
        this.map = new Map();
        this.node = node;
    }
    on(event, callback) {
        this.map.set(event, callback);
        this.node.events.on(event, callback);
        return this;
    }
    off(event, callback) {
        this.map.delete(event);
        this.node.events.off(event, callback);
        return this;
    }
    clear() {
        for (const [event, callback] of this.map.entries()) {
            this.off(event, callback);
        }
        return this;
    }
}
class Keyboard {
    static formatKeycode(value) {
        return value;
    }
    constructor(element = document.body) {
        this.events = new Emitter$1();
        /* Keys pressed */
        this.pressed = {};
        this.alive = false;
        this.union = "both";
        this.isPressed = (key) => { var _a; return ((_a = this.pressed) === null || _a === void 0 ? void 0 : _a[key]) == true; };
        this.intPressed = (key) => this.isPressed(key) ? 1 : 0;
        this.object = new VNode(element);
        this.event_group = new VNodeEventGroup(this.object);
    }
    attatch(node) {
        this.dispose();
        this.object = node;
        this.event_group = new VNodeEventGroup(this.object);
        this.event_group
            .on("keydown", (event) => {
            this.simulateKeyDown(event.code);
        })
            .on("keyup", (event) => {
            this.simulateKeyUp(event.code);
        });
    }
    init() {
        if (this.alive !== false) {
            return;
        }
        this.alive = true;
        this.attatch(this.object);
    }
    get stop() {
        return this.dispose;
    }
    dispose() {
        if (this.event_group != undefined) {
            this.event_group.clear();
        }
        if (this.alive !== true) {
            return;
        }
        this.alive = false;
        this.pressed = {};
    }
    simulateKeyDown(keycode) {
        keycode = Keyboard.formatKeycode(keycode);
        this.pressed[keycode] = true;
        const alt = unions === null || unions === void 0 ? void 0 : unions[keycode];
        if (this.union != "split") {
            if (alt != null)
                this.simulateKeyDown(alt);
        }
        if (this.union == "joint" && alt != undefined) {
            return;
        }
        this.events.emit("keydown", keycode);
    }
    simulateKeyUp(keycode) {
        keycode = Keyboard.formatKeycode(keycode);
        delete this.pressed[keycode];
        const alt = unions === null || unions === void 0 ? void 0 : unions[keycode];
        if (this.union != "split") {
            if (alt != null)
                this.simulateKeyUp(alt);
        }
        if (this.union == "joint" && alt != undefined) {
            return;
        }
        // this.events.emit("Up-" + keycode as any);
        this.events.emit("keyup", keycode);
    }
    anyPressed(...args) {
        return args.some(this.isPressed);
    }
    mapInt(...keys) {
        const keyMap = (key) => [
            key,
            this.intPressed(key),
        ];
        return Object.fromEntries(keys.map(keyMap));
    }
    applyKeys(keys) {
        for (const [key, value] of Object.entries(keys)) {
            if (value === true)
                this.simulateKeyDown(key);
            else
                this.simulateKeyUp(key);
        }
    }
}

class LegacySignature extends Component {
}
const sig = new LegacySignature();
class LegacySystem extends System {
    constructor(ecs, world) {
        super();
        this.world = world;
        this.componentsRequired = new Set([LegacySignature]);
        this.world = world;
    }
    update(entities) {
        for (const entity of Array.from(entities).sort((a, b) => a.priority - b.priority)) {
            entity
                .events
                .emit('update')
                .emit('render');
        }
    }
}
class LegacyEntity extends Entity {
    constructor(ecs) {
        super();
        this.events = new Emitter$1();
        this.priority = 0;
        ecs.addComponent(this, sig);
    }
    ref(fn) {
        fn.bind(this)(this);
        return this;
    }
    tick() {
        this.events.emit('update');
        this.events.emit('render');
    }
}

class FPS {
    constructor(sampleSize) {
        this.value = 0;
        this.currentIndex = 0;
        this.lastTick = 0;
        this.samples = [];
        this.sampleSize = sampleSize !== null && sampleSize !== void 0 ? sampleSize : 60;
    }
    tick() {
        if (this.lastTick == null) {
            this.lastTick = performance.now();
            return 0;
        }
        const now = performance.now();
        const delta = (now - this.lastTick) / 1000;
        const currentFPS = 1 / delta;
        this.samples[this.currentIndex] = Math.round(currentFPS);
        let total = 0;
        for (let i = 0; i < this.samples.length; i++)
            total += this.samples[i];
        const average = Math.round(total / this.samples.length);
        this.value = average;
        this.lastTick = now;
        this.currentIndex++;
        if (this.currentIndex === this.sampleSize) {
            this.currentIndex = 0;
        }
        return this.value;
    }
}
class Repeater {
    constructor(fpsLimit, callback) {
        this.frame = -1;
        this.paused = true;
        this.fpsLimit = -1;
        this.actualFps = -1;
        this.start_time = 0;
        this.timestamp = 0;
        this.delta = 0;
        this.fpsLimit = fpsLimit;
        this.delay = 1000 / fpsLimit;
        this.callback = callback;
        this._fpsHandler = new FPS();
    }
    loop(timestamp) {
        if (this.paused) {
            return;
        }
        if (this.start_time == null)
            this.start_time = timestamp;
        const seg = Math.floor((timestamp - this.start_time) / this.delay);
        if (seg > this.frame) {
            this.frame = seg;
            this.actualFps = this._fpsHandler.tick();
            this.delta = (timestamp - this.timestamp) / 1000;
            if (timestamp - this.timestamp > 3000) {
                this.delta = 0;
            }
            this.timestamp = timestamp;
            this.callback(this);
        }
        this.RafRef = requestAnimationFrame(this.loop.bind(this));
    }
    get setFps() {
        return this.fpsLimit;
    }
    get fps() {
        return this.actualFps;
    }
    set fps(newFps) {
        if (arguments.length == 0)
            return;
        this.maxFramesPerSecond = newFps;
        this.delay = 1000;
        this.frame = -1;
        this.start_time = 0;
    }
    /**
     * Restarts the repeater if it's not already running
     */
    start() {
        if (this.paused == true) {
            this.paused = false;
            this.RafRef = requestAnimationFrame(this.loop.bind(this));
        }
    }
    /**
     * Pauses
     */
    pause(paused = !this.paused == true) {
        this.paused = paused;
        if (this.paused !== true)
            return this.start(), void 0;
        if (typeof this.RafRef === "number")
            cancelAnimationFrame(this.RafRef);
        this.start_time = 0;
        this.frame = -1;
    }
}

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
class EngineObject extends LegacyEntity {
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
        new VNode(engine.brush.canvas).style.update(full_float_styling);
        const el = VNode.Util.extractEl(engine.dom);
        if (((_a = VNode.Util.extractEl(parent)) === null || _a === void 0 ? void 0 : _a.contains(el)) != true) {
            parent.append(el);
        }
        engine.dom.focus();
    }
    constructor(brush) {
        this.ecs = new ECS();
        this.legacy = new LegacySystem(this.ecs, this);
        /** List of renderable objects */
        this.objects = new Set();
        this.offset = { x: 0, y: 0 };
        this.zoom = 3;
        this.frame = 0;
        this.dom = VNode.new.div;
        this.ui = VNode.new.div;
        this.collision = Collision;
        this.object = (data, ref) => {
            const entity = new LegacyEntity(this.ecs);
            if (data.priority != null) {
                entity.priority = data.priority;
            }
            ref(entity);
            return entity;
        };
        this.brush = brush;
        this.ecs.addSystem(this.legacy);
        this.brush.canvas.setAttribute("tabindex", "1");
        this.dom.append(this.brush.canvas, this.ui);
        this.cursor = new Cursor(this.brush.canvas);
        this.keyboard = new Keyboard(this.dom.element);
        // 	this.cursor = new Cursor(this.dom.element);
        // this.keyboard = new Keyboard(this.dom.element as HTMLElement);
        this.ticks = new Repeater(64, () => {
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
        this.ecs.killEntities();
        this.ecs.killSystems();
        /* Do final run / deletion */
        this.ecs.update();
        this.ecs.addSystem(this.legacy);
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
Engine.ECS = ECS;

// import Emitter from "@orago/lib/emitter";
// type GamepadEvents = {
// 	button: (index: number) => void;
// }
// class GamepadInstance {
// 	instance: Gamepad;
// 	gamepad_events = new Emitter<GamepadEvents, true>();
// 	constructor(gamepad: Gamepad) {
// 		this.instance = gamepad;
// 	}
// }
/**
 * Returns the distance between two values
 * @param {number} first
 * @param {number} second
 * @returns {number}
 */
const difference = (first, second) => first - second > 0 ? first - second : (first - second) * -1;
class Gamepads {
    static allowed() {
        return 'navigator' in window && 'getGamepads' in window['navigator'];
    }
    static getAll() {
        if (Gamepads.allowed() == false)
            return [];
        return navigator.getGamepads();
    }
    static getActive() {
        return Gamepads.getAll().filter(e => e != null);
    }
    static TestAction(gamepads, action, minimum = .6) {
        var _a;
        if (gamepads == null || gamepads.length == 0)
            return false;
        for (const gamepad of gamepads) {
            if (gamepad == null)
                continue;
            const index = Gamepads.mappedButtons[action];
            // Reserved
            if (index < 0) {
                if (difference(gamepad.axes[0], 0) > minimum) {
                    if (action == "Left-Axis-X")
                        return true;
                    if (action == "Left-Axis-Left" && gamepad.axes[0] < 0)
                        return true;
                    if (action == "Left-Axis-Right" && gamepad.axes[0] > 0)
                        return true;
                }
                if (difference(gamepad.axes[1], 0) > minimum) {
                    if (action == "Left-Axis-Y")
                        return true;
                    if (action == "Left-Axis-Up" && gamepad.axes[1] < 0)
                        return true;
                    if (action == "Left-Axis-Down" && gamepad.axes[1] > 0)
                        return true;
                }
                if (difference(gamepad.axes[2], 0) > minimum) {
                    if (action == "Right-Axis-X")
                        return true;
                    if (action == "Right-Axis-Left" && gamepad.axes[2] < 0)
                        return true;
                    if (action == "Right-Axis-Right" && gamepad.axes[2] > 0)
                        return true;
                }
                if (difference(gamepad.axes[3], 0) > minimum) {
                    if (action == "Right-Axis-Y")
                        return true;
                    if (action == "Right-Axis-Up" && gamepad.axes[3] < 0)
                        return true;
                    if (action == "Right-Axis-Down" && gamepad.axes[3] > 0)
                        return true;
                }
            }
            const button = (_a = gamepad === null || gamepad === void 0 ? void 0 : gamepad.buttons) === null || _a === void 0 ? void 0 : _a[index];
            if ((button === null || button === void 0 ? void 0 : button.pressed) == true && (button === null || button === void 0 ? void 0 : button.value) > minimum)
                return true;
        }
        return false;
    }
    static TestButton(gamepads, index, minimum = .6) {
        var _a;
        if (gamepads == null || gamepads.length == 0)
            return false;
        for (const gamepad of gamepads) {
            if (gamepad == null)
                continue;
            const button = (_a = gamepad === null || gamepad === void 0 ? void 0 : gamepad.buttons) === null || _a === void 0 ? void 0 : _a[index];
            if ((button === null || button === void 0 ? void 0 : button.pressed) == true && (button === null || button === void 0 ? void 0 : button.value) > minimum) {
                return true;
            }
        }
        return false;
    }
}
Gamepads.mappedButtons = {
    "Left-Axis-Up": -16,
    "Left-Axis-Down": -15,
    "Left-Axis-Left": -14,
    "Left-Axis-Right": -13,
    "Right-Axis-Up": -12,
    "Right-Axis-Down": -11,
    "Right-Axis-Left": -10,
    "Right-Axis-Right": -9,
    "Left-Axis-X": -8,
    "Left-Axis-Y": -7,
    "Right-Axis-X": -6,
    "Right-Axis-Y": -5,
    "Button-1": 0,
    "Button-2": 1,
    "Button-3": 2,
    "Button-4": 3,
    "Left-Shoulder": 4,
    "Right-Shoulder": 5,
    "Left-Trigger": 6,
    "Right-Trigger": 7,
    "View": 8,
    "Menu": 9,
    "Left-Stick": 10,
    "Right-Stick": 11,
    "Pad-Up": 12,
    "Pad-Down": 13,
    "Pad-Left": 14,
    "Pad-Right": 15,
    "Home": 16
};

class InputMap {
    constructor(input, parent = document.body) {
        // this.keyboard = new Keyboard(parent);
        // this.cursor = new Cursor(parent);
        this.current_maps = new Map();
        this.active = true;
        this.onceing = new Set();
        if (typeof input === "object") {
            for (const [name, data] of Object.entries(input)) {
                this.current_maps.set(name, data);
            }
        }
    }
    setKeyboard(keyboard) {
        this.keyboard = keyboard;
        return this;
    }
    setCursor(cursor) {
        this.cursor = cursor;
        return this;
    }
    isPressed(name) {
        var _a, _b;
        if (this.active == false) {
            return false;
        }
        const data = this.current_maps.get(name);
        if ((data === null || data === void 0 ? void 0 : data.simulated) == true) {
            return true;
        }
        if (data === null || data === void 0 ? void 0 : data.cursor) {
            for (const button of data.cursor) {
                if ((_a = this.cursor) === null || _a === void 0 ? void 0 : _a.hasButton(button)) {
                    return true;
                }
            }
        }
        if (data === null || data === void 0 ? void 0 : data.keyboard) {
            for (const button of data.keyboard) {
                if ((_b = this.keyboard) === null || _b === void 0 ? void 0 : _b.isPressed(button)) {
                    return true;
                }
            }
        }
        if (data === null || data === void 0 ? void 0 : data.gamepad) {
            const gamepads = Gamepads.getAll()
                .filter((_, i) => this.allowed_gamepads == null ||
                this.allowed_gamepads.includes(i))
                .filter((_) => _ != null);
            for (const button of data.gamepad) {
                if (Gamepads.TestAction(gamepads, button, data === null || data === void 0 ? void 0 : data.gamepad_deadzone)) {
                    return true;
                }
            }
        }
        return false;
    }
    once(name) {
        if (this.active == false) {
            return false;
        }
        const pressed = this.isPressed(name);
        const has = this.onceing.has(name);
        if (has || pressed != true) {
            if (pressed != true && has) {
                this.onceing.delete(name);
            }
            return false;
        }
        this.onceing.add(name);
        return pressed;
    }
}

class RectangleUtil {
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
        const scaleFactor = RectangleUtil.scaleToFitRatio(container, child);
        // Calculate the scaled dimensions
        const width = child.width * scaleFactor;
        const height = child.height * scaleFactor;
        return { width, height };
    }
    static scale(width, height, scale) {
        return { width: width * scale, height: height * scale };
    }
    static from(obj) {
        return new RectangleUtil(obj.width, obj.height);
    }
    static contains(parent, child) {
        var _a, _b;
        const parentx2 = parent.x + parent.width;
        const parenty2 = parent.y + parent.height;
        const childx2 = child.x + ((_a = child === null || child === void 0 ? void 0 : child.width) !== null && _a !== void 0 ? _a : 0);
        const childy2 = child.y + ((_b = child === null || child === void 0 ? void 0 : child.height) !== null && _b !== void 0 ? _b : 0);
        return parent.x <= child.x && parentx2 >= childx2 && parent.y <= child.y && parenty2 >= childy2;
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
     * @returns {RectangleUtil}
     */
    scaled(scale) {
        return new RectangleUtil(this.width * scale, this.height * scale);
    }
    toFit(_ = this) {
        return RectangleUtil.from(RectangleUtil.scaleToFit(_, this));
    }
}
class RectBody extends RectangleUtil {
    static toBoundingBox(rect) {
        if (rect instanceof RectBody)
            return new Bound(rect.x, rect.y, rect.width, rect.height);
        if (rect instanceof RectangleUtil)
            return new Bound(0, 0, rect.width, rect.height);
    }
    constructor(x, y, width = 0, height = 0) {
        super(width, height);
        this.x = x;
        this.y = y;
    }
    get pos() {
        return {
            x: this.x,
            y: this.y
        };
    }
    set pos(vector2) {
        this.x = vector2.x;
        this.y = vector2.y;
    }
    copy() {
        return new RectBody(this.x, this.y, this.width, this.height);
    }
    move(...args) {
        if (typeof args[0] == 'object') {
            this.x += args[0].x;
            this.y += args[0].y;
        }
        else if (typeof args[0] === 'number' && typeof args[1] === 'number') {
            this.x += args[0];
            this.y += args[1];
        }
        return this;
    }
}
/**
 * @deprecated
 * Moved to RectangleUtil.contains
 */
RectBody.contains = RectangleUtil.contains;
/**
 * @deprecated
 * Moved to RectangleUtil.centerChild
 */
RectBody.centered = RectangleUtil.centerChild;
class Bound {
    static toPositionalRect(bound) {
        const [x1, y1, x2, y2] = bound;
        const x = Math.min(x1, x2); // Get the minimum x-coordinate as the top-left corner x
        const y = Math.min(y1, y2); // Get the minimum y-coordinate as the top-left corner y
        const w = Math.abs(x2 - x1); // Calculate the width as the absolute difference between x2 and x1
        const h = Math.abs(y2 - y1); // Calculate the height as the absolute difference between y2 and y1
        return new RectBody(x, y, w, h);
    }
    constructor(x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
        this.positions = [0, 0, 0, 0];
        this.positions = [x1, y1, x2, y2];
    }
    clear() {
        this.positions = [0, 0, 0, 0];
    }
    set(...items) {
        if (Array.isArray(items) != true)
            return;
        this.clear();
        items
            .slice(0, 4)
            .map((n, index) => {
            this.positions[index] = typeof n === 'number' ? n : 0;
        });
    }
    toRect() {
        return Bound.toPositionalRect(this);
    }
    get valid() {
        return this.positions.some(n => typeof n !== 'number') != true;
    }
    *[Symbol.iterator]() {
        for (const p of this.positions)
            yield p;
    }
}

var shapes = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Bound: Bound,
    RectBody: RectBody,
    RectangleUtil: RectangleUtil
});

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

const rerenderCanvas = new BrushCanvas({
    inputCanvas: document.createElement("canvas"),
});
const { chainable } = rerenderCanvas;
function responseToImageUrl(response) {
    return __awaiter(this, void 0, void 0, function* () {
        if (response.ok != true) {
            throw new Error("Network response was not ok");
        }
        /** Read the response as a Blob */
        const blob = yield response.blob();
        /** Create an object URL from the Blob */
        return URL.createObjectURL(blob);
    });
}
class Spritesheet {
    constructor(options) {
        var _a, _b;
        this.loaded = false;
        this.sprite = new Image();
        if (typeof options != "object") {
            throw console.log("Bad spritesheet", options);
        }
        else if (typeof (options === null || options === void 0 ? void 0 : options.url) !== "string") {
            throw console.log("Bad spritesheet url", options);
        }
        else if (typeof (options === null || options === void 0 ? void 0 : options.url) !== "string") {
            throw console.log("Bad spritesheet url", options);
        }
        else if (typeof (options === null || options === void 0 ? void 0 : options.config) !== "object") {
            throw console.log("Bad config", options);
        }
        else if (typeof ((_a = options.config) === null || _a === void 0 ? void 0 : _a.fileName) !== "string") {
            throw console.log("[spritesheet.config] Invalid fileName", options);
        }
        else if (typeof ((_b = options.config) === null || _b === void 0 ? void 0 : _b.sprites) !== "object") {
            throw console.log("[spritesheet.config] Invalid sprites type", options);
        }
        let index = 0;
        for (const [spriteUrl, spriteCfg] of Object.entries(options.config.sprites)) {
            let i = index++;
            if (typeof spriteUrl !== "string") {
                throw console.log(`[spritesheet.sprites]: I:(${i}) Bad sprite url`, [spriteUrl, spriteCfg]);
            }
            else if (typeof spriteCfg !== "object") {
                throw console.log(`[spritesheet.sprites]: I:(${i}) Bad sprite config`, [spriteUrl, spriteCfg]);
            }
        }
        if (options.cache === true) {
            // fetchCached('sprites', options.url)
            fetch(options.url).then((response) => __awaiter(this, void 0, void 0, function* () {
                this.sprite.src = yield responseToImageUrl(response);
                // console.log('CACHE LOADED', options.url);
            }));
        }
        else {
            this.sprite.src = options.url;
        }
        this.id = options.id;
        this.sprite.crossOrigin = "anonymous";
        this.sprite.onload = () => (this.loaded = true);
        this.sprite.onerror = (e) => console.log("failed to load", e, options.url);
        this.config = options.config;
    }
}
class Sprite {
    constructor(image) {
        this.img = image;
    }
}
class BlankSprite extends Sprite {
    constructor() {
        super(new Image());
    }
}
class Sprites {
    static Slice(image, bounds) {
        const result = new Image();
        const g = [
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height,
        ];
        result.src = chainable
            .canvasSize(bounds.width, bounds.height)
            .clear.rendering("source-over")
            .image(image, g)
            .canvas.toDataURL();
        return result;
    }
    constructor(options) {
        this.canvas = new BrushCanvas().chainable;
        /**
         * Host domain and or path
         * it's essentially just a url prefix
         */
        this.host = "";
        this.sprites = new Map();
        this.loading = new Set();
        this.cache = new Map();
        /** Seconds */
        this.cache_duration = 3600; /* 1 hour */
        this.spriteSheets = new Map();
        if (typeof options === "object") {
            if (typeof options.host === "string") {
                this.host = options.host;
            }
            if (typeof options.cacheDuration === "number") {
                this.cache_duration = options.cacheDuration;
            }
        }
    }
    addSpritesheet(spritesheet) {
        if (spritesheet instanceof Spritesheet != true) {
            console.log(spritesheet);
            throw new Error("^ Invalid spritesheet");
        }
        this.spriteSheets.set(spritesheet.id, spritesheet);
    }
    parseUrl(url) {
        if (typeof url == "string" && url.startsWith("/"))
            return this.host + url;
        return url;
    }
    has(url) {
        return this.cache.hasOwnProperty(url);
    }
    get(url, options) {
        url = this.parseUrl(url);
        const cached = this.cache.get(url);
        const result = cached
            ? cached.img
            : this.loadSingle(url, options === null || options === void 0 ? void 0 : options.onLoad).img;
        if (this.has(url))
            result.dispatchEvent(new Event("load"));
        return result;
    }
    loadSingle(url, onLoad) {
        const res = new BlankSprite();
        if (this.loading.has(url)) {
            return res;
        }
        this.loading.add(url);
        res.img.crossOrigin = "anonymous";
        res.img.src = url;
        res.img.addEventListener("load", (url) => {
            this.loading.delete(url);
            if (typeof onLoad !== "function") {
                return;
            }
            const result = onLoad(res.img);
            if (result)
                res.img = result;
        });
        this.cache.set(url, res);
        return res;
    }
    fromCache(url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.sprites.has(url)) {
                return this.sprites.get(url);
            }
            /** From spritesheet */
            for (const sheet of Array.from(this.spriteSheets.values())) {
                if (sheet.config.sprites.hasOwnProperty(url) != true) {
                    continue;
                }
                if (sheet.loaded !== true) {
                    yield new Promise((resolve) => setTimeout(resolve, 500));
                    return yield this.fromCache(url);
                }
                const cached = this.cache.get(url);
                if (cached != null) {
                    return cached.img;
                }
                const opts = sheet.config.sprites[url];
                const img = Sprites.Slice(sheet.sprite, opts);
                const sprite = new Sprite(img);
                this.cache.set(url, sprite);
                return sprite.img;
            }
            /** Return promise loop if in queue */
            if (this.loading.has(url)) {
                yield new Promise((resolve) => setTimeout(resolve, 500));
                return yield this.fromCache(url);
            }
            /** Load new */
            return yield this.promise(url);
        });
    }
    loadSinglePromise(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const sprite = new BlankSprite();
            sprite.img.crossOrigin = "anonymous";
            sprite.img.src = url;
            return new Promise((resolve) => {
                sprite.img.onload = () => {
                    this.cache.set(url, sprite);
                    resolve(sprite.img);
                };
                sprite.img.onerror = (err) => {
                    resolve(sprite.img);
                    console.log("file: ", [url], "is messed up", err);
                };
            });
        });
    }
    promise(url) {
        return __awaiter(this, void 0, void 0, function* () {
            url = this.parseUrl(url);
            const cached = this.cache.get(url);
            return cached ? cached.img : yield this.loadSinglePromise(url);
        });
    }
}

var symbols = /*#__PURE__*/Object.freeze({
    __proto__: null
});

export { symbols as Action, boxes as BoxUtil, BrushCanvas, ChainableCanvas, Collision, colorImage as ColorImage, Cursor, index as ECS, Engine, Gamepads, InputMap, Keyboard, LegacyEntity, LegacySystem, Repeater, shapes as Shapes, Sprites, Spritesheet };
