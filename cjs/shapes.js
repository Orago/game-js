"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bound = exports.RectBody = exports.Box = void 0;
const vector_1 = require("@orago/vector");
class Box {
    static scaleToFit(containerWidth, containerHeight, rectWidth, rectHeight) {
        const containerRatio = containerWidth / containerHeight;
        const rectRatio = rectWidth / rectHeight;
        let scaleFactor = 1;
        if (rectRatio > containerRatio)
            scaleFactor = containerWidth / rectWidth;
        else
            scaleFactor = containerHeight / rectHeight;
        const width = rectWidth * scaleFactor;
        const height = rectHeight * scaleFactor;
        return new Box(width, height);
    }
    static scale(width, height, scale) {
        width *= scale;
        height *= scale;
        return new Box(width, height);
    }
    static FromObj(obj) {
        return new Box(obj.width, obj.height);
    }
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
    *[Symbol.iterator]() {
        yield this.width;
        yield this.height;
    }
    scaled(scale) {
        return new Box(this.width * scale, this.height * scale);
    }
    toFit({ width, height } = this) {
        const fit = Box.scaleToFit(width, height, this.width, this.height);
        return fit;
    }
}
exports.Box = Box;
class RectBody extends Box {
    static toBoundingBox(rect) {
        if (rect instanceof RectBody) {
            return new Bound(rect.x, rect.y, rect.width, rect.height);
        }
        else if (rect instanceof Box) {
            return new Bound(0, 0, rect.width, rect.height);
        }
    }
    static contains(parent, child) {
        const parentx2 = parent.x + parent.width;
        const parenty2 = parent.y + parent.height;
        const childx2 = child.x + child.width;
        const childy2 = child.y + child.height;
        return parent.x <= child.x && parentx2 >= childx2 && parent.y <= child.y && parenty2 >= childy2;
    }
    static centered(parent, child) {
        return new RectBody(parent.x + (parent.width - child.width) / 2, parent.y + (parent.height - child.height) / 2);
    }
    constructor(x, y, width = 0, height = 0) {
        super(width, height);
        this.x = x;
        this.y = y;
    }
    get pos() {
        return new vector_1.Vector2(this.x, this.y);
    }
    set pos(vector2) {
        this.x = vector2.x;
        this.y = vector2.y;
    }
    copy() {
        return new RectBody(this.x, this.y, this.width, this.height);
    }
    move(x, y) {
        let input = x;
        if (input instanceof vector_1.Vector2) {
            this.x += input.x;
            this.y += input.y;
        }
        else if (typeof x === 'number' && typeof y === 'number') {
            this.x += x;
            this.y += y;
        }
        return this;
    }
}
exports.RectBody = RectBody;
class Bound {
    static toPositionalRect(bound) {
        const [x1, y1, x2, y2] = bound;
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);
        return new RectBody(x, y, w, h);
    }
    constructor(x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
        this.positions = [0, 0, 0, 0];
        this.positions = [x1, y1, x2, y2];
    }
    clear() {
        this.positions = [0, 0, 0, 0];
    }
    set(...items) {
        if (Array.isArray(items) != true) {
            return;
        }
        this.clear();
        items.slice(0, 4).map((n, index) => {
            this.positions[index] = typeof n === 'number' ? n : 0;
        });
    }
    toRect() {
        return Bound.toPositionalRect(this);
    }
    get valid() {
        return this.positions.some(n => typeof n !== 'number') != true;
    }
    *[Symbol.iterator]() {
        for (const p of this.positions)
            yield p;
    }
}
exports.Bound = Bound;
