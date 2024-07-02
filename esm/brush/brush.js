import { CanvasRender } from './render.js';
import { Vector2 } from '@orago/vector';
import Emitter from '@orago/lib/emitter';
class ChainableConfig {
    constructor(data) {
        this.canvas = document.createElement('canvas');
        this.color = 'black';
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.ctx = data.ctx;
        if (data.canvas != null)
            this.canvas = data.canvas;
        if (typeof data.color === 'string')
            this.color = data.color;
        if (typeof data.x === 'number')
            this.x = data.x;
        if (typeof data.y === 'number')
            this.y = data.y;
        if (typeof data.w === 'number')
            this.w = data.w;
        if (typeof data.h === 'number')
            this.h = data.h;
    }
    get rect() {
        return [this.x, this.y, this.w, this.h];
    }
}
export class ChainableCanvas {
    constructor(brush) {
        this.stack = [];
        this.stack.push(new ChainableConfig({
            canvas: brush.canvas,
            ctx: brush.ctx
        }));
    }
    x(x) {
        this.recentConfig.x = x;
        return this;
    }
    y(y) {
        this.recentConfig.y = y;
        return this;
    }
    w(w) {
        this.recentConfig.w = w;
        return this;
    }
    h(h) {
        this.recentConfig.h = h;
        return this;
    }
    pos(x, y) {
        const config = this.recentConfig;
        if (typeof x == 'number') {
            config.x = x;
        }
        if (typeof y == 'number') {
            config.y = y;
        }
        return this;
    }
    size(width, height = width) {
        const config = this.recentConfig;
        if (typeof width == 'number') {
            config.w = width;
        }
        if (typeof height == 'number') {
            config.h = height;
        }
        return this;
    }
    get recentConfig() {
        return this.stack[this.stack.length - 1];
    }
    get canvas() {
        return this.recentConfig.canvas;
    }
    get ctx() {
        return this.recentConfig.ctx;
    }
    rotate(rotation, center) {
        var _a, _b;
        const config = this.recentConfig;
        if (typeof center != 'object') {
            center = {
                x: config.w / 2,
                y: config.h / 2
            };
        }
        (_a = center.x) !== null && _a !== void 0 ? _a : (center.x = config.w / 2);
        (_b = center.y) !== null && _b !== void 0 ? _b : (center.y = config.h / 2);
        this.ctx.translate(config.x + center.x, config.y + center.y);
        this.ctx.rotate(rotation * Math.PI / 180);
        config.x = -center.x;
        config.y = -center.y;
        return this;
    }
    opacity(amount) {
        this.ctx.globalAlpha = amount;
        return this;
    }
    image(image, fromPos, toPos = this.recentConfig.rect) {
        CanvasRender.Image(this.ctx, image, fromPos, toPos);
        return this;
    }
    imageFrom(image, fromPos) {
        CanvasRender.Image(this.ctx, image, this.recentConfig.rect, fromPos);
        return this;
    }
    text(text) {
        const [x, y] = this.recentConfig.rect;
        CanvasRender.text(this.ctx, text, { x, y });
        return this;
    }
    textWidth(text) {
        return this.ctx.measureText(text).width;
    }
    circle(override) {
        const [x, y, w] = this.recentConfig.rect;
        CanvasRender.circle(this.ctx, Object.assign({ x,
            y, radius: w }, override));
        return this;
    }
    rendering(mode = 'source-over') {
        this.ctx.globalCompositeOperation = mode;
        return this;
    }
    color(color) {
        this.ctx.fillStyle = color;
        return this;
    }
    font(newFont) {
        this.ctx.font = newFont;
        return this;
    }
    generatedFont({ font = 'Arial', weight = 'normal', size = 16 } = {}) {
        return this.font(`${weight} ${size}px ${font}`);
    }
    get rect() {
        this.ctx.fillRect(...this.recentConfig.rect);
        return this;
    }
    get blank() {
        const pre = this.recentConfig;
        this.save;
        const config = this.recentConfig;
        config.canvas = document.createElement('canvas');
        config.canvas.width = pre.canvas.width;
        config.canvas.height = pre.canvas.height;
        const gotten = config.canvas.getContext('2d');
        if (gotten != null) {
            config.ctx = gotten;
        }
        return this;
    }
    get merge() {
        const r = this.recentConfig;
        const prev = this.stack[this.stack.length - 1];
        CanvasRender.Image(prev.ctx, r.canvas, undefined, prev.rect);
        return this.restore;
    }
    get save() {
        this.ctx.save();
        this.stack.push(new ChainableConfig(this.recentConfig));
        return this;
    }
    get restore() {
        this.ctx.restore();
        this.stack.pop();
        return this;
    }
    ref(func) {
        func(this);
        return this;
    }
    get flipX() {
        const r = this.recentConfig;
        this.ctx.scale(-1, 1);
        r.x = r.x * -1 - r.w;
        return this;
    }
    get flipY() {
        const r = this.recentConfig;
        this.ctx.scale(1, -1);
        r.y = r.y * -1 - r.h;
        return this;
    }
    canvasSize(width, height) {
        const smoothing = this.ctx.imageSmoothingEnabled;
        this.canvas.width = width;
        this.canvas.height = height;
        this.size(width, height);
        this.ctx.imageSmoothingEnabled = smoothing;
        return this;
    }
    get clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        return this;
    }
    clearRect() {
        this.ctx.clearRect(...this.recentConfig.rect);
        return this;
    }
    get imgUrl() {
        return this.canvas.toDataURL();
    }
}
export default class BrushCanvas {
    constructor(settings = {}) {
        this.resolution = 1;
        this.smoothing = true;
        this.events = new Emitter();
        this.setSmoothing = (state) => {
            this.ctx.imageSmoothingEnabled =
                this.smoothing = (state == true);
            return this;
        };
        if (typeof settings != 'object') {
            settings = {};
        }
        let { dimensions = [100, 100], inputCanvas: canvas = document.createElement('canvas'), resolution = 1 } = settings;
        this.swapCanvas({
            canvas,
            dimensions
        });
        this.updateResolution(resolution);
    }
    updateResolution(resolution) {
    }
    updateSize(width, height) {
        Object.assign(this.canvas, { width, height });
        this.events.emit('resize', width, height);
        this.setSmoothing(this.smoothing);
    }
    swapCanvas({ canvas, ctx, dimensions }) {
        this.canvas = canvas;
        if (ctx instanceof CanvasRenderingContext2D) {
            this.ctx = ctx;
        }
        else if (canvas instanceof HTMLCanvasElement) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                this.ctx = ctx;
            }
        }
        if (Array.isArray(dimensions)) {
            this.updateSize(...dimensions);
        }
    }
    center() {
        return new Vector2(this.width / 2, this.height / 2);
    }
    focus() {
        if (this.canvas instanceof HTMLCanvasElement) {
            this.canvas.focus();
        }
    }
    dimensions() {
        return {
            width: this.width,
            height: this.height
        };
    }
    get width() {
        return this.canvas.width;
    }
    ;
    get height() {
        return this.canvas.height;
    }
    ;
    forceDimensions({ width, height }) {
        if (typeof width == 'number' &&
            this.canvas.width != width) {
            this.canvas.width = width;
        }
        if (typeof height == 'number' &&
            this.canvas.height != height) {
            this.canvas.height = height;
        }
    }
    ;
    image(image, from, to) {
        CanvasRender.Image(this.ctx, image, from, to);
        return this;
    }
    text(values) {
        if (this.ctx instanceof CanvasRenderingContext2D != true)
            return;
        let { text, color, x = 0, y = 0, font, weight, size } = values;
        x = x | 0;
        y = y | 0;
        this.chainable
            .generatedFont({
            font,
            weight,
            size
        })
            .color(color)
            .pos(x, y)
            .text(text);
    }
    shape(values) {
        if (this.ctx instanceof CanvasRenderingContext2D != true)
            return;
        let { color = 'pink', x = 0, y = 0, w = 0, h = 0 } = values;
        x = x | 0;
        y = y | 0;
        w = w | 0;
        h = h | 0;
        this.chainable
            .color(color)
            .size(w, h)
            .pos(x, y)
            .rect;
    }
    circle(values) {
        CanvasRender.circle(this.ctx, values);
    }
    gradient({ shape = 'square', percent: { w: percentW = 0, h: percentH = 0 } = {}, colorStart = 'black', colorEnd = 'white', x = 0, y = 0, w = 0, h = 0, radius = .5 } = {}) {
        if (this.ctx instanceof CanvasRenderingContext2D != true) {
            return;
        }
        const { ctx } = this;
        const [gx, gy] = [(x + w * percentW), (y + h * percentH)];
        let gradient;
        if (shape == 'radial')
            gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * radius);
        else
            gradient = ctx.createLinearGradient(gx, gy, x + w, y + h);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);
    }
    getTextWidth(values) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.font = '';
        }
        if (typeof values.font === 'string' ||
            typeof values.size === 'number') {
            this.text({
                color: 'white',
                font: values.font || 'Tahoma',
                size: values.size || 20,
                text: "",
                x: -10000,
                y: -10000
            });
        }
        return this.ctx.measureText(values.text).width;
    }
    ;
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
            this.events.emit('resize', canvas.width, canvas.height);
        };
        if ('addEventListener' in window) {
            window.addEventListener('resize', resize);
        }
        resize();
        return this;
    }
    get get() {
        return this;
    }
    get chainable() {
        return new ChainableCanvas(this);
    }
}
