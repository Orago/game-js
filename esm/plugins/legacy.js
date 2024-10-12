import Emitter from '@orago/lib/emitter';
import { Entity, System, Component, } from '@orago/ecs';
class LegacySignature extends Component {
}
;
const sig = new LegacySignature();
export class LegacySystem extends System {
    constructor(ecs, world) {
        super(ecs);
        this.world = world;
        this.componentsRequired = new Set([LegacySignature]);
        this.world = world;
    }
    update(entities) {
        for (const entity of Array.from(entities).sort((a, b) => a.priority - b.priority)) {
            entity.events.emit('update');
            entity.events.emit('render');
        }
    }
}
export class LegacyEntity extends Entity {
    constructor(ecs) {
        super(ecs);
        this.events = new Emitter();
        this.priority = 0;
        this.addComponent(sig);
    }
    ref(fn) {
        fn.bind(this)(this);
        return this;
    }
    tick() {
        this.events.emit('update');
        this.events.emit('render');
    }
}
