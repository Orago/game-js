import BrushCanvas from './brush/brush.js';

const rerenderCanvas = new BrushCanvas({
	inputCanvas: document.createElement('canvas')
});

const { chainable } = rerenderCanvas;

/**
 * @typedef {HTMLImageElement} ImageType
 */

/**
 * 
 * @param {ImageType | HTMLCanvasElement} image 
 * @returns {string}
 */
export function getDataUrl(image) {
	if (image instanceof HTMLImageElement){
		return chainable
			.canvasSize(image.width, image.height)
			.size(image.width, image.height)
			.clear
			.pos(0, 0)
			.rendering('source-over')
			.image(image)
			.canvas
			.toDataURL();
	} else if (image instanceof HTMLCanvasElement) {
		return image.toDataURL();
	}

	return '';
}

/**
 * 
 * @param {ImageType} image 
 * @returns {HTMLCanvasElement}
 */
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

/**
 * 
 * @param {ImageType | HTMLCanvasElement} image 
 * @returns {ImageType}
 */
export function cloneImage(image) {
	const cloned = new Image();

	if (image instanceof HTMLImageElement) {
		cloned.crossOrigin = image.crossOrigin ?? 'anonymous';
		cloned.src = image.src;
	} else if (image instanceof HTMLCanvasElement) {
		cloned.src = image.toDataURL();
	}

	return cloned;
}

/**
 * @param {Response} response
 * @returns {Promise<any>}
 */
export async function responseToImageUrl(response) {
	if (!response.ok) {
		throw new Error('Network response was not ok');
	}

	/**
	 * Read the response as a Blob
	 */
	const blob = await response.blob();

	/**
	 * Create an object URL from the Blob
	 */
	return URL.createObjectURL(blob);
}

/**
 * 
 * @param {any} image 
 * @returns {Response}
 */
export function imageToResponse(image) {
	const blob = new Blob([image], { type: 'image/jpeg' }); // Adjust the MIME type as needed

	// Create a Response object from the Blob
	return new Response(blob, { status: 200, statusText: 'OK' });
}

/**
 * @typedef {{ x: number, y: number, width: number, height: number }} spriteCfg
 */

/**
 * @typedef {object} SpritesheetConfig
 * @property {string} fileName -
 * @property {{[name: string]: spriteCfg}} sprites -
 */

export class Spritesheet {
	/**
	 * @type {string}
	 */
	id;

	/**
	 * @type {boolean}
	 */
	loaded = false;

	/**
	 * @type {HTMLImageElement}
	 */
	sprite = new Image();

	/**
	 * @type {SpritesheetConfig}
	 */
	config;



