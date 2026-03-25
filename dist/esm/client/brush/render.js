import { TintImage } from "./tint.js";
let canvas;
let ctx;
export class CanvasRender {
    static resolveCanvas() {
        if (canvas == undefined || ctx == undefined) {
            canvas = document.createElement("canvas");
            ctx = canvas.getContext("2d");
        }
        return {
            canvas,
            ctx,
        };
    }
    static getImageArray(source, from, to) {
        if ("getSource" in source) {
            source = source.getSource();
        }
        const source_width = "width" in source && typeof source.width == "number"
            ? source.width
            : 0;
        const source_height = "height" in source && typeof source.height == "number"
            ? source.height
            : 0;
        const [sx = 0, sy = 0, sw = source_width, sh = source_height] = Array.isArray(from) ? from : [];
        const [dx = 0, dy = 0, dw = source_width, dh = source_height] = Array.isArray(to) ? to : [];
        if ("id" in source && "data" in source) {
            if (source.data == undefined)
                return;
            return [
                source.data,
                source.x + sx,
                source.y + sy,
                sw,
                sh,
                dx,
                dy,
                dw,
                dh,
            ];
        }
        else {
            return [source, sx, sy, sw, sh, dx, dy, dw, dh];
        }
    }
    static Image(context, source, options
    // from: ArrayRect = [],
    // to: ArrayRect = []
    ) {
        var _a, _b;
        const source_array = CanvasRender.getImageArray(source, (_a = options === null || options === void 0 ? void 0 : options.from) !== null && _a !== void 0 ? _a : [], (_b = options === null || options === void 0 ? void 0 : options.to) !== null && _b !== void 0 ? _b : []);
        if (source_array == undefined)
            return;
        try {
            let [image, sx, sy, sw, sh, dx, dy, dw, dh] = source_array;
            if ((options === null || options === void 0 ? void 0 : options.tint) != undefined) {
                image = TintImage.hslAffect(image, options.tint, (ctx) => ctx.drawImage(image, 0, 0));
            }
            else {
            }
            context.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
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
    static tintSection() { }
}
