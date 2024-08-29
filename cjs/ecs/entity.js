"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = exports.ComponentContainer = void 0;
const component_js_1 = require("./component.js");
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
exports.ComponentContainer = ComponentContainer;
class Entity {
    constructor(ecs) {
        this.ecs = ecs;
        this.components = new ComponentContainer();
        this.id = Entity.count++;
        this.ecs = ecs;
    }
    add() { this.ecs.addEntity(this); }
    remove() { this.ecs.removeEntity(this); }
    addComponent(component) {
        this.components.add(component);
        // Let Component signal ECS when it gets dirty.
        component.signal = () => this.ecs.__componentDirty(this, component);
        this.ecs.__checkE(this);
        // Initial dirty signal to broadcast to interested Systems so
        // that it gets a first update.
        component.signal();
    }
    removeComponent(componentClass) {
        if (componentClass instanceof component_js_1.Component)
            this.components.delete(component_js_1.Component.constructor);
        else
            this.components.delete(componentClass);
        this.ecs.__checkE(this);
    }
}
exports.Entity = Entity;
Entity.Components = ComponentContainer;
Entity.count = 0;
