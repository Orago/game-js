import { Component } from '../ecs/component.js';
import { System } from '../ecs/system.js';
export class Renderable extends Component {
    constructor(callback) {
        super();
        this.callback = callback;
        this.callback = callback;
    }
}
export class RenderingSystem extends System {
    constructor() {
        super(...arguments);
        this.componentsRequired = new Set([Renderable]);
        this.dirtyComponents = new Set([Renderable]);
    }
    update(entities) {
        for (const entity of entities) {
            const renderable = entity.components.get(Renderable);
            renderable.callback();
        }
    }
}
