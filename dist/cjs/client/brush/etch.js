"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EtchUtility = exports.EtchStack = exports.Etch = void 0;
const render_js_1 = require("./render.js");
class EtchStack {
    constructor() {
        this.stack = [];
    }
    static push(instance, stack, state) {
        stack.push(state);
        instance.state = state;
    }
    static pop(instance, stack) {
        if (stack.length > 1) {
            const state = stack.pop();
            if (state != undefined) {
                instance.state = state;
            }
        }
    }
    static init(instance, stack) {
        if (stack == undefined)
            return;
        if (stack instanceof EtchStack) {
            instance.stack = stack;
        }
        else if (stack == true) {
            instance.stack = new EtchStack();
        }
    }
}
exports.EtchStack = EtchStack;
class EtchUtility {
    static resizable(input) {
        const resize = () => {
            const { canvas, setSmoothing } = input;
            const { documentElement: dE } = document;
            if (canvas instanceof HTMLCanvasElement &&
                document.body.contains(canvas)) {
                canvas.style.width = `${100 * input.resolution}%`;
                canvas.style.height = `${100 * input.resolution}%`;
            }
            canvas.width = dE.clientWidth * input.resolution;
            canvas.height = dE.clientHeight * input.resolution;
            setSmoothing(false);
            if (input.onResize != undefined) {
                input.onResize.emit(canvas.width, canvas.height);
            }
        };
        if ("addEventListener" in window) {
            window.addEventListener("resize", resize);
        }
        resize();
    }
    static generateFontString({ font = "Arial", weight = "normal", size = 16, } = {}) {
        return `${weight} ${size}px ${font}`;
    }
    static measureText(ctx, font, text) {
        const previous_font = ctx.font;
        ctx.font = font;
        // restore font
        if (previous_font != font) {
            ctx.font = previous_font;
        }
        return ctx.measureText(text);
    }
    static getTextWidth(ctx, font, text) {
        return _a.measureText(ctx, font, text).width;
    }
}
exports.EtchUtility = EtchUtility;
_a = EtchUtility;
EtchUtility.canvas = document.createElement("canvas");
EtchUtility.ctx = _a.canvas.getContext("2d");
class Etch {
    static identity() {
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            fill: "black",
            smoothing: true,
        };
    }
    static cloneState(state) {
        return {
            x: state.x,
            y: state.y,
            width: state.width,
            height: state.height,
            fill: state.fill,
            smoothing: state.smoothing,
        };
    }
    constructor(brush) {
        this.state = Etch.identity();
        this.canvas = brush.canvas;
        this.ctx = brush.ctx;
        EtchStack.init(this, this.stack);
    }
    asVec() {
        return [
            this.state.x,
            this.state.y,
            this.state.width,
            this.state.height,
        ];
    }
    ref(func) {
        func(this);
        return this;
    }
    //#region //* Selections
    /**
     * Selects a region
     */
    select(x, y, width, height) {
        this.state.x = x;
        this.state.y = y;
        this.state.width = width;
        this.state.height = height;
        return this;
    }
    selectAll() {
        return this.select(0, 0, this.canvas.width, this.canvas.height);
    }
    /**
     * Changes the offset for all etch renders
     */
    position(x, y) {
        return this.select(x, y, this.state.width, this.state.height);
    }
    /**
     * Changes the size for all etch renders
     */
    size(width, height) {
        return this.select(this.state.x, this.state.y, width, height);
    }
    //#endregion
    //#region //* Transform
    rotate(rotation, center = {
        x: this.state.width / 2,
        y: this.state.height / 2,
    }) {
        const state = this.state;
        this.ctx.translate(state.x + center.x, state.y + center.y);
        this.ctx.rotate((rotation * Math.PI) / 180);
        state.x = -center.x;
        state.y = -center.y;
        return this;
    }
    flip(axis) {
        const state = this.state;
        switch (axis) {
            case "x": {
                this.ctx.scale(-1, 1);
                state.x = state.x * -1 - state.width;
                break;
            }
            case "y": {
                this.ctx.scale(1, -1);
                state.y = state.y * -1 - state.height;
                return this;
                break;
            }
        }
        return this;
    }
    opacity(value = undefined) {
        if (value === undefined) {
            return this.ctx.globalAlpha;
        }
        else {
            this.ctx.globalAlpha = value;
            return this;
        }
    }
    //#endregion
    //#region //* Utility
    /** Saves the current canvas state */
    save(list = this.stack) {
        // this.stack.push(new ChainableConfig(this.last_config));
        this.ctx.save();
        if (list != undefined) {
            if (Array.isArray(list)) {
                EtchStack.push(this, list, Etch.cloneState(this.state));
            }
            else {
                EtchStack.push(this, list.stack, Etch.cloneState(this.state));
            }
        }
        return this;
    }
    /** Restores the current canvas state */
    restore(list = this.stack) {
        this.ctx.restore();
        if (list != undefined) {
            if (Array.isArray(list)) {
                EtchStack.pop(this, list);
            }
            else {
                EtchStack.pop(this, list.stack);
            }
        }
        return this;
    }
    textWidth(text) {
        return this.ctx.measureText(text).width;
    }
    getBitmap() {
        return __awaiter(this, void 0, void 0, function* () {
            const s = this.state;
            return createImageBitmap(this.canvas, s.x, s.y, s.width, s.height);
        });
    }
    resizeCanvas(width, height) {
        const smoothing = this.ctx.imageSmoothingEnabled;
        this.canvas.width = width;
        this.canvas.height = height;
        this.size(width, height);
        this.ctx.imageSmoothingEnabled = smoothing;
        return this;
    }
    inside(callback) {
        const ctx = this.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.state.x, this.state.y, this.state.width, this.state.height);
        ctx.clip();
        callback(this);
        ctx.restore();
        return this;
    }
    temp(callback) {
        const state = Etch.cloneState(this.state);
        this.ctx.save();
        callback(this);
        this.ctx.restore();
        this.state = state;
        return this;
    }
    /**
     * Sets global composite operation
     * Default is source-over
     */
    rendering(mode = "source-over") {
        this.ctx.globalCompositeOperation = mode;
        return this;
    }
    smoothing(value = undefined) {
        if (value === undefined) {
            return this.ctx.imageSmoothingEnabled;
        }
        else {
            this.state.smoothing = value;
            this.ctx.imageSmoothingEnabled = value;
            return this;
        }
    }
    color(color) {
        this.ctx.fillStyle = color;
        this.state.fill = color;
        return this;
    }
    //#endregion
    //#region //* Fonts
    font(newFont) {
        this.ctx.font = newFont;
        return this;
    }
    generatedFont({ font = "Arial", weight = "normal", size = 16, } = {}) {
        return this.font(`${weight} ${size}px ${font}`);
    }
    //#endregion
    //#region //* Rendering
    /**
     * Clears selected region
     */
    clear() {
        this.ctx.clearRect(this.state.x, this.state.y, this.state.width, this.state.height);
        return this;
    }
    rectangle(options) {
        const s = this.state;
        this.ctx.fillRect(s.x, s.y, s.width, s.height);
        return this;
    }
    circle(override) {
        const s = this.state;
        render_js_1.CanvasRender.circle(this.ctx, Object.assign({ x: s.x, y: s.y, radius: s.width }, override));
        return this;
    }
    image(image, options
    // from?: VecRectangle,
    // to: VecRectangle = this.asVec()
    ) {
        var _b;
        options = Object.assign({}, options);
        (_b = options.to) !== null && _b !== void 0 ? _b : (options.to = this.asVec());
        render_js_1.CanvasRender.Image(this.ctx, image, options);
        return this;
    }
    /**
     * Renders text
     */
    text(text) {
        const [x, y] = this.asVec();
        render_js_1.CanvasRender.text(this.ctx, text, { x, y });
        return this;
    }
}
exports.Etch = Etch;
Etch.Stack = EtchStack;
Etch.Utility = EtchUtility;
