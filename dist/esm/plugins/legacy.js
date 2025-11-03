import Emitter from "@orago/lib/emitter";
import { Entity, System, Component } from "@orago/ecs";
class LegacySignature extends Component {
}
const sig = new LegacySignature();
export class LegacySystem extends System {
    constructor(ecs, world) {
        super();
        this.world = world;
        this.components = new Set([LegacySignature]);
        this.world = world;
    }
    update(entities) {
        for (const entity of Array.from(entities).sort((a, b) => a.priority - b.priority)) {
            entity.events.emit("update").emit("render");
        }
    }
}
export class LegacyEntity extends Entity {
    constructor(ecs) {
        super();
        this.events = new Emitter();
        this.priority = 0;
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
