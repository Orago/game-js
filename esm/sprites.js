var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import BrushCanvas from './brush/brush.js';
const rerenderCanvas = new BrushCanvas({
    inputCanvas: document.createElement('canvas')
});
const { chainable } = rerenderCanvas;
export function getDataUrl(image) {
    if (image instanceof HTMLImageElement)
        return chainable
            .canvasSize(image.width, image.height)
            .size(image.width, image.height)
            .clear
            .pos(0, 0)
            .rendering('source-over')
            .image(image)
            .canvas
            .toDataURL();
    if (image instanceof HTMLCanvasElement)
        return image.toDataURL();
    return '';
}
export function cloneToCanvas(image) {
    const rerenderCanvas = new BrushCanvas({
        inputCanvas: document.createElement('canvas')
    });
    const { chainable } = rerenderCanvas;
    return chainable
        .canvasSize(image.width, image.height)
        .size(image.width, image.height)
        .clear
        .pos(0, 0)
        .rendering('source-over')
        .image(image)
        .canvas;
}
export function cloneImage(image) {
    var _a;
    const cloned = new Image();
    if (image instanceof HTMLImageElement) {
        cloned.crossOrigin = (_a = image.crossOrigin) !== null && _a !== void 0 ? _a : 'anonymous';
        cloned.src = image.src;
    }
    else if (image instanceof HTMLCanvasElement)
        cloned.src = image.toDataURL();
    return cloned;
}
export function responseToImageUrl(response) {
    return __awaiter(this, void 0, void 0, function* () {
        if (response.ok != true)
            throw new Error('Network response was not ok');
        const blob = yield response.blob();
        return URL.createObjectURL(blob);
    });
}
export function imageToResponse(image) {
    const blob = new Blob([image], { type: 'image/jpeg' });
    return new Response(blob, { status: 200, statusText: 'OK' });
}
export class Spritesheet {
    constructor(options) {
        var _a, _b;
        this.loaded = false;
        this.sprite = new Image();
        if (typeof options != 'object')
            throw console.log('Bad spritesheet', options);
        else if (typeof (options === null || options === void 0 ? void 0 : options.url) !== 'string')
            throw console.log('Bad spritesheet url', options);
        else if (typeof (options === null || options === void 0 ? void 0 : options.url) !== 'string')
            throw console.log('Bad spritesheet url', options);
        else if (typeof (options === null || options === void 0 ? void 0 : options.config) !== 'object')
            throw console.log('Bad config', options);
        else if (typeof ((_a = options.config) === null || _a === void 0 ? void 0 : _a.fileName) !== 'string')
            throw console.log('[spritesheet.config] Invalid fileName', options);
        else if (typeof ((_b = options.config) === null || _b === void 0 ? void 0 : _b.sprites) !== 'object')
            throw console.log('[spritesheet.config] Invalid sprites type', options);
        let index = 0;
        for (const [spriteUrl, spriteCfg] of Object.entries(options.config.sprites)) {
            let i = index++;
            if (typeof spriteUrl !== 'string')
                throw console.log(`[spritesheet.sprites]: I:(${i}) Bad sprite url`, [spriteUrl, spriteCfg]);
            else if (typeof spriteCfg !== 'object')
                throw console.log(`[spritesheet.sprites]: I:(${i}) Bad sprite config`, [spriteUrl, spriteCfg]);
        }
        if (options.cache === true) {
            fetch(options.url)
                .then((response) => __awaiter(this, void 0, void 0, function* () {
                this.sprite.src = yield responseToImageUrl(response);
            }));
        }
        else {
            this.sprite.src = options.url;
        }
        this.id = options.id;
        this.sprite.crossOrigin = 'anonymous';
        this.sprite.onload = () => this.loaded = true;
        this.sprite.onerror = e => console.log('failed to load', e, options.url);
        this.config = options.config;
    }
}
class Sprite {
    constructor(image) {
        this.img = image;
    }
}
class BlankSprite extends Sprite {
    constructor() {
        super(new Image());
    }
}
export default class Sprites {
    static Slice(image, bounds) {
        const result = new Image();
        const g = [bounds.x, bounds.y, bounds.width, bounds.height];
        result.src =
            chainable
                .canvasSize(bounds.width, bounds.height)
                .clear
                .rendering('source-over')
                .image(image, g)
                .canvas.toDataURL();
        return result;
    }
    constructor(options) {
        this.canvas = new BrushCanvas().chainable;
        this.host = '';
        this.sprites = new Map();
        this.loading = new Set;
        this.cache = new Map();
        this.cacheDuration = 3600;
        this.spriteSheets = new Map();
        if (typeof options === 'object') {
            if (typeof options.host === 'string')
                this.host = options.host;
            if (typeof options.cacheDuration === 'number')
                this.cacheDuration = options.cacheDuration;
        }
    }
    addSpritesheet(spritesheet) {
        if (spritesheet instanceof Spritesheet != true) {
            console.log(spritesheet);
            throw new Error('^ Invalid spritesheet');
        }
        this.spriteSheets.set(spritesheet.id, spritesheet);
    }
    parseUrl(url) {
        if (typeof url == 'string' &&
            url.startsWith('/'))
            return this.host + url;
        return url;
    }
    has(url) {
        return this.cache.hasOwnProperty(url);
    }
    get(url, options) {
        url = this.parseUrl(url);
        const cached = this.cache.get(url);
        const result = cached ? cached.img : this.loadSingle(url, options === null || options === void 0 ? void 0 : options.onLoad).img;
        if (this.has(url)) {
            result.dispatchEvent(new Event('load'));
        }
        return result;
    }
    loadSingle(url, onLoad) {
        const res = new BlankSprite();
        if (this.loading.has(url))
            return res;
        this.loading.add(url);
        res.img.crossOrigin = 'anonymous';
        res.img.src = url;
        res.img.addEventListener('load', url => {
            this.loading.delete(url);
            if (typeof onLoad === 'function') {
                const result = onLoad(res.img);
                if (result) {
                    res.img = result;
                }
            }
        });
        this.cache.set(url, res);
        return res;
    }
    fromCache(url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.sprites.has(url))
                return this.sprites.get(url);
            for (const sheet of Array.from(this.spriteSheets.values())) {
                if (sheet.config.sprites.hasOwnProperty(url) != true)
                    continue;
                if (sheet.loaded !== true) {
                    yield new Promise((resolve) => setTimeout(resolve, 500));
                    return yield this.fromCache(url);
                }
                const cached = this.cache.get(url);
                if (cached != null)
                    return cached.img;
                const opts = sheet.config.sprites[url];
                const img = Sprites.Slice(sheet.sprite, opts);
                const sprite = new Sprite(img);
                this.cache.set(url, sprite);
                return sprite.img;
            }
            if (this.loading.has(url)) {
                yield new Promise((resolve) => setTimeout(resolve, 500));
                return yield this.fromCache(url);
            }
            return yield this.promise(url);
        });
    }
    loadSinglePromise(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const sprite = new BlankSprite();
            sprite.img.crossOrigin = 'anonymous';
            sprite.img.src = url;
            return new Promise((resolve) => {
                sprite.img.onload = () => {
                    this.cache.set(url, sprite);
                    resolve(sprite.img);
                };
                sprite.img.onerror = err => {
                    resolve(sprite.img);
                    console.log('file: ', [url], 'is messed up', err);
                };
            });
        });
    }
    promise(url) {
        return __awaiter(this, void 0, void 0, function* () {
            url = this.parseUrl(url);
            const cached = this.cache.get(url);
            return cached ? cached.img : yield this.loadSinglePromise(url);
        });
    }
}
