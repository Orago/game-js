import Emitter from '@orago/lib/emitter';
import type { ECS } from '../ecs/ecs.js';
import { Entity } from '../ecs/entity.js';
import { System } from '../ecs/system.js';
import World from '../engine.js';
export declare class LegacySystem extends System {
    world: World;
    componentsRequired: Set<Function>;
    constructor(ecs: ECS, world: World);
    update(entities: Set<LegacyEntity>): void;
}
export declare class LegacyEntity extends Entity {
    readonly events: Emitter;
    priority: number;
    constructor(ecs: ECS);
    ref(fn: (arg0: this) => void): this;
    tick(): void;
}
