import type { ECS } from './ecs.js';
import type { Entity } from './entity.js';

export abstract class System {
	private static count = 0;

	public readonly id: number;
	public readonly ecs: ECS;
	public priority: number = 1;

	public abstract componentsRequired: Set<Function>;
	public readonly dirtyComponents: Set<Function> = new Set();

	constructor(ecs: ECS) {
		this.id = System.count++;
		this.ecs = ecs;
	}

	abstract update(entities: Set<Entity>, dirty: Set<Entity>): void;
}