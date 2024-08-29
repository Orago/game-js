"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderingSystem = exports.Renderable = void 0;
const component_js_1 = require("../ecs/component.js");
const system_js_1 = require("../ecs/system.js");
class Renderable extends component_js_1.Component {
    constructor(callback) {
        super();
        this.callback = callback;
        this.callback = callback;
    }
}
exports.Renderable = Renderable;
class RenderingSystem extends system_js_1.System {
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
exports.RenderingSystem = RenderingSystem;
