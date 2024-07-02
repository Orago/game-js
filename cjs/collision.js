"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collision = void 0;
class Collision {
    static rect(rect1, rect2) {
        return (rect1.x + rect1.width > rect2.x &&
            rect1.x < rect2.x + rect2.width &&
            rect1.y + rect1.height > rect2.y &&
            rect1.y < rect2.y + rect2.height);
    }
    static rectContains(p, c) {
        const px2 = (p.width + p.x) || p.x;
        const py2 = (p.height + p.y) || p.y;
        const cx2 = (c.width || 0 + c.x) || c.x;
        const cy2 = (c.height || 0 + c.y) || c.y;
        return p.x <= c.x && px2 >= cx2 && p.y <= c.y && py2 >= cy2;
    }
    static circle(a, b) {
        const distX = Math.abs(b.x - a.x);
        const distY = Math.abs(b.y - a.y);
        const distance = Math.sqrt(distX * distX + distY * distY);
        return distance < a.r + b.r;
    }
}
exports.Collision = Collision;