	/**
	 * @param {object} options 
	 * @param {string} options.id
	 * @param {string} options.url
	 * @param {true} [options.cache]
	 * @param {SpritesheetConfig} options.config
	 */
	constructor(options) {
		if (typeof options != 'object') {
			throw console.log('Bad spritesheet', options);
		} else if (typeof options?.url !== 'string') {
			throw console.log('Bad spritesheet url', options);
		} else if (typeof options?.url !== 'string') {
			throw console.log('Bad spritesheet url', options);
		} else if (typeof options?.config !== 'object') {
			throw console.log('Bad config', options);
		} else if (typeof options.config?.fileName !== 'string') {
			throw console.log('[spritesheet.config] Invalid fileName', options);
		} else if (typeof options.config?.sprites !== 'object') {
			throw console.log('[spritesheet.config] Invalid sprites type', options);
		}
		let index = 0;

		for (const [spriteUrl, spriteCfg] of Object.entries(options.config.sprites)) {
			let i = index++;

			if (typeof spriteUrl !== 'string') {
				throw console.log(`[spritesheet.sprites]: I:(${i}) Bad sprite url`, [spriteUrl, spriteCfg]);
			} else if (typeof spriteCfg !== 'object') {
				throw console.log(`[spritesheet.sprites]: I:(${i}) Bad sprite config`, [spriteUrl, spriteCfg]);
			}
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
	/**
	 * @type {ImageType}
	 */
	img;

	/**
	 * 
	 * @param {ImageType} image 
	 */
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
	/**
	 * @param {ImageType} image 
	 * @param {object} bounds
	 * @param {number} bounds.x
	 * @param {number} bounds.y 
	 * @param {number} bounds.width 
	 * @param {number} bounds.height
	 * @returns {ImageType}
	 */
	static Slice(image, bounds) {
		const result = new Image();

		/** @type {[number, number, number, number]} */
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

	canvas = new BrushCanvas().chainable;

	/**
	 * Host domain and or path
	 * it's essentially just a url prefix
	 * @type {string}
	 */
	host = '';
	sprites = new Map();
	loading = new Set;
	/**
	 * @type {Map<string, Sprite>}
	 */
	cache = new Map();

	/**
	 * Seconds 
	 */
	cacheDuration = 3600; /* 1 hour */

	/**
	 * @type {Map<string, Spritesheet>}
	 */
	spriteSheets = new Map();

	/**
	 * 
	 * @param {{
	 *  host?: string,
	 *  cacheDuration?: number
	 * }} options 
	 */
	constructor(options) {
		if (typeof options === 'object') {
			if (typeof options.host === 'string') {
				this.host = options.host;
			}

			if (typeof options.cacheDuration === 'number') {
				this.cacheDuration = options.cacheDuration;
			}
		}
	}

	/**
	 * 
	 * @param {Spritesheet} spritesheet 
	 */
	addSpritesheet(spritesheet) {
		if (spritesheet instanceof Spritesheet != true) {
			console.log(spritesheet);
			throw new Error('^ Invalid spritesheet');
		}

		this.spriteSheets.set(spritesheet.id, spritesheet);
	}

	/**
	 * 
	 * @param {string} url 
	 * @returns {string}
	 */
	parseUrl(url) {
		if (typeof url == 'string' && url.startsWith('/')) {
			return this.host + url;
		}

		return url;
	}

	/**
	 * 
	 * @param {string} url 
	 * @returns {boolean}
	 */
	has(url) {
		return this.cache.hasOwnProperty(url);
	}

	/**
	 * @param {string} url 
	 * @param {*} options 
	 * @returns {HTMLImageElement}
	 */
	get(url, options) {
		url = this.parseUrl(url);

		const cached = this.cache.get(url);
		const result = cached ? cached.img : this.loadSingle(url, options?.onLoad).img;

		// if (typeof options?.onLoad == 'function' && this.has(url)) {
		// 	options.onLoad(result);
		// }

		if (this.has(url)) {
			result.dispatchEvent(
				new Event('load')
			);
		}

		return result;
	}

	/**
	 * 
	 * @param {string} url 
	 * @param {Function} [onLoad]
	 * @returns {Sprite}
	 */
	loadSingle(url, onLoad) {
		const res = new BlankSprite();

		if (this.loading.has(url)) {
			return res;
		}

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

	/**
	 * 
	 * @param {string} url 
	 * @returns {Promise<ImageType>}
	 */
	async fromCache(url) {
		if (this.sprites.has(url)) {
			return this.sprites.get(url);
		}

		/**
		 * From spritesheet
		 */
		for (const sheet of Array.from(this.spriteSheets.values())) {
			if (sheet.config.sprites.hasOwnProperty(url) != true) {
				continue;
			} else if (sheet.loaded === true) {
				const opts = sheet.config.sprites[url];
				const img = Sprites.Slice(sheet.sprite, opts);
				const cached = this.cache.get(url);

				if (cached == null) {
					const sprite = new Sprite(img);

					this.cache.set(
						url,
						sprite
					);

					return sprite.img;
				} else {
					return cached.img;
				}
			} else {
				await new Promise((resolve) => setTimeout(resolve, 500));

				return await this.fromCache(url);
			}
		}

		/**
		 * Return promise loop if in queue
		 */
		if (this.loading.has(url)) {
			await new Promise((resolve) => setTimeout(resolve, 500));

			return await this.fromCache(url);
		}

		/**
		 * Load new
		 */
		return await this.promise(url);
	}

	/**
	 * 
	 * @param {string} url 
	 * @returns {Promise<Sprite['img']>}
	 */
	async loadSinglePromise(url) {
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

	/**
	 * 
	 * @param {string} url 
	 * @returns {Promise<ImageType>}
	 */
	async promise(url) {
		url = this.parseUrl(url);

		const cached = this.cache.get(url);

		return cached ? cached.img : await this.loadSinglePromise(url);
	}
}