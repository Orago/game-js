import Emitter from '@orago/lib/emitter';
import { type ECS, Entity, System, Component, } from '@orago/ecs';
import Engine from '../engine.js';


class LegacySignature extends Component { };
const sig = new LegacySignature();

export class LegacySystem extends System {
	componentsRequired = new Set<Function>([LegacySignature]);

	constructor(ecs: ECS, public world: Engine) {
		super(ecs);

		this.world = world;
	}

	update(entities: Set<LegacyEntity>): void {
		for (const entity of Array.from(entities).sort((a, b) => a.priority - b.priority)) {
			entity.events.emit('update');
			entity.events.emit('render');
		}
	}
}

export class LegacyEntity extends Entity {
	public readonly events = new Emitter();
	public priority: number = 0;

	constructor(ecs: ECS) {
		super(ecs);

		this.addComponent(sig);
	}

	ref(fn: (arg0: this) => void): this {
		fn.bind(this)(this);

		return this;
	}

	tick() {
		this.events.emit('update');
		this.events.emit('render');
	}
}