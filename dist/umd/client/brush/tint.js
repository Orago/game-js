(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@orago/lib/colors"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TintImage = void 0;
    const colors_1 = require("@orago/lib/colors");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    class TintImage {
        static rgbToHsl(RGB) {
            let r = RGB[0] / 255;
            let g = RGB[1] / 255;
            let b = RGB[2] / 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            let h = 0, s = 0;
            const l = (max + min) / 2;
            if (delta !== 0) {
                s = delta / (1 - Math.abs(2 * l - 1));
                if (max === r) {
                    h = ((g - b) / delta) % 6;
                }
                else if (max === g) {
                    h = (b - r) / delta + 2;
                }
                else {
                    h = (r - g) / delta + 4;
                }
                h *= 60;
                if (h < 0)
                    h += 360;
            }
            return {
                h: Math.round(h),
                s: Math.round(s * 100),
                l: Math.round(l * 100),
            };
        }
        static setupTint(canvas, ctx, source, ref) {
            const smoothing = ctx.imageSmoothingEnabled;
            canvas.width = source.width;
            canvas.height = source.height;
            ctx.imageSmoothingEnabled = smoothing;
            ctx.clearRect(0, 0, source.width, source.height);
            ref(ctx, source);
            ctx.globalCompositeOperation = "source-over";
        }
        /**
         * Old default is 100
         */
        static lightenOverlay(ctx, box, light) {
            if (typeof light != "number") {
                return;
            }
            ctx.globalCompositeOperation =
                light < 100 ? "color-burn" : "color-dodge";
            // chain.rendering(light < 100 ? "color-burn" : "color-dodge");
            // Modify future light after color-effect
            light = light >= 100 ? light - 100 : 100 - (100 - light);
            ctx.fillStyle = `hsl(0, 50%, ${light}%)`;
            ctx.fillRect(0, 0, box.width, box.height);
            // light
            // chain.color(`hsl(0, 50%, ${light}%)`).rect;
        }
        /**
         * Saturates the image
         * Old default is 100
         */
        static saturateOverlay(ctx, box, saturation) {
            if (typeof saturation != "number") {
                return;
            }
            ctx.globalCompositeOperation = "saturation";
            ctx.fillStyle = `hsl(0,${saturation}%, 50%)`;
            ctx.fillRect(0, 0, box.width, box.height);
            // chain.rendering("saturation").color(`hsl(0,${saturation}%, 50%)`).rect;
        }
        /**
         * Used to clip over the same image and remove excess pixels quickly
         */
        static clipEditFrom(ctx, size, ref) {
            ctx.globalCompositeOperation = "destination-in";
            ref(ctx, size);
            ctx.globalCompositeOperation = "source-over";
        }
        /**
         * Tints overlay with Hue
         */
        static hueOverlay(ctx, box, hue) {
            if (typeof hue != "number") {
                return;
            }
            ctx.globalCompositeOperation = "hue";
            ctx.fillStyle = `hsl(${hue},10%, 50%)`;
            ctx.fillRect(0, 0, box.width, box.height);
        }
        static normalizeHsl(options) {
            if (options.hsl != undefined) {
                return options.hsl;
            }
            else if (options.rgb != undefined) {
                const hsl = TintImage.rgbToHsl(options.rgb);
                return {
                    hue: hsl.h,
                    saturation: hsl.s,
                    light: hsl.l,
                };
            }
            else if (options.value != undefined) {
                const rgb = (0, colors_1.forceRgb)(options.value);
                const hsl = TintImage.rgbToHsl(rgb);
                return {
                    hue: hsl.h,
                    saturation: hsl.s,
                    light: hsl.l,
                };
            }
            else {
                const hsl = TintImage.rgbToHsl([255 / 2, 255 / 2, 255 / 2]);
                return {
                    hue: hsl.h,
                    saturation: hsl.s,
                    light: hsl.l,
                };
            }
        }
        /**
         * Checks if all items in an array match
         * Best image color manipulation method
         */
        static hslAffect(size, options, ref) {
            var _a, _b, _c, _d, _e, _f;
            const hsl = TintImage.normalizeHsl(options);
            const light = (_b = (_a = options === null || options === void 0 ? void 0 : options.override) === null || _a === void 0 ? void 0 : _a.light) !== null && _b !== void 0 ? _b : hsl.light;
            const saturation = (_d = (_c = options === null || options === void 0 ? void 0 : options.override) === null || _c === void 0 ? void 0 : _c.saturation) !== null && _d !== void 0 ? _d : hsl.saturation;
            const hue = (_f = (_e = options === null || options === void 0 ? void 0 : options.override) === null || _e === void 0 ? void 0 : _e.hue) !== null && _f !== void 0 ? _f : hsl.hue;
            this.setupTint(canvas, ctx, size, ref);
            if (typeof light === "number") {
                this.lightenOverlay(ctx, size, light);
            }
            if (typeof saturation === "number") {
                this.saturateOverlay(ctx, size, saturation);
            }
            if (typeof hue === "number") {
                this.hueOverlay(ctx, size, hue);
            }
            this.clipEditFrom(ctx, size, ref);
            return canvas;
        }
        static hslImage(sprite, options) {
            return this.hslAffect(sprite, options, () => ctx.drawImage(sprite, 0, 0));
        }
    }
    exports.TintImage = TintImage;
});
