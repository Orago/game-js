import Emitter from "@orago/lib/emitter";
import { type Ecs, Entity, System, Component } from "@orago/ecs";
import Engine from "../engine.js";
declare class LegacySignature extends Component {
}
export declare class LegacySystem extends System {
    world: Engine;
    components: Set<typeof LegacySignature>;
    constructor(ecs: Ecs, world: Engine);
    update(entities: Set<LegacyEntity>): void;
}
export declare class LegacyEntity extends Entity {
    readonly events: Emitter<{}, false>;
    priority: number;
    constructor(ecs: Ecs);
    ref(fn: (arg0: this) => void): this;
    tick(): void;
}
export {};
