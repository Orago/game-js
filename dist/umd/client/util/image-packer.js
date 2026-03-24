var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../util/potpack.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ImagePacker = void 0;
    const potpack_js_1 = __importDefault(require("../../util/potpack.js"));
    class ImagePacker {
        static pack(boxes, padding = 0) {
            const packed = (0, potpack_js_1.default)(boxes, padding);
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
    exports.ImagePacker = ImagePacker;
});
