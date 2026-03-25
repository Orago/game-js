var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@orago/lib", "../../util/potpack.js", "./ora-slice.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpriteStore = exports.MeowTexture = exports.SpriteRef = exports.TextureHandler = exports.SpriteUtility = void 0;
    const lib_1 = require("@orago/lib");
    const potpack_js_1 = __importDefault(require("../../util/potpack.js"));
    const ora_slice_js_1 = require("./ora-slice.js");
    class QueueChain {
        constructor(source) {
            this.source = source;
            this.queue = Promise.resolve();
        }
        isDone() {
            return __awaiter(this, void 0, void 0, function* () {
                let current;
                do {
                    current = this.queue;
                    yield current;
                } while (current !== this.queue);
            });
        }
        enqueue(task) {
            const next = this.queue.then(() => task(this.source));
            this.queue = next.then(() => undefined);
            return next;
        }
    }
    class SpriteUtility {
        static blankSource(id = "blank") {
            return {
                id,
                data: undefined,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            };
        }
        static normalizeBitmap(input) {
            return __awaiter(this, void 0, void 0, function* () {
                if (input instanceof HTMLImageElement) {
                    return yield createImageBitmap(input);
                }
                else if (input instanceof HTMLCanvasElement) {
                    return yield createImageBitmap(input);
                }
                else if (input instanceof Blob) {
                    return yield createImageBitmap(input);
                }
                else {
                    return input;
                }
            });
        }
        static sliceBitmap(bitmap, options) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d;
                return yield createImageBitmap(bitmap, (_a = options === null || options === void 0 ? void 0 : options.x) !== null && _a !== void 0 ? _a : 0, (_b = options === null || options === void 0 ? void 0 : options.y) !== null && _b !== void 0 ? _b : 0, (_c = options === null || options === void 0 ? void 0 : options.width) !== null && _c !== void 0 ? _c : bitmap.width, (_d = options === null || options === void 0 ? void 0 : options.height) !== null && _d !== void 0 ? _d : bitmap.height);
            });
        }
        static getBitmap(texture, id) {
            return __awaiter(this, void 0, void 0, function* () {
                const pending = texture.pending_sprites[id];
                if (pending != undefined) {
                    return pending.bitmap;
                }
                else if (texture.sprites[id]) {
                    const sprite_box = texture.sprites[id];
                    return yield createImageBitmap(texture.canvas, sprite_box.x, sprite_box.y, sprite_box.width, sprite_box.height);
                }
            });
        }
        static resizeCanvas(canvas, ctx, width, height) {
            canvas.width = width;
            canvas.height = height;
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        static getBoxes(texture) {
            const sprites = Object.fromEntries(Object.entries(texture.sprites));
            /**
             * Just a note, pending sprites override
             */
            for (const [id, pending_sprite] of Object.entries(texture.pending_sprites)) {
                sprites[id] = {
                    width: pending_sprite.bitmap.width,
                    height: pending_sprite.bitmap.height,
                };
            }
            return Object.entries(sprites).map(([id, box]) => ({
                id,
                width: box.width,
                height: box.height,
            }));
        }
        static sliceUrlOrPass(url, tex) {
            return __awaiter(this, void 0, void 0, function* () {
                if (url.includes("s=") != true)
                    return;
                let source = new URL(location.href);
                try {
                    source = new URL(url);
                }
                catch (e) { }
                const source_str = source.searchParams.get("s");
                if (source_str == undefined)
                    return;
                const slice = ora_slice_js_1.OraSlice.getValues(source_str);
                yield tex.afterEffect((_a) => __awaiter(this, [_a], void 0, function* ({ bitmap }) {
                    const sliced = yield SpriteUtility.sliceBitmap(bitmap, {
                        x: slice.source.x || 0,
                        y: slice.source.y || 0,
                        width: slice.source.width || bitmap.width,
                        height: slice.source.height || bitmap.height,
                    });
                    yield tex.replace(sliced);
                }));
            });
        }
        static injectSprites(texture, options) {
            return __awaiter(this, void 0, void 0, function* () {
                let image;
                if (options.image instanceof HTMLImageElement) {
                    image = options.image;
                }
                else {
                    image = new Image();
                    image.src = options.image;
                }
                try {
                    yield new Promise((resolve, reject) => {
                        var _a;
                        let done = false;
                        image.addEventListener("load", () => {
                            if (done == false)
                                resolve();
                            done = true;
                        });
                        image.addEventListener("error", () => {
                            if (done == false)
                                reject();
                            done = true;
                        });
                        setTimeout(() => {
                            if (done == false)
                                reject();
                            done = true;
                        }, (_a = options.timeout) !== null && _a !== void 0 ? _a : 10000);
                    });
                    const promises = [];
                    for (const [key, data] of options.sprites) {
                        const promise = createImageBitmap(image, data.x, data.y, data.width, data.height)
                            .then((bitmap) => {
                            texture.addSprite(key, bitmap);
                        })
                            .catch(() => { });
                        promises.push(promise);
                    }
                    yield Promise.all(promises);
                }
                catch (_) { }
            });
        }
    }
    exports.SpriteUtility = SpriteUtility;
    class TextureHandler {
        constructor() {
            this.canvas = document.createElement("canvas");
            this.ctx = this.canvas.getContext("2d");
            this.queue = new QueueChain(this);
        }
        repack(texture) {
            const boxes = SpriteUtility.getBoxes(texture);
            // hard coded padding
            const packing = (0, potpack_js_1.default)(boxes, 1);
            SpriteUtility.resizeCanvas(this.canvas, this.ctx, packing.width, packing.height);
            for (const box of packing.boxes) {
                try {
                    const pending = texture.pending_sprites[box.id];
                    if (pending != undefined) {
                        delete texture.pending_sprites[box.id];
                        texture.sprites[box.id] = {
                            x: box.x,
                            y: box.y,
                            width: box.width,
                            height: box.height,
                            created: performance.now(),
                            last: performance.now(),
                        };
                        this.ctx.drawImage(pending.bitmap, box.x, box.y, box.width, box.height);
                    }
                    else if (texture.sprites[box.id]) {
                        const sprite_box = texture.sprites[box.id];
                        this.ctx.drawImage(texture.canvas, sprite_box.x, sprite_box.y, sprite_box.width, sprite_box.height, box.x, box.y, box.width, box.height);
                        sprite_box.x = box.x;
                        sprite_box.y = box.y;
                        sprite_box.width = box.width;
                        sprite_box.height = box.height;
                    }
                }
                catch (e) {
                    // console.log(box.image);
                }
            }
            SpriteUtility.resizeCanvas(texture.canvas, texture.ctx, this.canvas.width, this.canvas.height);
            texture.ctx.drawImage(this.canvas, 0, 0);
        }
        getBlob() {
            return __awaiter(this, void 0, void 0, function* () {
                return yield new Promise((resolve) => this.canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(new Blob());
                        return;
                    }
                    resolve(blob);
                }, "image/png"));
            });
        }
        getUrl() {
            return __awaiter(this, void 0, void 0, function* () {
                const blob = yield this.getBlob();
                return URL.createObjectURL(blob);
            });
        }
        /**
         * Draws a section of the canvas onto
         * @param texture
         * @param s - selection
         * @param image
         */
        selectionToUrl(texture, s) {
            return __awaiter(this, void 0, void 0, function* () {
                SpriteUtility.resizeCanvas(this.canvas, this.ctx, s.width, s.height);
                this.ctx.drawImage(texture.canvas, s.x, s.y, s.width, s.height, 0, 0, s.width, s.height);
                return yield this.getUrl();
            });
        }
        bitmapToUrl(bitmap) {
            return __awaiter(this, void 0, void 0, function* () {
                // await this.queue.enqueue(async (handler) => {
                this.canvas.width = bitmap.width;
                this.canvas.height = bitmap.height;
                this.ctx.drawImage(bitmap, 0, 0);
                return yield this.getUrl();
                // });
            });
        }
    }
    exports.TextureHandler = TextureHandler;
    const texture_handler = new TextureHandler();
    class SpriteRef {
        constructor(texture, id) {
            this.texture = texture;
            this.id = id;
            this.queue = new QueueChain(this);
        }
        /**
         * Applies effect if bitmap is resolved,
         * does nothing if it cannot obtain a bitmap
         */
        afterEffect(task) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                yield this.texture.promise(this.id);
                (_a = this.bitmap) !== null && _a !== void 0 ? _a : (this.bitmap = yield this.getBitmap());
                const bitmap = this.bitmap;
                if (bitmap == undefined) {
                    return;
                }
                yield this.queue.enqueue(() => __awaiter(this, void 0, void 0, function* () {
                    return yield task({
                        sprite: this,
                        bitmap,
                    });
                }));
            });
        }
        getNormalBitmap() {
            const { texture, id } = this;
            if (this.bitmap != undefined)
                return this.bitmap;
            const pending = texture.pending_sprites[id];
            if (pending != undefined)
                return pending.bitmap;
        }
        getBitmap() {
            return __awaiter(this, void 0, void 0, function* () {
                const { texture, id } = this;
                const bitmap_a = this.getNormalBitmap();
                if (bitmap_a != undefined) {
                    return bitmap_a;
                }
                else if (texture.sprites[id]) {
                    const sprite_box = texture.sprites[id];
                    return yield createImageBitmap(texture.canvas, sprite_box.x, sprite_box.y, sprite_box.width, sprite_box.height);
                }
            });
        }
        urlCallback(callback) {
            const { texture, id } = this;
            (() => __awaiter(this, void 0, void 0, function* () {
                yield this.texture.promise(id);
                const bitmap = this.getNormalBitmap();
                if (bitmap != undefined) {
                    const url = yield texture_handler.bitmapToUrl(bitmap);
                    callback(url);
                    return;
                }
                else if (texture.sprites[id] != undefined) {
                    const url = yield texture_handler.selectionToUrl(this.texture, texture.sprites[id]);
                    callback(url);
                    return;
                }
            }))();
        }
        getImage() {
            const image = new Image();
            this.urlCallback((url) => {
                image.src = url;
            });
            return image;
        }
        /**
         * Should only be used once as a lazy promised source
         */
        livingSource() {
            const { id } = this;
            const source = SpriteUtility.blankSource(id);
            this.texture.promise(id).then(() => __awaiter(this, void 0, void 0, function* () {
                const { x, y, width, height, data } = this.getSource();
                source.data = data;
                source.x = x;
                source.y = y;
                source.width = width;
                source.height = height;
            }));
            return source;
        }
        getSource() {
            const { texture, id } = this;
            const bitmap = this.getNormalBitmap();
            if (bitmap != undefined) {
                return {
                    id,
                    data: bitmap,
                    x: 0,
                    y: 0,
                    width: bitmap.width,
                    height: bitmap.height,
                };
            }
            else if (texture.sprites[id]) {
                const sprite_box = texture.sprites[id];
                return {
                    id,
                    data: texture.canvas,
                    x: sprite_box.x,
                    y: sprite_box.y,
                    width: sprite_box.width,
                    height: sprite_box.height,
                };
            }
            return {
                id,
                data: undefined,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            };
        }
        drawToCanvas(ctx, x, y, width, height) {
            const source = this.getSource();
            if (source.data != undefined) {
                ctx.drawImage(source.data, source.x, source.y, source.width, source.height, x, y, width, height);
            }
        }
        ready(id, ready_for) {
            switch (ready_for) {
                case "canvas":
                    return this.texture.sprites[id] != undefined;
                case "image":
                    return (this.texture.sprites[id] != undefined ||
                        this.texture.pending_sprites[id] != undefined);
                default:
                    return false;
            }
        }
        replace(input) {
            return __awaiter(this, void 0, void 0, function* () {
                this.bitmap = yield SpriteUtility.normalizeBitmap(input);
            });
        }
    }
    exports.SpriteRef = SpriteRef;
    SpriteRef.Utility = SpriteUtility;
    class SpriteStore {
        constructor() {
            this.records = new Map();
            this.lifetime = 30000;
            this.debounce = new lib_1.DebouncedSignal(1000);
            this.debounce.on(() => {
                for (const [id, data] of this.records) {
                    if (performance.now() > data.time + this.lifetime) {
                        console.log("removing ref from store", id);
                        this.records.delete(id);
                    }
                }
            });
        }
        useOrGen(id, callback) {
            const existing = this.records.get(id);
            this.debounce.emit();
            if (existing == undefined) {
                const sprite = callback();
                this.records.set(id, {
                    sprite,
                    time: performance.now(),
                });
                return sprite;
            }
            else {
                existing.time = performance.now();
                return existing.sprite;
            }
        }
    }
    exports.SpriteStore = SpriteStore;
    class MeowTexture {
        constructor(options) {
            this.sprites = {};
            this.pending_sprites = {};
            this.loading = {};
            this.canvas = document.createElement("canvas");
            this.ctx = this.canvas.getContext("2d");
            this.debounce = new lib_1.DebouncedSignal(100);
            this.store = new SpriteStore();
            this.options = {
                host: "",
            };
            if (options === null || options === void 0 ? void 0 : options.host) {
                this.options.host = options.host;
            }
            this.debounce.on(() => {
                texture_handler.repack(this);
            });
        }
        resolveUrlOrigin(url) {
            url = url.startsWith("/") ? this.options.host + url : url;
            return url;
        }
        resolveUrl(url) {
            url = this.resolveUrlOrigin(url);
            try {
                const parsed = new URL(url);
                url = parsed.origin + parsed.pathname + parsed.search;
            }
            catch (e) { }
            return url;
        }
        exists(id) {
            return (this.sprites[id] != undefined ||
                this.pending_sprites[id] != undefined);
        }
        getUrl(url) {
            var _a;
            var _b;
            url = this.resolveUrl(url);
            if (this.exists(url)) {
                return new SpriteRef(this, url);
            }
            else {
                const image = new Image();
                image.src = url;
                image.crossOrigin = "anonymous";
                (_a = (_b = this.loading)[url]) !== null && _a !== void 0 ? _a : (_b[url] = new lib_1.Signal());
                new Promise((resolve) => {
                    image.addEventListener("load", () => {
                        resolve();
                    });
                }).then(() => {
                    this.addSprite(url, image);
                });
                return new SpriteRef(this, url);
            }
        }
        addSprite(id, input) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                var _b;
                (_a = (_b = this.loading)[id]) !== null && _a !== void 0 ? _a : (_b[id] = new lib_1.Signal());
                const bitmap = yield SpriteUtility.normalizeBitmap(input);
                this.pending_sprites[id] = { bitmap };
                this.loading[id].emit();
                delete this.loading[id];
                this.debounce.emit();
            });
        }
        removeSprite(id) {
            delete this.sprites[id];
            delete this.pending_sprites[id];
        }
        promise(id) {
            return __awaiter(this, void 0, void 0, function* () {
                const loading = this.loading[id];
                if (loading != undefined) {
                    return new Promise((resolve) => {
                        loading.once(resolve);
                    });
                }
            });
        }
    }
    exports.MeowTexture = MeowTexture;
    MeowTexture.Utility = SpriteUtility;
    MeowTexture.Handler = texture_handler;
});
