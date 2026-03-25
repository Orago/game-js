"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainableCanvas = void 0;
const emitter_1 = __importStar(require("@orago/lib/emitter"));
const chainable_canvas_js_1 = require("./chainable-canvas.js");
const etch_js_1 = require("./etch.js");
const render_js_1 = require("./render.js");
var chainable_canvas_js_2 = require("./chainable-canvas.js");
Object.defineProperty(exports, "ChainableCanvas", { enumerable: true, get: function () { return chainable_canvas_js_2.ChainableCanvas; } });
class BrushCanvas {
    resolution = 1;
    smoothing = true;
    /**
     * Both are intentionally unset and will be set using BrushCanvas.swapCanvas
     */
    canvas;
    ctx = undefined;
    events = new emitter_1.default();
    experimental = false;
    onResize = new emitter_1.Signal();
    constructor(settings = {}) {
        if (typeof settings != "object")
            settings = {};
        const { dimensions = [100, 100], inputCanvas: canvas = document.createElement("canvas"), } = settings;
        canvas.width = dimensions[0];
        canvas.height = dimensions[1];
        this.onResize.on((width, height) => {
            this.events.emit("resize", width, height);
        });
        this.canvas = canvas;
        if (settings?.experimental_gl == true) {
            this.experimental = true;
            // WebGLCanvas.affect(canvas);
            const ctx = this.canvas.getContext("webgl-2d");
            this.ctx = ctx;
        }
        const ctx = this.canvas.getContext("2d");
        this.ctx = ctx;
        if (Array.isArray(dimensions))
            this.updateSize(...dimensions);
    }
    updateResolution(resolution) {
        // const amount = ForceType.Number(resolution);
        // this.resolution = clamp(amount, { min: .5, max: 1 });
    }
    updateSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.events.emit("resize", width, height);
        this.setSmoothing(this.smoothing);
    }
    center() {
        return { x: this.width / 2, y: this.height / 2 };
    }
    dimensions() {
        return { width: this.width, height: this.height };
    }
    /**
     * Makes brush the active dom element
     */
    focus() {
        if (this.canvas)
            this.canvas.focus();
    }
    get width() {
        return this.canvas.width;
    }
    get height() {
        return this.canvas.height;
    }
    /**
     * @deprecated
     */
    forceDimensions({ width, height }) {
        if (typeof width == "number" && this.canvas.width != width)
            this.canvas.width = width;
        if (typeof height == "number" && this.canvas.height != height)
            this.canvas.height = height;
    }
    image(image, from, to) {
        render_js_1.CanvasRender.Image(this.ctx, image, { from, to });
        return this;
    }
    text(values) {
        if (this.ctx instanceof CanvasRenderingContext2D != true)
            return;
        let { text, color, x = 0, y = 0, font, weight, size } = values;
        x |= 0;
        y |= 0;
        this.chainable
            .generatedFont({
            font,
            weight,
            size,
        })
            .color(color)
            .pos(x, y)
            .text(text);
    }
    shape(values) {
        if (this.ctx instanceof CanvasRenderingContext2D != true)
            return;
        let { color = "pink", x = 0, y = 0, w = 0, h = 0 } = values;
        x |= 0;
        y |= 0;
        w |= 0;
        h |= 0;
        this.chainable.color(color).size(w, h).pos(x, y).rect;
    }
    circle(values) {
        render_js_1.CanvasRender.circle(this.ctx, values);
    }
    gradient({ shape = "square", percent: { w: percentW = 0, h: percentH = 0 } = {}, colorStart = "black", colorEnd = "white", x = 0, y = 0, w = 0, h = 0, radius = 0.5, } = {}) {
        if (this.ctx instanceof CanvasRenderingContext2D != true)
            return;
        const { ctx } = this;
        const [gx, gy] = [x + w * percentW, y + h * percentH];
        let gradient;
        if (shape == "radial")
            gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * radius);
        else
            gradient = ctx.createLinearGradient(gx, gy, x + w, y + h);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);
    }
    /**
     * Please use EtchUtility.getTextWidth
     * @deprecated
     */
    getTextWidth(values) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx)
            ctx.font = "";
        if (typeof values.font === "string" ||
            typeof values.size === "number") {
            this.text({
                color: "white",
                font: values.font || "Tahoma",
                size: values.size || 20,
                text: "",
                x: -10000,
                y: -10000,
            });
        }
        return this.ctx.measureText(values.text).width;
    }
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        return this;
    }
    clearRect(x, y, width, height) {
        this.ctx.clearRect(x, y, width, height);
        return this;
    }
    /**
     * Toggles smoothing
     * ON - blurred when using low resolution assets and smooth on high resolution
     * OFF - Crisp on low resolution assets and jagged on high resolution
     */
    setSmoothing = (state) => {
        if (this.experimental)
            return this;
        this.ctx.imageSmoothingEnabled = this.smoothing = state == true;
        return this;
    };
    resizable() {
        etch_js_1.EtchUtility.resizable({
            canvas: this.canvas,
            setSmoothing: this.setSmoothing.bind(this),
            resolution: this.resolution,
            onResize: this.onResize,
        });
        return this;
    }
    getEtch(options) {
        return new etch_js_1.Etch({
            canvas: this.canvas,
            ctx: this.ctx,
            stack: options?.stack ?? true,
        });
    }
    get get() {
        return this;
    }
    get chainable() {
        return new chainable_canvas_js_1.ChainableCanvas(this);
    }
}
exports.default = BrushCanvas;
//# sourceMappingURL=brush.js.map