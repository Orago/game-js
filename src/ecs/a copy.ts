namespace P0d2 {

	/**
	 * An entity is just an ID. This is used to look up its associated
	 * Components.
	 */
	type Entity = number


	/**
	 * A Component is a bundle of state. Each instance of a Component is
	 * associated with a single Entity.
	 *
	 * Components have no API to fulfill.
	 */
	export abstract class Component {
		/**
		 * If a Component wants to support dirty Component optimization, it
		 * manages its own bookkeeping of whether its state has changed,
		 * and calls `dirty()` on itself when it has.
		 */
		public dirty() {
			this.signal();
		}

		/**
		 * Overridden by ECS once it tracks this Component.
		 */
		public signal: () => void = () => { }
	}

	/**
	 * A System cares about a set of Components. It will run on every Entity
	 * that has that set of Components.
	 *
	 * A System must specify two things:
	 *
	 *  (1) The immutable set of Components it needs at compile time. (Its
	 *      immutability isn't enforced by anything but my wrath.) We use the
	 *      type `Function` to refer to a Component's class; i.e., `Position`
	 *      (class) rather than `new Position()` (instance).
	 *
	 *  (2) An update() method for what to do every frame (if anything).
	 */
	export abstract class System {

		/**
		 * Set of Component classes, ALL of which are required before the
		 * system is run on an entity.
		 *
		 * This should be defined at compile time and should never change.
		 */
		public abstract componentsRequired: Set<Function>

		/**
		 * Set of Component classes. If *ANY* of them become dirty, the
		 * System will be given that Entity during its update().
		 * Components here need *not* be tracked by `componentsRequired`.
		 * To make this opt-in, we default this to the empty set.
		 */
		public dirtyComponents: Set<Function> = new Set()

		/**
		 * update() is called on the System every frame.
		 */
		public abstract update(
			entities: Set<Entity>, dirty: Set<Entity>
		): void

		/**
		 * The ECS is given to all Systems. Systems contain most of the game
		 * code, so they need to be able to create, mutate, and destroy
		 * Entities and Components.
		 */
		public ecs?: Driver
	}

	/**
	 * This type is so functions like the ComponentContainer's get(...) will
	 * automatically tell TypeScript the type of the Component returned. In
	 * other words, we can say get(Position) and TypeScript will know that an
	 * instance of Position was returned. This is amazingly helpful.
	 */
	export type ComponentClass<T extends Component> = new (...args: any[]) => T

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
		private map = new Map<Function, Component>()

		public add(component: Component): void {
			this.map.set(component.constructor, component);
		}

		public get<T extends Component>(
			componentClass: ComponentClass<T>
		): T {
			return this.map.get(componentClass) as T;
		}

		public has(componentClass: Function): boolean {
			return this.map.has(componentClass);
		}

		public hasAll(componentClasses: Iterable<Function>): boolean {
			for (let cls of componentClasses) {
				if (!this.map.has(cls)) {
					return false;
				}
			}
			return true;
		}

		public delete(componentClass: Function): void {
			this.map.delete(componentClass);
		}
	}

	/**
	 * The ECS is the main driver; it's the backbone of the engine that
	 * coordinates Entities, Components, and Systems. You could have a single
	 * one for your game, or make a different one for every level, or have
	 * multiple for different purposes.
	 */
	export class Driver {
		// Main state
		private entities = new Map<Entity, ComponentContainer>()
		private systems = new Map<System, Set<Entity>>()

		// Bookkeeping for entities.
		private nextEntityID = 0
		private entitiesToDestroy = new Array<Entity>()

		// Dirty Component optimization.
		private dirtySystemsCare = new Map<Function, Set<System>>()
		private dirtyEntities = new Map<System, Set<Entity>>()

		// API: Entities

		public addEntity(): Entity {
			let entity = this.nextEntityID;
			this.nextEntityID++;
			this.entities.set(entity, new ComponentContainer());
			return entity;
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

		// API: Components

		public addComponent(entity: Entity, component: Component): void {
			this.entities.get(entity)?.add(component);

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
			return this.entities.get(entity);
		}

		public removeComponent(
			entity: Entity, componentClass: Function
		): void {
			this.entities.get(entity)?.delete(componentClass);
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
			system.ecs = this;

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
				system.update(entities, this.dirtyEntities.get(system) as Set<number>);
				this.dirtyEntities.get(system)?.clear();
			}

			// Remove any entities that were marked for deletion during the
			// update.
			while (this.entitiesToDestroy.length > 0) {
				this.destroyEntity(this.entitiesToDestroy.pop() as number);
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
			let have = this.entities.get(entity);
			let need = system.componentsRequired;
			if (have?.hasAll(need)) {
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

	// ---
	// Demo Component / System and little testing function below.
	// ---

	class Health extends Component {
		constructor(private _maximum: number, private _current: number) {
			super();
		}

		public get current(): number {
			return this._current
		}
		public set current(value: number) {
			this._current = value;
			this.dirty();
		}
		public get maximum(): number {
			return this._maximum
		}
		public set maximum(value: number) {
			this._maximum = value;
			this.dirty();
		}
	}

	class LatestHealthLogger extends System {
		componentsRequired = new Set<Function>([Health]);
		dirtyComponents = new Set<Function>([Health]);

		update(entities: Set<Entity>, dirty: Set<Entity>): void {
			for (let entity of dirty) {
				let health = this.ecs?.getComponents(entity)?.get(Health);

				console.log(health?.current + "/" + health?.maximum);
			}
		}
	}

	function main(): void {
		let ecs = new Driver();
		ecs.addSystem(new LatestHealthLogger());

		let entity = ecs.addEntity();
		let health = new Health(10, 10);
		ecs.addComponent(entity, health);

		ecs.update(); // should print "10/10" (Component starts dirty)
		ecs.update(); // should not print anything
		health.current = 8;
		ecs.update(); // should print "8/10"
		ecs.update(); // should not print anything
	}
	main();
}