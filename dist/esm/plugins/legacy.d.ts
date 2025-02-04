import Emitter from '@orago/lib/emitter';
import { type ECS, Entity, System } from '@orago/ecs';
import Engine from '../engine.js';
export declare class LegacySystem extends System {
    world: Engine;
    componentsRequired: Set<Function>;
    constructor(ecs: ECS, world: Engine);
    update(entities: Set<LegacyEntity>): void;
}
export declare class LegacyEntity extends Entity {
    readonly events: Emitter<{}, false>;
    priority: number;
    constructor(ecs: ECS);
    ref(fn: (arg0: this) => void): this;
    tick(): void;
}
