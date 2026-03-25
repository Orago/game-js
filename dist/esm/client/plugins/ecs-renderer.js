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
    visuals;
    constructor(visuals) {
        super();
        this.visuals = new Set(visuals);
    }
}
var RenderComponentFlagNames;
(function (RenderComponentFlagNames) {
    RenderComponentFlagNames["NONE"] = "NONE";
    RenderComponentFlagNames["ENGINE_OFFSET"] = "ENGINE_OFFSET";
    RenderComponentFlagNames["ENGINE_SCALE"] = "ENGINE_SCALE";
    RenderComponentFlagNames["POSITION"] = "POSITION";
})(RenderComponentFlagNames || (RenderComponentFlagNames = {}));
export class RenderComponent {
    static Flags = {
        [RenderComponentFlagNames.NONE]: 0,
        [RenderComponentFlagNames.ENGINE_OFFSET]: 1 << 0,
        [RenderComponentFlagNames.ENGINE_SCALE]: 1 << 1,
        [RenderComponentFlagNames.POSITION]: 1 << 2,
    };
    static isValidFlag(name) {
        return (RenderComponent.Flags[name] !=
            undefined);
    }
    static makeFlags(flags) {
        let current = RenderComponent.Flags.NONE;
        if (flags == "all") {
            return -1;
        }
        switch (typeof flags) {
            case "number": {
                return flags;
            }
            case "function": {
                return this.makeFlags(flags(RenderComponentFlagNames));
            }
            case "object": {
                if (Array.isArray(flags)) {
                    for (const flag of flags) {
                        const flag_value = RenderComponent.Flags[flag];
                        if (typeof flag == "string" &&
                            flag_value != undefined) {
                            current |= flag_value;
                        }
                    }
                }
                return current;
            }
            default: {
                return current;
            }
        }
    }
    transform = new Transform();
    // rotation: [x: number, y: number] = [0, 0];
    // scale: [x: number, y: number] = [1, 1];
    // translate: [x: number, y: number, z: number] = [0, 0, 0];
    layer = 1;
    flags = 0;
    constructor(options) {
        if (options != undefined) {
            this.update(options);
        }
    }
    setFlags(flags) {
        this.flags = RenderComponent.makeFlags(flags);
    }
    update(options) {
        if (options?.layer != undefined) {
            this.layer = options.layer;
        }
        if (options?.flags != undefined) {
            this.flags = RenderComponent.makeFlags(options.flags);
        }
        if (options?.transform != undefined) {
            this.transform = new Transform();
            options.transform(this.transform);
        }
    }
}
export class TextRenderComponent extends RenderComponent {
    text;
    size;
    cache_canvas;
    cache_ctx;
    cache_key;
    font = "sans-serif";
    options;
    width = 0;
    height = 0;
    constructor(text, size, options) {
        super(options);
        this.text = text;
        this.size = size;
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
    width;
    height;
    color;
    constructor(width, height = width, options) {
        super(options);
        this.width = width;
        this.height = height;
        this.width = width;
        this.height = height;
    }
    update(options) {
        super.update(options);
        if (options.color != undefined) {
            this.color = options.color;
        }
    }
}
export class ImageRenderComponent extends RenderComponent {
    image;
    opacity;
    source;
    destination;
    constructor(image) {
        super();
        this.image = image;
        this.image = image;
    }
}
export class RenderSystem extends Ecs.System {
    engine;
    components = new Set([RenderingComponent]);
    clear = true;
    canvas;
    ctx;
    constructor(engine) {
        super();
        this.engine = engine;
        this.canvas = engine.brush.canvas;
        this.ctx = engine.brush.ctx;
    }
    update(entities) {
        const components = [];
        for (const entity of entities) {
            const rendering_component = entity.components.get(RenderingComponent);
            const c_position = entity.components.get(PositionComponent);
            components.push(...Array.from(rendering_component.visuals).map((v) => ({
                render: v,
                entity,
                position: c_position,
            })));
        }
        this.render2(components);
    }
    render2(entities) {
        entities.sort((a, b) => a.render.layer - b.render.layer);
        if (this.clear == true) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.ctx.save();
        let last_matrix = null;
        for (const { render: comp, position } of entities) {
            let current_matrix = Meowtrix.identity();
            if (comp.flags & RenderComponent.Flags.ENGINE_OFFSET) {
                const translated = this.engine.worldToScreen(this.engine.camera);
                current_matrix = Meowtrix.multiply(current_matrix, Meowtrix.translate(-this.engine.camera.x, -this.engine.camera.y));
            }
            if (comp.flags & RenderComponent.Flags.POSITION &&
                position != undefined) {
                current_matrix = Meowtrix.multiply(current_matrix, Meowtrix.translate(position.x, position.y));
            }
            // comp.transform.setPosition(
            // clone.scale = {
            // 	x: comp.transform.scale.x * this.engine.camera.zoom,
            // 	y: comp.transform.scale.y * this.engine.camera.zoom,
            // 	z: comp.transform.scale.z * this.engine.camera.zoom,
            // };
            if (comp.flags & RenderComponent.Flags.ENGINE_SCALE) {
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
    render(components) {
        components.sort((a, b) => a.layer - b.layer);
        if (this.clear == true) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.ctx.save();
        let last_matrix = null;
        for (const comp of components) {
            let current_matrix = Meowtrix.identity();
            if (comp.flags & RenderComponent.Flags.ENGINE_OFFSET) {
                current_matrix = Meowtrix.multiply(current_matrix, Meowtrix.translate(-this.engine.camera.x, -this.engine.camera.y));
            }
            if (comp.flags & RenderComponent.Flags.ENGINE_SCALE) {
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
        this.ctx.fillStyle = comp.color ?? "black";
        this.ctx.fillRect(0, 0, comp.width, comp.height);
    }
    drawText(comp) {
        const canvas = comp.getTextCache();
        this.ctx.drawImage(canvas, 0, 0);
    }
    drawImage(comp) {
        const src = comp.source ?? [0, 0, comp.image.width, comp.image.height];
        const dst = comp.destination ?? [0, 0, src[2], src[3]];
        if (comp.opacity !== undefined) {
            this.ctx.globalAlpha = comp.opacity;
        }
        if (comp.image.width != 0)
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
    components = new Set([
        PositionComponent,
        RenderParticleGenerator,
    ]);
    constructor() {
        super();
    }
    update(entities, dirty) { }
}
//# sourceMappingURL=ecs-renderer.js.map