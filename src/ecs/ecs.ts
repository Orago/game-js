// Built off 
// https://maxwellforbes.com/posts/typescript-ecs-systems/
import type { Component } from './component.js';
import { Entity } from './entity.js';
import { System } from './system.js';

/**
 * The ECS is the main driver; it's the backbone of the engine that
 * coordinates Entities, Components, and Systems. You could have a single
 * one for your game, or make a different one for every level, or have
 * multiple for different purposes.
 */
export class ECS {
	static readonly System = System;
	static readonly Entity = Entity;

	// Main state
	private entities = new Set<Entity>();
	private systems = new Map<System, Set<Entity>>();

	// Bookkeeping for entities.
	// private nextEntityID = 0
	private entitiesToDestroy = new Array<Entity>();
	private systemsToDestroy = new Array<System>();

	// Dirty Component optimization.
	private dirtySystemsCare = new Map<Function, Set<System>>();
	private dirtyEntities = new Map<System, Set<Entity>>();
	private priorities: System[] = [];

	// API: Entities
	public addEntity(entity: Entity): void {
		this.entities.add(entity);
		this.__checkE(entity);
	}

	public getEntities(): Entity[] {
		return Array.from(
			new Set([
				...Array
					.from(this.entities)
					.map(e => e),

				...Array
					.from(this.systems.values())
					.map(e => Array.from(e)).flat()
			])
		);
	}

	/**
	 * Marks `entity` for removal. The actual removal happens at the end
	 * of the next `update()`. This way we avoid subtle bugs where an
	 * Entity is removed mid-`update()`, with some Systems seeing it and
	 * others not.
	 */
	public removeEntity(entity: Entity): void {
		this.entitiesToDestroy.push(entity);
	}

	public killEntities() {
		this.entitiesToDestroy = this.getEntities();
	}

	// API: Systems
	public addSystem(system: System): void {
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

			this.dirtySystemsCare.get(c)?.add(system);
		}

		this.dirtyEntities.set(system, new Set());

		// (a) Make a sorted list for calling updates in order.
		this.priorities = Array.from(
			(new Set(this.priorities)).add(system)
		);

		// Yes, you actually need a custom sorting function for numbers.
		this.priorities.sort((a: System, b: System) => a.priority - b.priority);
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
	public update(): void {
		for (const system of this.priorities) {
			const entities = this.systems.get(system) as Set<Entity>;
			system.update(entities, this.dirtyEntities.get(system) as Set<Entity>);
			this.dirtyEntities.get(system)?.clear();
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
			this.destroyEntity(this.entitiesToDestroy.pop() as Entity);

		// Remove any entities that were marked for deletion during the
		// update.
		while (this.systemsToDestroy.length > 0)
			this.destroySystem(this.systemsToDestroy.pop() as System);
	}

	// Private methods for doing internal state checks and mutations.

	private destroyEntity(entity: Entity): void {
		this.entities.delete(entity);

		for (let [system, entities] of this.systems.entries()) {
			// Remove Entity from System (if applicable).
			entities.delete(entity);  // no-op if doesn't have it

			// Remove Entity from dirty list if it was there.
			if (this.dirtyEntities.has(system)) {
				// Again, simply a no-op if it's not in there.
				this.dirtyEntities.get(system)?.delete(entity);
			}
		}
	}

	private destroySystem(system: System) {
		this.systems.delete(system);
	}

	__checkE(entity: Entity): void {
		for (let system of this.systems.keys())
			this.checkES(entity, system);
	}

	private checkES(entity: Entity, system: System): void {
		const need = system.componentsRequired;
		const list = this.systems.get(system);

		if (entity.components.hasAll(need))
			// should be in system
			list?.add(entity); // no-op if in

		else
			// should not be in system
			list?.delete(entity); // no-op if out
	}

	__componentDirty(entity: Entity, component: Component): void {
		const got = this.dirtySystemsCare.get(component.constructor);

		// For all systems that care about this Component becoming
		// dirty, tell them, but only if they're actually tracking
		// this Entity.
		if (got?.size == null)
			return;

		for (let system of got)
			if (this.systems.get(system)?.has(entity))
				this.dirtyEntities.get(system)?.add(entity);
	}
}
