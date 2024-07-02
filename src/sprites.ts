import BrushCanvas from './brush/brush.js';

const rerenderCanvas = new BrushCanvas({
	inputCanvas: document.createElement('canvas')
});

const { chainable } = rerenderCanvas;

type ImageType = HTMLImageElement;

export function getDataUrl(image: ImageType | HTMLCanvasElement): string {
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
export function cloneToCanvas(image: ImageType): HTMLCanvasElement {
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

export function cloneImage(image: ImageType | HTMLCanvasElement): ImageType {
	const cloned = new Image();

	if (image instanceof HTMLImageElement) {
		cloned.crossOrigin = image.crossOrigin ?? 'anonymous';
		cloned.src = image.src;
	}

	else if (image instanceof HTMLCanvasElement)
		cloned.src = image.toDataURL();

	return cloned;
}

export async function responseToImageUrl(response: Response): Promise<any> {
	if (response.ok != true)
		throw new Error('Network response was not ok');


	/** Read the response as a Blob */
	const blob = await response.blob();

	/** Create an object URL from the Blob */
	return URL.createObjectURL(blob);
}

export function imageToResponse(image: any): Response {
	const blob = new Blob([image], { type: 'image/jpeg' }); // Adjust the MIME type as needed

	// Create a Response object from the Blob
	return new Response(blob, { status: 200, statusText: 'OK' });
}

type spriteCfg = { x: number; y: number; width: number; height: number; };

interface SpritesheetConfig {
	fileName: string;
	sprites: { [name: string]: spriteCfg; };
}

export class Spritesheet {
	id: string;
	loaded: boolean = false;
	sprite: HTMLImageElement = new Image();
	config: SpritesheetConfig;

	constructor(
		options: {
			id: string;
			url: string;
			cache?: true;
			config: SpritesheetConfig;
		}
	) {
		if (typeof options != 'object')
			throw console.log('Bad spritesheet', options);

		else if (typeof options?.url !== 'string')
			throw console.log('Bad spritesheet url', options);

		else if (typeof options?.url !== 'string')
			throw console.log('Bad spritesheet url', options);

		else if (typeof options?.config !== 'object')
			throw console.log('Bad config', options);

		else if (typeof options.config?.fileName !== 'string')
			throw console.log('[spritesheet.config] Invalid fileName', options);

		else if (typeof options.config?.sprites !== 'object')
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
			// fetchCached('sprites', options.url)
			fetch(options.url)
				.then(async response => {
					this.sprite.src = await responseToImageUrl(response);

					// console.log('CACHE LOADED', options.url);
				});
		} else {
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
	img: ImageType;

	constructor(image: ImageType) {
		this.img = image;
	}
}

class BlankSprite extends Sprite {
	constructor() {
		super(new Image());
	}
}

export default class Sprites {

	static Slice(
		image: ImageType,
		bounds: {
			x: number;
			y: number;
			width: number;
			height: number;
		}
	): ImageType {
		const result = new Image();

		const g: [number, number, number, number] = [bounds.x, bounds.y, bounds.width, bounds.height];

		result.src =
			chainable
				.canvasSize(bounds.width, bounds.height)
				.clear
				.rendering('source-over')
				.image(image, g)
				.canvas.toDataURL();

		return result;
	}

	canvas = new BrushCanvas().chainable;

	/**
	 * Host domain and or path
	 * it's essentially just a url prefix
	 */
	host: string = '';
	sprites = new Map();
	loading = new Set;
	cache: Map<string, Sprite> = new Map();

	/** Seconds */
	cacheDuration = 3600; /* 1 hour */

	spriteSheets: Map<string, Spritesheet> = new Map();

	constructor(options: { host?: string; cacheDuration?: number; }) {
		if (typeof options === 'object') {
			if (typeof options.host === 'string')
				this.host = options.host;

			if (typeof options.cacheDuration === 'number')
				this.cacheDuration = options.cacheDuration;
		}
	}

	/**
	 * @param {Spritesheet} spritesheet 
	 */
	addSpritesheet(spritesheet: Spritesheet) {
		if (spritesheet instanceof Spritesheet != true) {
			console.log(spritesheet);
			throw new Error('^ Invalid spritesheet');
		}

		this.spriteSheets.set(spritesheet.id, spritesheet);
	}

	parseUrl(url: string): string {
		if (
			typeof url == 'string' &&
			url.startsWith('/')
		)
			return this.host + url;

		return url;
	}

	has(url: string): boolean {
		return this.cache.hasOwnProperty(url);
	}

	get(url: string, options?: any): HTMLImageElement {
		url = this.parseUrl(url);

		const cached = this.cache.get(url);
		const result = cached ? cached.img : this.loadSingle(url, options?.onLoad).img;

		if (this.has(url)) {
			result.dispatchEvent(
				new Event('load')
			);
		}

		return result;
	}

	loadSingle(url: string, onLoad?: Function): Sprite {
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

	async fromCache(url: string): Promise<ImageType> {
		if (this.sprites.has(url))
			return this.sprites.get(url);

		/** From spritesheet */
		for (const sheet of Array.from(this.spriteSheets.values())) {
			if (sheet.config.sprites.hasOwnProperty(url) != true)
				continue;

			if (sheet.loaded !== true) {
				await new Promise((resolve) => setTimeout(resolve, 500));

				return await this.fromCache(url);
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

		/** Return promise loop if in queue */
		if (this.loading.has(url)) {
			await new Promise((resolve) => setTimeout(resolve, 500));

			return await this.fromCache(url);
		}

		/** Load new */
		return await this.promise(url);
	}

	async loadSinglePromise(url: string): Promise<Sprite['img']> {
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
				console.log('file: ', [url], 'is messed up', err)
			};
		});
	}

	async promise(url: string): Promise<ImageType> {
		url = this.parseUrl(url);

		const cached = this.cache.get(url);

		return cached ? cached.img : await this.loadSinglePromise(url);
	}
}