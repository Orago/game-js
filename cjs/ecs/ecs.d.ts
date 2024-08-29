import type { Component } from './component.js';
import { Entity } from './entity.js';
import { System } from './system.js';
/**
 * The ECS is the main driver; it's the backbone of the engine that
 * coordinates Entities, Components, and Systems. You could have a single
 * one for your game, or make a different one for every level, or have
 * multiple for different purposes.
 */
export declare class ECS {
    static readonly System: typeof System;
    static readonly Entity: typeof Entity;
    private entities;
    private systems;
    private entitiesToDestroy;
    private systemsToDestroy;
    private dirtySystemsCare;
    private dirtyEntities;
    private priorities;
    addEntity(entity: Entity): void;
    getEntities(): Entity[];
    /**
     * Marks `entity` for removal. The actual removal happens at the end
     * of the next `update()`. This way we avoid subtle bugs where an
     * Entity is removed mid-`update()`, with some Systems seeing it and
     * others not.
     */
    removeEntity(entity: Entity): void;
    killEntities(): void;
    addSystem(system: System): void;
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
    update(): void;
    private destroyEntity;
    private destroySystem;
    __checkE(entity: Entity): void;
    private checkES;
    __componentDirty(entity: Entity, component: Component): void;
}
