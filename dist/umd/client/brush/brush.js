var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@orago/lib/emitter", "./chainable-canvas.js", "./render.js", "./chainable-canvas.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChainableCanvas = void 0;
    const emitter_1 = __importDefault(require("@orago/lib/emitter"));
    const chainable_canvas_js_1 = require("./chainable-canvas.js");
    const render_js_1 = require("./render.js");
    // import { WebGLCanvas } from "./webgl-2d.js";
    var chainable_canvas_js_2 = require("./chainable-canvas.js");
    Object.defineProperty(exports, "ChainableCanvas", { enumerable: true, get: function () { return chainable_canvas_js_2.ChainableCanvas; } });
    class BrushCanvas {
        constructor(settings = {}) {
            this.resolution = 1;
            this.smoothing = true;
            this.ctx = undefined;
            this.events = new emitter_1.default();
            this.experimental = false;
            /**
             * Toggles smoothing
             * ON - blurred when using low resolution assets and smooth on high resolution
             * OFF - Crisp on low resolution assets and jagged on high resolution
             */
            this.setSmoothing = (state) => {
                if (this.experimental)
                    return this;
                this.ctx.imageSmoothingEnabled = this.smoothing = state == true;
                return this;
            };
            if (typeof settings != "object")
                settings = {};
            const { dimensions = [100, 100], inputCanvas: canvas = document.createElement("canvas"), } = settings;
            canvas.width = dimensions[0];
            canvas.height = dimensions[1];
            this.canvas = canvas;
            if ((settings === null || settings === void 0 ? void 0 : settings.experimental_gl) == true) {
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
            render_js_1.CanvasRender.Image(this.ctx, image, from, to);
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
        resizable() {
            const resize = () => {
                const { canvas, setSmoothing } = this;
                const { documentElement: dE } = document;
                if (canvas instanceof HTMLCanvasElement &&
                    document.body.contains(canvas)) {
                    canvas.style.width = `${100 * this.resolution}%`;
                    canvas.style.height = `${100 * this.resolution}%`;
                }
                canvas.width = dE.clientWidth * this.resolution;
                canvas.height = dE.clientHeight * this.resolution;
                setSmoothing(false);
                this.events.emit("resize", canvas.width, canvas.height);
            };
            if ("addEventListener" in window)
                window.addEventListener("resize", resize);
            resize();
            return this;
        }
        get get() {
            return this;
        }
        get chainable() {
            return new chainable_canvas_js_1.ChainableCanvas(this);
        }
    }
    exports.default = BrushCanvas;
});
