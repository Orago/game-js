"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainableCanvas = void 0;
const render_js_1 = require("./render.js");
class ChainableConfig {
    constructor(data) {
        this.canvas = document.createElement("canvas");
        this.color = "black";
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.ctx = data.ctx;
        if (data.canvas != null)
            this.canvas = data.canvas;
        if (typeof data.color === "string")
            this.color = data.color;
        if (typeof data.x === "number")
            this.x = data.x;
        if (typeof data.y === "number")
            this.y = data.y;
        if (typeof data.w === "number")
            this.w = data.w;
        if (typeof data.h === "number")
            this.h = data.h;
    }
    get rect() {
        return [this.x, this.y, this.w, this.h];
    }
}
/**
 * ! Should not be used on it"s own
 */
class ChainableCanvas {
    constructor(brush) {
        this.stack = [];
        this.stack.push(new ChainableConfig({
            canvas: brush.canvas,
            ctx: brush.ctx,
        }));
        this.last_config = this.getConfig();
        this.canvas = this.last_config.canvas;
        this.ctx = this.last_config.ctx;
    }
    update_config() {
        this.last_config = this.getConfig();
        this.canvas = this.last_config.canvas;
        this.ctx = this.last_config.ctx;
        return this.last_config;
    }
    getConfig() {
        return this.stack[this.stack.length - 1];
    }
    x(x) {
        this.last_config.x = x;
        return this;
    }
    y(y) {
        this.last_config.y = y;
        return this;
    }
    w(w) {
        this.last_config.w = w;
        return this;
    }
    h(h) {
        this.last_config.h = h;
        return this;
    }
    pos(x, y) {
        const config = this.last_config;
        if (typeof x == "number")
            config.x = x;
        if (typeof y == "number")
            config.y = y;
        return this;
    }
    size(width, height = width) {
        const config = this.last_config;
        if (typeof width == "number")
            config.w = width;
        if (typeof height == "number")
            config.h = height;
        return this;
    }
    // get recentConfig(): ChainableConfig {
    // 	return this.last_config;
    // }
    // getContext() { return this.last_config.ctx; }
    // get canvas() { return this.last_config.canvas; }
    // get ctx() { return this.last_config.ctx; }
    rotate(rotation, center) {
        var _a, _b;
        const config = this.getConfig();
        if (typeof center != "object") {
            center = {
                x: config.w / 2,
                y: config.h / 2,
            };
        }
        (_a = center.x) !== null && _a !== void 0 ? _a : (center.x = config.w / 2);
        (_b = center.y) !== null && _b !== void 0 ? _b : (center.y = config.h / 2);
        this.last_config.ctx.translate(config.x + center.x, config.y + center.y);
        this.last_config.ctx.rotate((rotation * Math.PI) / 180);
        config.x = -center.x;
        config.y = -center.y;
        return this;
    }
    opacity(amount) {
        this.last_config.ctx.globalAlpha = amount;
        return this;
    }
    image(image, fromPos, toPos = this.last_config.rect) {
        render_js_1.CanvasRender.Image(this.last_config.ctx, image, {
            from: fromPos,
            to: toPos,
        });
        return this;
    }
    /**
     * Renders text
     */
    text(text) {
        const [x, y] = this.last_config.rect;
        render_js_1.CanvasRender.text(this.last_config.ctx, text, { x, y });
        return this;
    }
    textWidth(text) {
        return this.last_config.ctx.measureText(text).width;
    }
    circle(override) {
        const [x, y, w] = this.last_config.rect;
        render_js_1.CanvasRender.circle(this.last_config.ctx, Object.assign({ x,
            y, radius: w }, override));
        return this;
    }
    /**
     * Sets global composite operation
     * Default is source-over
     */
    rendering(mode = "source-over") {
        this.last_config.ctx.globalCompositeOperation = mode;
        return this;
    }
    /** Sets color */
    color(color) {
        this.last_config.ctx.fillStyle = color;
        return this;
    }
    font(newFont) {
        this.last_config.ctx.font = newFont;
        return this;
    }
    generatedFont({ font = "Arial", weight = "normal", size = 16, } = {}) {
        return this.font(`${weight} ${size}px ${font}`);
    }
    /** Draws a rect to the screen */
    get rect() {
        this.last_config.ctx.fillRect(...this.last_config.rect);
        return this;
    }
    /** Saves the current canvas state */
    get save() {
        this.last_config.ctx.save();
        this.stack.push(new ChainableConfig(this.last_config));
        this.update_config();
        return this;
    }
    /** Restores the current canvas state */
    get restore() {
        this.last_config.ctx.restore();
        if (this.stack.length > 1)
            this.stack.pop();
        this.update_config();
        return this;
    }
    temp(callback) {
        this.last_config.ctx.save();
        callback(this);
        this.last_config.ctx.restore();
        return this;
    }
    get clear_stack() {
        let context = this;
        while (this.stack.length > 1)
            context = this.restore;
        return context;
    }
    ref(func) {
        func(this);
        return this;
    }
    /**
     * Flips rendering on horizontal axis
     * ! Mutates
     */
    get flipX() {
        const config = this.last_config;
        config.ctx.scale(-1, 1);
        config.x = config.x * -1 - config.w;
        return this;
    }
    /**
     * Flips Y rendering
     * ! Mutates
     */
    get flipY() {
        const config = this.last_config;
        config.ctx.scale(1, -1);
        config.y = config.y * -1 - config.h;
        return this;
    }
    /** Sets canvas size */
    canvasSize(width, height) {
        const smoothing = this.last_config.ctx.imageSmoothingEnabled;
        this.last_config.canvas.width = width;
        this.last_config.canvas.height = height;
        this.size(width, height);
        this.last_config.ctx.imageSmoothingEnabled = smoothing;
        return this;
    }
    /** Clears the canvas */
    get clear() {
        this.last_config.ctx.clearRect(0, 0, this.last_config.canvas.width, this.last_config.canvas.height);
        return this;
    }
    /** Clears cached rect */
    clearRect() {
        this.last_config.ctx.clearRect(...this.last_config.rect);
        return this;
    }
    get url() {
        return this.last_config.canvas.toDataURL();
    }
    temporaryOffset(x, y, callback) {
        const ctx = this.last_config.ctx;
        const _ = ctx.getTransform();
        ctx.setTransform(_.a, _.b, _.c, _.d, _.e + x, _.f + y);
        callback(this);
        ctx.setTransform(_.a, _.b, _.c, _.d, _.e, _.f);
        return this;
    }
    temporaryRotate(args, callback) {
        this.temp((chain) => {
            chain.rotate(...args);
            callback(this);
        });
        return this;
    }
}
exports.ChainableCanvas = ChainableCanvas;
