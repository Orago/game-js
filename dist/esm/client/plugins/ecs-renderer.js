// import { Component, Entity, System } from "@orago/ecs";
import { Ecs } from "../index.js";
import { Meowtrix, Transform } from "../../util/meowtrix.js";
import { PositionComponent } from "../../ecs/physics.js";
export function getCanvasMatrix(matrix) {
    const a = matrix[0];
    const b = matrix[1];
    const c = matrix[4];
    const d = matrix[5];
    const e = matrix[12];
    const f = matrix[13];
    return [a, b, c, d, e, f];
}
export var RenderType;
(function (RenderType) {
    RenderType[RenderType["TEXT"] = 0] = "TEXT";
    RenderType[RenderType["RECTANGLE"] = 1] = "RECTANGLE";
    RenderType[RenderType["IMAGE"] = 2] = "IMAGE";
})(RenderType || (RenderType = {}));
export class RenderingComponent extends Ecs.Component {
    constructor(visuals) {
        super();
        this.visuals = new Set(visuals);
    }
}
var EngineFlags;
(function (EngineFlags) {
    // ALL = -1,
    EngineFlags[EngineFlags["NONE"] = 0] = "NONE";
    EngineFlags[EngineFlags["OFFSET"] = 1] = "OFFSET";
    EngineFlags[EngineFlags["SCALE"] = 2] = "SCALE";
})(EngineFlags || (EngineFlags = {}));
export class RenderComponent {
    constructor() {
        this.transform = new Transform();
        this.rotation = [0, 0];
        this.scale = [1, 1];
        this.translate = [0, 0, 0];
        this.layer = 1;
        this.engine_flags = 0;
    }
    static makeFlags(flags) {
        let current = EngineFlags.NONE;
        for (const flag of flags) {
            current |= flag;
        }
        return current;
    }
}
RenderComponent.Flags = EngineFlags;
export class TextRenderComponent extends RenderComponent {
    constructor(text, size) {
        super();
        this.text = text;
        this.size = size;
        this.font = "sans-serif";
        this.width = 0;
        this.height = 0;
        this.options = {
            font: "sans-serif",
            size,
            color: "black",
        };
    }
    preloadCanvas() {
        if (this.cache_canvas == undefined) {
            this.cache_canvas = document.createElement("canvas");
            this.cache_ctx = this.cache_canvas.getContext("2d");
        }
        return {
            canvas: this.cache_canvas,
            ctx: this.cache_ctx,
        };
    }
    getTextCache() {
        const key = `${this.text}_${this.size}_${this.options.font}`;
        if (this.cache_canvas && key === this.cache_key) {
            return this.cache_canvas; // Return cached version
        }
        const obj = this.preloadCanvas();
        const canvas = obj.canvas;
        const ctx = obj.ctx;
        const size = this.options.size;
        const font_state = (ctx.font = `${size}px ${this.options.font}`);
        const metrics = ctx.measureText(this.text);
        canvas.width = metrics.width;
        canvas.height = size;
        const y_diff = size * 1.14 - size;
        ctx.font = font_state;
        ctx.fillStyle = this.options.color;
        ctx.fillText(this.text, 0, size - y_diff);
        this.width = canvas.width;
        this.height = canvas.height;
        this.cache_key = key;
        return canvas;
    }
    // Call this if text changes
    updateText(text) {
        if (this.text !== text) {
            this.text = text;
            this.cache_key = undefined; // invalidate cache
        }
    }
}
export class RectangleRenderComponent extends RenderComponent {
    constructor(width, height = width, color) {
        super();
        this.width = width;
        this.height = height;
        this.width = width;
        this.height = height;
        this.color = color;
    }
}
export class ImageRenderComponent extends RenderComponent {
    constructor(image) {
        super();
        this.image = image;
        this.image = image;
    }
}
export class RenderSystem extends Ecs.System {
    constructor(engine) {
        super();
        this.engine = engine;
        this.components = new Set([RenderingComponent]);
        this.clear = true;
        this.canvas = engine.brush.canvas;
        this.ctx = engine.brush.ctx;
    }
    update(entities) {
        const components = [];
        for (const entity of entities) {
            const rendering_component = entity.components.get(RenderingComponent);
            components.push(...rendering_component.visuals);
        }
        this.render(components);
    }
    render(components) {
        components.sort((a, b) => a.layer - b.layer);
        if (this.clear == true) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.ctx.save();
        let last_matrix = null;
        for (const comp of components) {
            let current_matrix = Meowtrix.identity();
            if (comp.engine_flags & EngineFlags.OFFSET) {
                current_matrix = Meowtrix.multiply(current_matrix, Meowtrix.translate(-this.engine.camera.x, -this.engine.camera.y));
            }
            if (comp.engine_flags & EngineFlags.SCALE) {
                current_matrix = Meowtrix.multiply(current_matrix, Meowtrix.scale(this.engine.camera.zoom));
            }
            current_matrix = Meowtrix.multiply(current_matrix, comp.transform.getMatrix());
            const matrix_key = current_matrix.join(",");
            // update matrix when change is noticed
            if (matrix_key !== last_matrix) {
                const new_matrix = getCanvasMatrix(current_matrix);
                this.ctx.setTransform(...new_matrix);
                last_matrix = matrix_key;
            }
            if (comp instanceof RectangleRenderComponent) {
                this.drawRectangle(comp);
            }
            else if (comp instanceof TextRenderComponent) {
                this.drawText(comp);
            }
            else if (comp instanceof ImageRenderComponent) {
                this.drawImage(comp);
            }
        }
        this.ctx.restore();
    }
    drawRectangle(comp) {
        var _a;
        this.ctx.fillStyle = (_a = comp.color) !== null && _a !== void 0 ? _a : "black";
        this.ctx.fillRect(0, 0, comp.width, comp.height);
    }
    drawText(comp) {
        const canvas = comp.getTextCache();
        this.ctx.drawImage(canvas, 0, 0);
    }
    drawImage(comp) {
        var _a, _b;
        const src = (_a = comp.source) !== null && _a !== void 0 ? _a : [0, 0, comp.image.width, comp.image.height];
        const dst = (_b = comp.destination) !== null && _b !== void 0 ? _b : [0, 0, src[2], src[3]];
        if (comp.opacity !== undefined) {
            this.ctx.globalAlpha = comp.opacity;
        }
        this.ctx.drawImage(comp.image, src[0], src[1], src[2], src[3], dst[0], dst[1], dst[2], dst[3]);
        if (comp.opacity !== undefined) {
            this.ctx.globalAlpha = 1;
        }
    }
}
export class RenderParticleGenerator extends Ecs.Component {
    constructor() {
        super();
    }
    generator(callback) { }
}
export class RenderParticleSystem extends Ecs.System {
    constructor() {
        super();
        this.components = new Set([
            PositionComponent,
            RenderParticleGenerator,
        ]);
    }
    update(entities, dirty) { }
}
