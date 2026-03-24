import potpack from "../../util/potpack.js";
export class ImagePacker {
    static pack(boxes, padding = 0) {
        const packed = potpack(boxes, padding);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = packed.width;
        canvas.height = packed.height;
        ctx.imageSmoothingEnabled = false;
        for (const box of packed.boxes) {
            ctx.drawImage(box.image, box.x, box.y, box.width, box.height);
        }
        return {
            canvas,
            packed,
        };
    }
}
