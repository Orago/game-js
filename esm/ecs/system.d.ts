import type { ECS } from './ecs.js';
import type { Entity } from './entity.js';
export declare abstract class System {
    private static count;
    readonly id: number;
    readonly ecs: ECS;
    priority: number;
    abstract componentsRequired: Set<Function>;
    readonly dirtyComponents: Set<Function>;
    constructor(ecs: ECS);
    abstract update(entities: Set<Entity>, dirty: Set<Entity>): void;
}
