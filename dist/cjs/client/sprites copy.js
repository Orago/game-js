"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Textures = exports.OraSpritesheet = exports.Spritesheet = void 0;
exports.getDataUrl = getDataUrl;
exports.cloneToCanvas = cloneToCanvas;
exports.cloneImage = cloneImage;
exports.responseToImageUrl = responseToImageUrl;
exports.imageToResponse = imageToResponse;
const brush_js_1 = __importDefault(require("./brush/brush.js"));
const image_packer_js_1 = require("./util/image-packer.js");
const rerenderCanvas = new brush_js_1.default({
    inputCanvas: document.createElement("canvas"),
});
const { chainable } = rerenderCanvas;
function getDataUrl(image) {
    if (image instanceof HTMLImageElement) {
        return chainable
            .canvasSize(image.width, image.height)
            .size(image.width, image.height)
            .clear.pos(0, 0)
            .rendering("source-over")
            .image(image)
            .last_config.canvas.toDataURL();
    }
    else if (image instanceof HTMLCanvasElement) {
        return image.toDataURL();
    }
    else {
        return "";
    }
}
function cloneToCanvas(image) {
    const rerender_canvas = new brush_js_1.default({
        inputCanvas: document.createElement("canvas"),
    });
    const { chainable } = rerender_canvas;
    return chainable
        .canvasSize(image.width, image.height)
        .size(image.width, image.height)
        .clear.pos(0, 0)
        .rendering("source-over")
        .image(image).last_config.canvas;
}
function cloneImage(image) {
    const cloned = new Image();
    if (image instanceof HTMLImageElement) {
        cloned.crossOrigin = image.crossOrigin ?? "anonymous";
        cloned.src = image.src;
    }
    else if (image instanceof HTMLCanvasElement) {
        cloned.src = image.toDataURL();
    }
    return cloned;
}
async function responseToImageUrl(response) {
    if (response.ok != true) {
        throw new Error("Network response was not ok");
    }
    /** Read the response as a Blob */
    const blob = await response.blob();
    /** Create an object URL from the Blob */
    return URL.createObjectURL(blob);
}
function imageToResponse(image) {
    const blob = new Blob([image], { type: "image/jpeg" }); // Adjust the MIME type as needed
    // Create a Response object from the Blob
    return new Response(blob, { status: 200, statusText: "OK" });
}
class Spritesheet {
    id;
    loaded = false;
    sprite = new Image();
    config;
    constructor(options) {
        if (typeof options != "object") {
            throw console.log("Bad spritesheet", options);
        }
        else if (typeof options?.url !== "string") {
            throw console.log("Bad spritesheet url", options);
        }
        else if (typeof options?.url !== "string") {
            throw console.log("Bad spritesheet url", options);
        }
        else if (typeof options?.config !== "object") {
            throw console.log("Bad config", options);
        }
        else if (typeof options.config?.fileName !== "string") {
            throw console.log("[spritesheet.config] Invalid fileName", options);
        }
        else if (typeof options.config?.sprites !== "object") {
            throw console.log("[spritesheet.config] Invalid sprites type", options);
        }
        let index = 0;
        for (const [spriteUrl, spriteCfg] of Object.entries(options.config.sprites)) {
            let i = index++;
            if (typeof spriteUrl !== "string") {
                throw console.log(`[spritesheet.sprites]: I:(${i}) Bad sprite url`, [spriteUrl, spriteCfg]);
            }
            else if (typeof spriteCfg !== "object") {
                throw console.log(`[spritesheet.sprites]: I:(${i}) Bad sprite config`, [spriteUrl, spriteCfg]);
            }
        }
        if (options.cache === true) {
            // fetchCached('sprites', options.url)
            fetch(options.url).then(async (response) => {
                this.sprite.src = await responseToImageUrl(response);
                // console.log('CACHE LOADED', options.url);
            });
        }
        else {
            this.sprite.src = options.url;
        }
        this.id = options.id;
        this.sprite.crossOrigin = "anonymous";
        this.sprite.onload = () => (this.loaded = true);
        this.sprite.onerror = (e) => console.log("failed to load", e, options.url);
        this.config = options.config;
    }
}
exports.Spritesheet = Spritesheet;
class SpriteOld {
    img;
    constructor(image) {
        this.img = image;
    }
}
class BlankSprite extends SpriteOld {
    constructor() {
        super(new Image());
    }
}
class Sprites {
    static slice(image, bounds) {
        const result = new Image();
        result.src = chainable
            .canvasSize(bounds.width, bounds.height)
            .clear.rendering("source-over")
            .image(image, [bounds.x, bounds.y, bounds.width, bounds.height])
            .canvas.toDataURL();
        return result;
    }
    static Slice = Sprites.slice;
    canvas = new brush_js_1.default().chainable;
    /**
     * Host domain and or path
     * it's essentially just a url prefix
     */
    host = "";
    sprites = new Map();
    loading = new Set();
    cache = new Map();
    /** Seconds */
    cache_duration = 3600; /* 1 hour */
    sheets = new Map();
    constructor(options) {
        if (typeof options === "object") {
            if (typeof options.host === "string") {
                this.host = options.host;
            }
            if (typeof options.cacheDuration === "number") {
                this.cache_duration = options.cacheDuration;
            }
        }
    }
    addSpritesheet(spritesheet) {
        if (spritesheet instanceof Spritesheet != true) {
            console.log(spritesheet);
            throw new Error("^ Invalid spritesheet");
        }
        this.sheets.set(spritesheet.id, spritesheet);
    }
    parseUrl(url) {
        if (typeof url == "string" && url.startsWith("/")) {
            return this.host + url;
        }
        else {
            return url;
        }
    }
    has(url) {
        return this.cache.hasOwnProperty(url);
    }
    get(url, options) {
        url = this.parseUrl(url);
        const cached = this.cache.get(url);
        const result = cached
            ? cached.img
            : this.loadSingle(url, options?.onLoad).img;
        if (this.has(url)) {
            result.dispatchEvent(new Event("load"));
        }
        return result;
    }
    loadSingle(url, onLoad) {
        const res = new BlankSprite();
        if (this.loading.has(url)) {
            return res;
        }
        this.loading.add(url);
        res.img.crossOrigin = "anonymous";
        res.img.src = url;
        res.img.addEventListener("load", (url) => {
            this.loading.delete(url);
            if (typeof onLoad !== "function") {
                return;
            }
            const result = onLoad(res.img);
            if (result)
                res.img = result;
        });
        this.cache.set(url, res);
        return res;
    }
    async fromCache(url) {
        if (this.sprites.has(url)) {
            return this.sprites.get(url);
        }
        /** From spritesheet */
        for (const sheet of Array.from(this.sheets.values())) {
            if (sheet.config.sprites.hasOwnProperty(url) != true) {
                continue;
            }
            if (sheet.loaded !== true) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return await this.fromCache(url);
            }
            const cached = this.cache.get(url);
            if (cached != null) {
                return cached.img;
            }
            const opts = sheet.config.sprites[url];
            const img = Sprites.slice(sheet.sprite, opts);
            const sprite = new SpriteOld(img);
            this.cache.set(url, sprite);
            return sprite.img;
        }
        /** Return promise loop if in queue */
        if (this.loading.has(url)) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            return await this.fromCache(url);
        }
        /** Load new */
        return await this.promise(url);
    }
    async loadSinglePromise(url) {
        const sprite = new BlankSprite();
        sprite.img.crossOrigin = "anonymous";
        sprite.img.src = url;
        return new Promise((resolve) => {
            sprite.img.onload = () => {
                this.cache.set(url, sprite);
                resolve(sprite.img);
            };
            sprite.img.onerror = (err) => {
                resolve(sprite.img);
                console.log("file: ", [url], "is messed up", err);
            };
        });
    }
    async promise(url) {
        url = this.parseUrl(url);
        return this.cache.get(url)?.img ?? (await this.loadSinglePromise(url));
        // const cached = this.cache.get(url);
        // return cached ? cached.img : await this.loadSinglePromise(url);
    }
}
exports.default = Sprites;
class Sprite {
    static slice(image, bounds) {
        const result = new Image();
        const g = [
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height,
        ];
        result.src = chainable
            .canvasSize(bounds.width, bounds.height)
            .clear.rendering("source-over")
            .image(image, g)
            .canvas.toDataURL();
        return result;
    }
}
class OraSpritesheet {
    id;
    sprites = {};
    canvas = document.createElement("canvas");
    ctx = this.canvas.getContext("2d");
    constructor(id) {
        this.id = id;
    }
    set(list) {
        const boxes = list.map((item) => ({
            image: item[1],
            width: item[1].width,
            height: item[1].height,
        }));
        const result = image_packer_js_1.ImagePacker.pack(this.canvas, this.ctx, boxes, 1);
        this.sprites = {};
        for (const obj of result.packed.boxes) {
            for (const [id, image] of list) {
                if (obj.image == image) {
                    this.sprites[id] = [obj.x, obj.y, obj.width, obj.height];
                }
            }
        }
    }
    getAll() {
        const list = [];
        for (const [id, offset] of Object.entries(this.sprites)) {
            const image = Sprite.slice(this.canvas, {
                x: offset[0],
                y: offset[1],
                width: offset[2],
                height: offset[3],
            });
            list.push([id, image]);
        }
        return list;
    }
    inject(id, image) {
        const list = this.getAll();
        list.push([id, image]);
    }
}
exports.OraSpritesheet = OraSpritesheet;
class SpriteN extends HTMLImageElement {
}
class Textures {
    static tempPromised(promise) {
        const image = new Image();
        promise.then((result) => {
            image.src = chainable
                .canvasSize(result.width, result.height)
                .clear.rendering("source-over")
                .image(result, [0, 0, result.width, result.height])
                .canvas.toDataURL();
        });
        return image;
    }
    cache = {
        // sprites: new Set(),
        sheets: new Set(),
    };
    inject(image) { }
    get(url) { }
}
exports.Textures = Textures;
//# sourceMappingURL=sprites%20copy.js.map