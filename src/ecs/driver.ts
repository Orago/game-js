// Built off 
// https://maxwellforbes.com/posts/typescript-ecs-systems/
import { Component } from './component.js';
import { ComponentContainer, Entity } from './entity.js';
import { System } from './system.js';


/**
 * The ECS is the main driver; it's the backbone of the engine that
 * coordinates Entities, Components, and Systems. You could have a single
 * one for your game, or make a different one for every level, or have
 * multiple for different purposes.
 */
export class ECS {
	// Main state
	private entities = new Set<Entity>();
	private systems = new Map<System, Set<Entity>>()

	// Bookkeeping for entities.
	// private nextEntityID = 0
	private entitiesToDestroy = new Array<Entity>()

	// Dirty Component optimization.
	private dirtySystemsCare = new Map<Function, Set<System>>()
	private dirtyEntities = new Map<System, Set<Entity>>()

	// API: Entities

	public addEntity(entity: Entity) {
		this.entities.add(entity);
	}

	// public addEntity(): Entity {
	// 	let entity = this.nextEntityID;
	// 	this.nextEntityID++;
	// 	this.entities.set(entity, new ComponentContainer());
	// 	return entity;
	// }

	/**
	 * Marks `entity` for removal. The actual removal happens at the end
	 * of the next `update()`. This way we avoid subtle bugs where an
	 * Entity is removed mid-`update()`, with some Systems seeing it and
	 * others not.
	 */
	public removeEntity(entity: Entity): void {
		this.entitiesToDestroy.push(entity);
	}

	// API: Components

	public addComponent(entity: Entity, component: Component): void {
		entity.components.add(component);
		//! this.entities.get(entity)?.add(component);

		// Let Component signal ECS when it gets dirty.
		component.signal = () => {
			this.componentDirty(entity, component);
		}

		this.checkE(entity);

		// Initial dirty signal to broadcast to interested Systems so
		// that it gets a first update.
		component.signal();
	}

	public getComponents(entity: Entity): ComponentContainer | undefined {
		return entity.components;
		// ! return this.entities.get(entity);
	}

	public removeComponent(
		entity: Entity,
		componentClass: Function
	): void {
		entity.components.delete(componentClass);
		// this.entities.get(entity)?.delete(componentClass);
		this.checkE(entity);
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
		// Update all systems. (Later, we'll add a way to specify the
		// update order.)
		for (let [system, entities] of this.systems.entries()) {
			system.update(entities, this.dirtyEntities.get(system) as Set<Entity>);
			this.dirtyEntities.get(system)?.clear();
		}

		// Remove any entities that were marked for deletion during the
		// update.
		while (this.entitiesToDestroy.length > 0) {
			this.destroyEntity(this.entitiesToDestroy.pop() as Entity);
		}
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

	private checkE(entity: Entity): void {
		for (let system of this.systems.keys()) {
			this.checkES(entity, system);
		}
	}

	private checkES(entity: Entity, system: System): void {
		const need = system.componentsRequired;

		if (entity.components.hasAll(need)) {
			// should be in system
			this.systems.get(system)?.add(entity); // no-op if in
		} else {
			// should not be in system
			this.systems.get(system)?.delete(entity); // no-op if out
		}
	}

	private componentDirty(entity: Entity, component: Component): void {
		const got = this.dirtySystemsCare.get(component.constructor);

		// For all systems that care about this Component becoming
		// dirty, tell them, but only if they're actually tracking
		// this Entity.
		if (got?.size == null)
			return;

		for (let system of got) {
			if (this.systems.get(system)?.has(entity)) {
				this.dirtyEntities.get(system)?.add(entity);
			}
		}
	}
}
