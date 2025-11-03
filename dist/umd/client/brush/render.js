(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CanvasRender = void 0;
    class CanvasRender {
        static Image(context, image, from = [], to = []) {
            if ((image instanceof HTMLImageElement ||
                image instanceof HTMLCanvasElement ||
                image instanceof OffscreenCanvas) != true) {
                return;
            }
            const [preX = 0, preY = 0, preW = image.width, preH = image.height] = Array.isArray(from) ? from : [];
            const [x = 0, y = 0, w = image.width, h = image.height] = Array.isArray(to)
                ? to
                : [];
            try {
                context.drawImage(image, preX, preY, preW, preH, x, y, w, h);
            }
            catch (err) { }
        }
        static text(context, text, { x, y, w }) {
            x |= 0;
            y |= 0;
            context.fillText(text, x, y, w);
        }
        static partialCircle(context, values) {
            let { x = 0, y = 0, radius = 10, percent, strokeWidth } = values;
            const color = context.fillStyle;
            radius /= 2;
            context.save();
            context.beginPath();
            let amt = (2 / 100) * percent + 1.5;
            if (amt > 2)
                amt = amt - 2;
            context.arc(x, y, radius, amt * Math.PI, 1.5 * Math.PI, false); //25%
            context.fillStyle = "transparent";
            context.fill();
            context.lineWidth = strokeWidth !== null && strokeWidth !== void 0 ? strokeWidth : (radius - 0.3) * 2;
            context.strokeStyle = color;
            context.stroke();
            context.restore();
        }
        static fullCircle(context, values) {
            const { x = 0, y = 0, radius = 10, stroke, strokeWidth } = values;
            context.save();
            context.beginPath();
            context.arc(x, y, radius, 0, 2 * Math.PI, false);
            context.fill();
            if (typeof stroke == "string") {
                if (typeof strokeWidth === "number")
                    context.lineWidth = strokeWidth;
                context.strokeStyle = stroke;
                context.stroke();
            }
            context.restore();
        }
        static circle(context, values) {
            if (typeof values.percent === "number") {
                CanvasRender.partialCircle(context, values);
            }
            else {
                CanvasRender.fullCircle(context, values);
            }
        }
    }
    exports.CanvasRender = CanvasRender;
});
