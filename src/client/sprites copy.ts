import BrushCanvas from "./brush/brush.js";
import { Renderable } from "./brush/render.js";
import { ImagePacker, TImageBox } from "./util/image-packer.js";

const rerenderCanvas = new BrushCanvas({
	inputCanvas: document.createElement("canvas"),
});

const { chainable } = rerenderCanvas;

type ImageType = HTMLImageElement;

export function getDataUrl(image: ImageType | HTMLCanvasElement): string {
	if (image instanceof HTMLImageElement) {
		return chainable
			.canvasSize(image.width, image.height)
			.size(image.width, image.height)
			.clear.pos(0, 0)
			.rendering("source-over")
			.image(image)
			.last_config.canvas.toDataURL();
	} else if (image instanceof HTMLCanvasElement) {
		return image.toDataURL();
	} else {
		return "";
	}
}

export function cloneToCanvas(image: ImageType): HTMLCanvasElement {
	const rerender_canvas = new BrushCanvas({
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

export function cloneImage(image: ImageType | HTMLCanvasElement): ImageType {
	const cloned = new Image();

	if (image instanceof HTMLImageElement) {
		cloned.crossOrigin = image.crossOrigin ?? "anonymous";
		cloned.src = image.src;
	} else if (image instanceof HTMLCanvasElement) {
		cloned.src = image.toDataURL();
	}

	return cloned;
}

export async function responseToImageUrl(response: Response): Promise<any> {
	if (response.ok != true) {
		throw new Error("Network response was not ok");
	}

	/** Read the response as a Blob */
	const blob = await response.blob();

	/** Create an object URL from the Blob */
	return URL.createObjectURL(blob);
}

export function imageToResponse(image: any): Response {
	const blob = new Blob([image], { type: "image/jpeg" }); // Adjust the MIME type as needed

	// Create a Response object from the Blob
	return new Response(blob, { status: 200, statusText: "OK" });
}

type spriteCfg = { x: number; y: number; width: number; height: number };

interface SpritesheetConfig {
	fileName: string;
	sprites: { [name: string]: spriteCfg };
}

export class Spritesheet {
	id: string;
	loaded: boolean = false;
	sprite: HTMLImageElement = new Image();
	config: SpritesheetConfig;

	constructor(options: {
		id: string;
		url: string;
		cache?: true;
		config: SpritesheetConfig;
	}) {
		if (typeof options != "object") {
			throw console.log("Bad spritesheet", options);
		} else if (typeof options?.url !== "string") {
			throw console.log("Bad spritesheet url", options);
		} else if (typeof options?.url !== "string") {
			throw console.log("Bad spritesheet url", options);
		} else if (typeof options?.config !== "object") {
			throw console.log("Bad config", options);
		} else if (typeof options.config?.fileName !== "string") {
			throw console.log("[spritesheet.config] Invalid fileName", options);
		} else if (typeof options.config?.sprites !== "object") {
			throw console.log(
				"[spritesheet.config] Invalid sprites type",
				options
			);
		}

		let index = 0;

		for (const [spriteUrl, spriteCfg] of Object.entries(
			options.config.sprites
		)) {
			let i = index++;

			if (typeof spriteUrl !== "string") {
				throw console.log(
					`[spritesheet.sprites]: I:(${i}) Bad sprite url`,
					[spriteUrl, spriteCfg]
				);
			} else if (typeof spriteCfg !== "object") {
				throw console.log(
					`[spritesheet.sprites]: I:(${i}) Bad sprite config`,
					[spriteUrl, spriteCfg]
				);
			}
		}

		if (options.cache === true) {
			// fetchCached('sprites', options.url)
			fetch(options.url).then(async (response) => {
				this.sprite.src = await responseToImageUrl(response);

				// console.log('CACHE LOADED', options.url);
			});
		} else {
			this.sprite.src = options.url;
		}

		this.id = options.id;
		this.sprite.crossOrigin = "anonymous";
		this.sprite.onload = () => (this.loaded = true);
		this.sprite.onerror = (e) =>
			console.log("failed to load", e, options.url);
		this.config = options.config;
	}
}

class SpriteOld {
	img: ImageType;

	constructor(image: ImageType) {
		this.img = image;
	}
}

class BlankSprite extends SpriteOld {
	constructor() {
		super(new Image());
	}
}

export default class Sprites {
	public static slice(
		image: ImageType,
		bounds: {
			x: number;
			y: number;
			width: number;
			height: number;
		}
	): ImageType {
		const result = new Image();

		result.src = chainable
			.canvasSize(bounds.width, bounds.height)
			.clear.rendering("source-over")
			.image(image, [bounds.x, bounds.y, bounds.width, bounds.height])
			.canvas.toDataURL();

		return result;
	}
	public static Slice = Sprites.slice;

	public canvas = new BrushCanvas().chainable;

	/**
	 * Host domain and or path
	 * it's essentially just a url prefix
	 */
	public host: string = "";
	public sprites = new Map();
	public loading = new Set();
	public readonly cache: Map<string, SpriteOld> = new Map();

	/** Seconds */
	public cache_duration = 3600; /* 1 hour */

	public readonly sheets: Map<string, Spritesheet> = new Map();

	constructor(options?: { host?: string; cacheDuration?: number }) {
		if (typeof options === "object") {
			if (typeof options.host === "string") {
				this.host = options.host;
			}

			if (typeof options.cacheDuration === "number") {
				this.cache_duration = options.cacheDuration;
			}
		}
	}

	addSpritesheet(spritesheet: Spritesheet) {
		if (spritesheet instanceof Spritesheet != true) {
			console.log(spritesheet);
			throw new Error("^ Invalid spritesheet");
		}

		this.sheets.set(spritesheet.id, spritesheet);
	}

	parseUrl(url: string): string {
		if (typeof url == "string" && url.startsWith("/")) {
			return this.host + url;
		} else {
			return url;
		}
	}

	has(url: string): boolean {
		return this.cache.hasOwnProperty(url);
	}

	get(url: string, options?: any): HTMLImageElement {
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

	loadSingle(url: string, onLoad?: Function): SpriteOld {
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
			if (result) res.img = result;
		});

		this.cache.set(url, res);

		return res;
	}

	async fromCache(url: string): Promise<ImageType> {
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

	async loadSinglePromise(url: string): Promise<SpriteOld["img"]> {
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

	async promise(url: string): Promise<ImageType> {
		url = this.parseUrl(url);
		return this.cache.get(url)?.img ?? (await this.loadSinglePromise(url));

		// const cached = this.cache.get(url);
		// return cached ? cached.img : await this.loadSinglePromise(url);
	}
}

class Sprite {
	public static slice(
		image: ImageType | HTMLCanvasElement,
		bounds: {
			x: number;
			y: number;
			width: number;
			height: number;
		}
	): ImageType {
		const result = new Image();
		const g: [number, number, number, number] = [
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

export class OraSpritesheet {
	sprites: Record<string, [x: number, y: number, w: number, h: number]> = {};
	canvas: HTMLCanvasElement = document.createElement("canvas");
	ctx = this.canvas.getContext("2d")!;

	constructor(public id: string) {}

	set(list: [id: string, image: HTMLImageElement][]) {
		const boxes = list.map((item) => ({
			image: item[1],
			width: item[1].width,
			height: item[1].height,
		}));

		const result = ImagePacker.pack(this.canvas, this.ctx, boxes, 1);

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
		const list: [id: string, image: HTMLImageElement][] = [];

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

	inject(id: string, image: HTMLImageElement) {
		const list = this.getAll();

		list.push([id, image]);
	}
}

class SpriteN extends HTMLImageElement {}

export class Textures {
	public static tempPromised(promise: Promise<HTMLImageElement>) {
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
	public cache: {
		// sprites: Set<RenderableImage>;
		sheets: Set<OraSpritesheet>;
	} = {
		// sprites: new Set(),
		sheets: new Set(),
	};

	inject(image: HTMLImageElement) {}

	public get(url: string) {}
}
