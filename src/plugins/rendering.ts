import { type Entity, Component, System } from '@orago/ecs';

export class Renderable extends Component {
	constructor(public callback: () => void) {
		super();
		this.callback = callback;
	}
}

export class RenderingSystem extends System {
	componentsRequired = new Set<Function>([Renderable]);
	dirtyComponents = new Set<Function>([Renderable]);

	update(entities: Set<Entity>): void {
		for (const entity of entities) {
			const renderable = entity.components.get(Renderable);

			renderable.callback();
		}
	}
}