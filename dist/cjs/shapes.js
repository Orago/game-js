"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bound = exports.RectBody = exports.RectangleUtil = void 0;
class RectangleUtil {
    static scaleToFitRatio(container, child) {
        // Calculate aspect ratios
        const containerRatio = container.width / container.height;
        const rectRatio = child.width / child.height;
        // Scale the rectangle to fit within the container
        if (rectRatio > containerRatio)
            return container.width / child.width;
        else
            return container.height / child.height;
    }
    static scaleToFit(container, child) {
        // Calculate aspect ratios
        const scaleFactor = RectangleUtil.scaleToFitRatio(container, child);
        // Calculate the scaled dimensions
        const width = child.width * scaleFactor;
        const height = child.height * scaleFactor;
        return { width, height };
    }
    static scale(width, height, scale) {
        return { width: width * scale, height: height * scale };
    }
    static from(obj) {
        return new RectangleUtil(obj.width, obj.height);
    }
    static contains(parent, child) {
        var _a, _b;
        const parentx2 = parent.x + parent.width;
        const parenty2 = parent.y + parent.height;
        const childx2 = child.x + ((_a = child === null || child === void 0 ? void 0 : child.width) !== null && _a !== void 0 ? _a : 0);
        const childy2 = child.y + ((_b = child === null || child === void 0 ? void 0 : child.height) !== null && _b !== void 0 ? _b : 0);
        return parent.x <= child.x && parentx2 >= childx2 && parent.y <= child.y && parenty2 >= childy2;
    }
    static centerChild(parent, child) {
        var _a, _b;
        return {
            x: parent.x + (parent.width - child.width) / 2,
            y: parent.y + (parent.height - child.height) / 2,
            width: (_a = child.width) !== null && _a !== void 0 ? _a : 0,
            height: (_b = child.height) !== null && _b !== void 0 ? _b : 0,
        };
    }
    static toBound(rect) {
        var _a, _b;
        return [(_a = rect === null || rect === void 0 ? void 0 : rect.x) !== null && _a !== void 0 ? _a : 0, (_b = rect === null || rect === void 0 ? void 0 : rect.y) !== null && _b !== void 0 ? _b : 0, rect.width, rect.height];
    }
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
    *[Symbol.iterator]() {
        yield this.width;
        yield this.height;
    }
    /**
     * Upscales rectangle by scale factor
     * @param {number} scale
     * @returns {RectangleUtil}
     */
    scaled(scale) {
        return new RectangleUtil(this.width * scale, this.height * scale);
    }
    toFit(_ = this) {
        return RectangleUtil.from(RectangleUtil.scaleToFit(_, this));
    }
}
exports.RectangleUtil = RectangleUtil;
class RectBody extends RectangleUtil {
    static toBoundingBox(rect) {
        if (rect instanceof RectBody)
            return new Bound(rect.x, rect.y, rect.width, rect.height);
        if (rect instanceof RectangleUtil)
            return new Bound(0, 0, rect.width, rect.height);
    }
    constructor(x, y, width = 0, height = 0) {
        super(width, height);
        this.x = x;
        this.y = y;
    }
    get pos() {
        return {
            x: this.x,
            y: this.y
        };
    }
    set pos(vector2) {
        this.x = vector2.x;
        this.y = vector2.y;
    }
    copy() {
        return new RectBody(this.x, this.y, this.width, this.height);
    }
    move(...args) {
        if (typeof args[0] == 'object') {
            this.x += args[0].x;
            this.y += args[0].y;
        }
        else if (typeof args[0] === 'number' && typeof args[1] === 'number') {
            this.x += args[0];
            this.y += args[1];
        }
        return this;
    }
}
exports.RectBody = RectBody;
/**
 * @deprecated
 * Moved to RectangleUtil.contains
 */
RectBody.contains = RectangleUtil.contains;
/**
 * @deprecated
 * Moved to RectangleUtil.centerChild
 */
RectBody.centered = RectangleUtil.centerChild;
class Bound {
    static toPositionalRect(bound) {
        const [x1, y1, x2, y2] = bound;
        const x = Math.min(x1, x2); // Get the minimum x-coordinate as the top-left corner x
        const y = Math.min(y1, y2); // Get the minimum y-coordinate as the top-left corner y
        const w = Math.abs(x2 - x1); // Calculate the width as the absolute difference between x2 and x1
        const h = Math.abs(y2 - y1); // Calculate the height as the absolute difference between y2 and y1
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
        if (Array.isArray(items) != true)
            return;
        this.clear();
        items
            .slice(0, 4)
            .map((n, index) => {
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
