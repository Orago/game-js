var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@orago/lib/colors", "./brush.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TintImage = void 0;
    exports.rgbTintImage = rgbTintImage;
    exports.lightenOverlay = lightenOverlay;
    exports.saturateOverlay = saturateOverlay;
    exports.plainDraw = plainDraw;
    exports.hueOverlay = hueOverlay;
    exports.hslTintImage = hslTintImage;
    const colors_1 = require("@orago/lib/colors");
    const brush_js_1 = __importDefault(require("./brush.js"));
    const colorable_canvas = new brush_js_1.default({
        inputCanvas: document.createElement("canvas"),
    });
    const color_chain = colorable_canvas.chainable;
    /**
     * Draws an overlay tint to canvas
     * ! WARNING it is extremely slow
     * @deprecated
     */
    function badlyColorImage(image, red = 0, green = 0, blue = 0) {
        // image is a canvas image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx instanceof CanvasRenderingContext2D) {
            const { width, height } = image;
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(image, 0, 0);
            const myImg = ctx.getImageData(0, 0, width, height);
            for (let t = 0; t < myImg.data.length; t += 4) {
                myImg.data[t] += red;
                myImg.data[t + 1] += green;
                myImg.data[t + 2] += blue;
            }
            ctx.clearRect(0, 0, width, height);
            ctx.putImageData(myImg, 0, 0);
        }
        return canvas;
    }
    /**
     * Draws an overlay tint to canvas
     * Faster yet slightly different version of badlyColorImage
     */
    function rgbTintImage(sprite, [red = 0, green = 0, blue = 0, tint = 0.2]) {
        const image = new Image();
        color_chain
            .canvasSize(sprite.width, sprite.height)
            .size(sprite.width, sprite.height)
            .clear.pos(0, 0)
            .image(sprite)
            .opacity(tint)
            .rendering("source-atop")
            .color(`rgb(${[red, green, blue].join(",")})`)
            .rect.rendering("source-over");
        if (color_chain.last_config.canvas instanceof HTMLCanvasElement) {
            image.src = color_chain.last_config.canvas.toDataURL("image/png");
        }
        return sprite;
    }
    /**
     * Old default is 100
     */
    function lightenOverlay(chain, light) {
        if (typeof light != "number") {
            return;
        }
        chain.rendering(light < 100 ? "color-burn" : "color-dodge");
        // Modify future light after color-effect
        light = light >= 100 ? light - 100 : 100 - (100 - light);
        // light
        chain.color(`hsl(0, 50%, ${light}%)`).rect;
    }
    /**
     * Saturates the image
     * Old default is 100
     */
    function saturateOverlay(chain, saturation) {
        if (typeof saturation != "number") {
            return;
        }
        chain.rendering("saturation").color(`hsl(0,${saturation}%, 50%)`).rect;
    }
    /**
     * Quickly Sets canvas size and draws sprite once
     */
    function plainDraw(chain, sprite) {
        chain
            .canvasSize(sprite.width, sprite.height)
            .size(sprite.width, sprite.height)
            .clear.pos(0, 0)
            .rendering("source-over")
            .image(sprite);
    }
    /**
     * Tints overlay with Hue
     */
    function hueOverlay(chain, hue) {
        if (typeof hue != "number") {
            return;
        }
        chain.rendering("hue").color(`hsl(${hue},10%, 50%)`).rect;
    }
    /**
     * Used to clip over the same image and remove excess pixels quickly
     */
    function clipEditFrom(chain, sprite) {
        chain.rendering("destination-in").image(sprite).rendering("source-over");
    }
    /**
     * Checks if all items in an array match
     * Best image color manipulation method
     */
    function hslTintImage(sprite, options) {
        plainDraw(color_chain, sprite);
        if (typeof options?.light === "number") {
            lightenOverlay(color_chain, options.light);
        }
        if (typeof options?.saturation === "number") {
            saturateOverlay(color_chain, options.saturation);
        }
        if (options?.rgb != null) {
            hueOverlay(color_chain, (0, colors_1.rgbToHue)(...(0, colors_1.forceRgb)(options.rgb)));
        }
        else if (options?.tint != null) {
            hueOverlay(color_chain, (0, colors_1.rgbToHue)(...(0, colors_1.forceRgb)(options.tint)));
        }
        else if (typeof options?.hue === "number") {
            hueOverlay(color_chain, options.hue);
        }
        // Clipping
        clipEditFrom(color_chain, sprite);
        const image = new Image();
        if (color_chain.last_config.canvas instanceof HTMLCanvasElement) {
            image.src = color_chain.canvas.toDataURL("image/png");
        }
        return image;
    }
    class TintImage {
        static setupTintDraw(chain, sprite) {
            chain
                .canvasSize(sprite.width, sprite.height)
                .size(sprite.width, sprite.height)
                .clear.pos(0, 0)
                .rendering("source-over")
                .image(sprite);
        }
        /**
         * Old default is 100
         */
        static lightenOverlay(chain, light) {
            if (typeof light != "number") {
                return;
            }
            chain.rendering(light < 100 ? "color-burn" : "color-dodge");
            // Modify future light after color-effect
            light = light >= 100 ? light - 100 : 100 - (100 - light);
            // light
            chain.color(`hsl(0, 50%, ${light}%)`).rect;
        }
        /**
         * Saturates the image
         * Old default is 100
         */
        static saturateOverlay(chain, saturation) {
            if (typeof saturation != "number") {
                return;
            }
            chain.rendering("saturation").color(`hsl(0,${saturation}%, 50%)`).rect;
        }
        /**
         * Used to clip over the same image and remove excess pixels quickly
         */
        static clipEditFrom(chain, sprite) {
            chain
                .rendering("destination-in")
                .image(sprite)
                .rendering("source-over");
        }
        /**
         * Tints overlay with Hue
         */
        static hueOverlay(chain, hue) {
            if (typeof hue != "number") {
                return;
            }
            chain.rendering("hue").color(`hsl(${hue},10%, 50%)`).rect;
        }
        /**
         * Checks if all items in an array match
         * Best image color manipulation method
         */
        static hslTint(sprite, options) {
            this.setupTintDraw(color_chain, sprite);
            if (typeof options?.light === "number") {
                this.lightenOverlay(color_chain, options.light);
            }
            if (typeof options?.saturation === "number") {
                this.saturateOverlay(color_chain, options.saturation);
            }
            if (options?.rgb != null) {
                this.hueOverlay(color_chain, (0, colors_1.rgbToHue)(...(0, colors_1.forceRgb)(options.rgb)));
            }
            else if (options?.tint != null) {
                this.hueOverlay(color_chain, (0, colors_1.rgbToHue)(...(0, colors_1.forceRgb)(options.tint)));
            }
            else if (typeof options?.hue === "number") {
                this.hueOverlay(color_chain, options.hue);
            }
            // Clipping
            this.clipEditFrom(color_chain, sprite);
            const image = new Image();
            if (color_chain.last_config.canvas instanceof HTMLCanvasElement) {
                image.src = color_chain.canvas.toDataURL("image/png");
                return new Promise((resolve) => {
                    color_chain.canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        image.src = url;
                        resolve(image);
                    });
                });
            }
            return new Promise((resolve) => resolve(image));
            // return image;
        }
    }
    exports.TintImage = TintImage;
});
//# sourceMappingURL=color-image.js.map