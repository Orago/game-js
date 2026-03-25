import { Component, Entity, System } from "@orago/ecs";
import Emitter from "@orago/lib/emitter";
class LegacySignature extends Component {
}
const sig = new LegacySignature();
export class LegacySystem extends System {
    world;
    components = new Set([LegacySignature]);
    constructor(ecs, world) {
        super();
        this.world = world;
        this.world = world;
    }
    update(entities) {
        for (const entity of Array.from(entities).sort((a, b) => a.priority - b.priority)) {
            entity.events.emit("update").emit("render");
        }
    }
}
export class LegacyEntity extends Entity {
    events = new Emitter();
    priority = 0;
    constructor(ecs) {
        super();
        ecs.components.add(this, sig);
    }
    ref(fn) {
        fn.bind(this)(this);
        return this;
    }
    tick() {
        this.events.emit("update");
        this.events.emit("render");
    }
}
//# sourceMappingURL=legacy.js.map