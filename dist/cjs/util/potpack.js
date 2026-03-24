"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoxUtil = void 0;
exports.default = potpack;
class BoxUtil {
    static from(x, y, width, height) {
        return {
            x,
            y,
            width,
            height,
        };
    }
    static asArray(obj) {
        return [obj.x, obj.y, obj.width, obj.height];
    }
    static asRect(obj) {
        const { x, y, width, height } = obj;
        return { x, y, width, height };
    }
}
exports.BoxUtil = BoxUtil;
function potpack(boxes, padding = 0) {
    // calculate total box area and maximum box width
    let area = 0;
    let maxWidth = 0;
    for (const box of boxes) {
        area += (box.width + padding) * (box.height + padding);
        maxWidth = Math.max(maxWidth, box.width);
    }
    // sort the boxes for insertion by height, descending
    const sorted_boxes = [...boxes].sort((a, b) => b.height - a.height);
    // aim for a squarish resulting container,
    // slightly adjusted for sub-100% space utilization
    const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth);
    // start with a single empty space, unbounded at the bottom
    const spaces = [{ x: 0, y: 0, width: startWidth, height: Infinity }];
    let width = 0;
    let height = 0;
    const new_boxes = sorted_boxes.map((e) => (Object.assign(Object.assign({}, e), { x: 0, y: 0 })));
    for (const box of new_boxes) {
        // look through spaces backwards so that we check smaller spaces first
        for (let i = spaces.length - 1; i >= 0; i--) {
            const space = spaces[i];
            // look for empty spaces that can accommodate the current box
            if (box.width + padding > space.width ||
                box.height + padding > space.height)
                continue;
            /**
             * found the space; add the box to its top-left corner
             * |-------|-------|
             * |  box  |       |
             * |_______|       |
             * |         space |
             * |_______________|
             */
            box.x = space.x + padding; // Add padding
            box.y = space.y + padding; // Add padding
            height = Math.max(height, box.y + box.height);
            width = Math.max(width, box.x + box.width);
            if (box.width + padding === space.width &&
                box.height + padding === space.height) {
                // space matches the box exactly; remove it
                const last = spaces.pop();
                if (i < spaces.length && last)
                    spaces[i] = last;
            }
            else if (box.height + padding === space.height) {
                /**
                 * space matches the box height; update it accordingly
                 * |-------|---------------|
                 * |  box  | updated space |
                 * |_______|_______________|
                 */
                space.x += box.width + padding;
                space.width -= box.width;
            }
            else if (box.width + padding === space.width) {
                /**
                 * space matches the box width; update it accordingly
                 * |---------------|
                 * |      box      |
                 * |_______________|
                 * | updated space |
                 * |_______________|
                 */
                space.y += box.height + padding;
                space.height -= box.height + padding;
            }
            else {
                /**
                 * otherwise the box splits the space into two spaces
                 * |-------|-----------|
                 * |  box  | new space |
                 * |_______|___________|
                 * | updated space     |
                 * |___________________|
                 */
                spaces.push({
                    x: space.x + (box.width + padding),
                    y: space.y,
                    width: space.width - (box.width + padding),
                    height: box.height + padding,
                });
                space.y += box.height + padding;
                space.height -= box.height + padding;
            }
            break;
        }
    }
    return {
        width, // container width
        height, // container height
        fill: width > 0 && height > 0
            ? area / ((width + padding) * (height + padding))
            : 0, // space utilization
        boxes: new_boxes,
    };
}
