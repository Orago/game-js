import { Entity } from './entity.js';
import { System } from './system.js';
/**
 * The ECS is the main driver; it's the backbone of the engine that
 * coordinates Entities, Components, and Systems. You could have a single
 * one for your game, or make a different one for every level, or have
 * multiple for different purposes.
 */
export class ECS {
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
            if (!this.dirtySystemsCare.has(c)) {
                this.dirtySystemsCare.set(c, new Set());
            }
            (_a = this.dirtySystemsCare.get(c)) === null || _a === void 0 ? void 0 : _a.add(system);
        }
        this.dirtyEntities.set(system, new Set());
        // (a) Make a sorted list for calling updates in order.
        this.priorities = Array.from((new Set(this.priorities)).add(system));
        // Yes, you actually need a custom sorting function for numbers.
        this.priorities.sort((a, b) => a.priority - b.priority);
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
