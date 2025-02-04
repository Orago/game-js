"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderingSystem = exports.Renderable = void 0;
const ecs_1 = require("@orago/ecs");
class Renderable extends ecs_1.Component {
    constructor(callback) {
        super();
        this.callback = callback;
        this.callback = callback;
    }
}
exports.Renderable = Renderable;
class RenderingSystem extends ecs_1.System {
    constructor() {
        super(...arguments);
        this.componentsRequired = new Set([Renderable]);
        this.dirtyComponents = new Set([Renderable]);
    }
    update(entities) {
        for (const entity of entities)
            entity
                .components
                .get(Renderable)
                .callback();
    }
}
exports.RenderingSystem = RenderingSystem;
