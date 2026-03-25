"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collision = void 0;
class Collision {
    static rect(a, b) {
        return (a.x + a.width > b.x &&
            a.x < b.x + b.width &&
            a.y + a.height > b.y &&
            a.y < b.y + b.height);
    }
    static rectContains(outer, inner) {
        return (inner.x >= outer.x &&
            inner.x + inner.width <= outer.x + outer.width &&
            inner.y >= outer.y &&
            inner.y + inner.height <= outer.y + outer.height);
    }
    static circle(a, b) {
        const distX = Math.abs(b.x - a.x);
        const distY = Math.abs(b.y - a.y);
        const distance = Math.sqrt(distX * distX + distY * distY);
        return distance < a.r + b.r;
    }
}
exports.Collision = Collision;
