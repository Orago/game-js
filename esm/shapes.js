export class RectangleUtil {
    static scaleToFit(containerWidth, containerHeight, rectWidth, rectHeight) {
        // Calculate aspect ratios
        const containerRatio = containerWidth / containerHeight;
        const rectRatio = rectWidth / rectHeight;
        let scaleFactor = 1;
        // Scale the rectangle to fit within the container
        if (rectRatio > containerRatio)
            scaleFactor = containerWidth / rectWidth;
        else
            scaleFactor = containerHeight / rectHeight;
        // Calculate the scaled dimensions
        const width = rectWidth * scaleFactor;
        const height = rectHeight * scaleFactor;
        return new RectangleUtil(width, height);
    }
    static scale(width, height, scale) {
        width *= scale;
        height *= scale;
        return new RectangleUtil(width, height);
    }
    static FromObj(obj) {
        return new RectangleUtil(obj.width, obj.height);
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
        const fit = RectangleUtil.scaleToFit(_.width, _.height, this.width, this.height);
        return fit;
    }
}
export class RectBody extends RectangleUtil {
    static toBoundingBox(rect) {
        if (rect instanceof RectBody)
            return new Bound(rect.x, rect.y, rect.width, rect.height);
        if (rect instanceof RectangleUtil)
            return new Bound(0, 0, rect.width, rect.height);
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
export class Bound {
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
        if (Array.isArray(items) != true) {
            return;
        }
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
