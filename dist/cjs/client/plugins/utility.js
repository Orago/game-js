"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineClampPlugin = void 0;
const base_js_1 = require("../base.js");
class EngineClampPlugin extends base_js_1.EnginePlugin {
    rectangle;
    constructor(rectangle) {
        super();
        this.rectangle = rectangle;
        this.rectangle = rectangle;
    }
    onUpdate(engine) {
        this.clamp(engine);
    }
    clamp(engine) {
        const half_w = engine.brush.width / engine.camera.zoom / 2;
        const half_h = engine.brush.height / engine.camera.zoom / 2;
        const camera = engine.camera;
        camera.x = Math.min(Math.max(camera.x, half_w), this.rectangle.width - half_w);
        camera.y = Math.min(Math.max(camera.y, half_h), this.rectangle.height - half_h);
    }
}
exports.EngineClampPlugin = EngineClampPlugin;
//# sourceMappingURL=utility.js.map