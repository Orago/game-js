import { Component, type Ecs, Entity, System } from "@orago/ecs";
import Emitter from "@orago/lib/emitter";
import Engine from "../engine.js";

class LegacySignature extends Component {}
const sig = new LegacySignature();

export class LegacySystem extends System {
	public components = new Set([LegacySignature]);

	constructor(ecs: Ecs, public world: Engine) {
		super();

		this.world = world;
	}

	public update(entities: Set<LegacyEntity>): void {
		for (const entity of Array.from(entities).sort(
			(a, b) => a.priority - b.priority
		)) {
			entity.events.emit("update").emit("render");
		}
	}
}

export class LegacyEntity extends Entity {
	public readonly events = new Emitter();
	public priority: number = 0;

	constructor(ecs: Ecs) {
		super();

		ecs.components.add(this, sig);
	}

	public ref(fn: (arg0: this) => void): this {
		fn.bind(this)(this);

		return this;
	}

	public tick() {
		this.events.emit("update");
		this.events.emit("render");
	}
}
