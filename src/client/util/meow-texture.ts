import { DebouncedSignal, Rectangle, Signal } from "@orago/lib";
import potpack from "../../util/potpack.js";
import { OraSlice } from "./ora-slice.js";
import { Size } from "@orago/lib";

class QueueChain<S> {
	public queue = Promise.resolve();
	constructor(private source: S) {}

	public async isDone(): Promise<void> {
		let current: Promise<void>;

		do {
			current = this.queue;
			await current;
		} while (current !== this.queue);
	}

	public enqueue<T>(task: (img: S) => Promise<T> | T): Promise<T> {
		const next = this.queue.then(() => task(this.source));
		this.queue = next.then(() => undefined);
		return next;
	}
}
interface SpriteInjectOptions {
	sprites: [key: string, data: Rectangle][];
	image: HTMLImageElement | string;
	/**
	 * fails after timeout
	 * default: 10_000 ms
	 */
	timeout?: number;
}

interface SpriteData {
	x: number;
	y: number;
	width: number;
	height: number;

	created: number;
	last: number;
}

type SpriteID = string;

interface PendingSprite {
	bitmap: ImageBitmap;
}
type ImageInputType = HTMLImageElement | HTMLCanvasElement | Blob | ImageBitmap;

type CanvasSpriteSource = Rectangle & {
	id: SpriteID;
	data: HTMLImageElement | ImageBitmap | HTMLCanvasElement | undefined;
};

class SpriteUtility {
	static blankSource(id: string = "blank"): CanvasSpriteSource {
		return {
			id,
			data: undefined,
			x: 0,
			y: 0,
			width: 0,
			height: 0,
		};
	}
	static async normalizeBitmap(input: ImageInputType): Promise<ImageBitmap> {
		if (input instanceof HTMLImageElement) {
			return await createImageBitmap(input);
		} else if (input instanceof HTMLCanvasElement) {
			return await createImageBitmap(input);
		} else if (input instanceof Blob) {
			return await createImageBitmap(input);
		} else {
			return input;
		}
	}

	static async sliceBitmap(
		bitmap: ImageBitmap,
		options?: { x?: number; y?: number; width?: number; height?: number }
	): Promise<ImageBitmap> {
		return await createImageBitmap(
			bitmap,
			options?.x ?? 0,
			options?.y ?? 0,
			options?.width ?? bitmap.width,
			options?.height ?? bitmap.height
		);
	}

	static async getBitmap(
		texture: MeowTexture,
		id: string
	): Promise<ImageBitmap | void> {
		const pending = texture.pending_sprites[id];

		if (pending != undefined) {
			return pending.bitmap;
		} else if (texture.sprites[id]) {
			const sprite_box = texture.sprites[id];

			return await createImageBitmap(
				texture.canvas,
				sprite_box.x,
				sprite_box.y,
				sprite_box.width,
				sprite_box.height
			);
		}
	}

	static resizeCanvas(
		canvas: HTMLCanvasElement,
		ctx: CanvasRenderingContext2D,
		width: number,
		height: number
	) {
		canvas.width = width;
		canvas.height = height;
		ctx.imageSmoothingEnabled = false;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	static getBoxes(texture: MeowTexture) {
		const sprites: Record<string, Size> = Object.fromEntries(
			Object.entries(texture.sprites)
		);
		/**
		 * Just a note, pending sprites override
		 */
		for (const [id, pending_sprite] of Object.entries(
			texture.pending_sprites
		)) {
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

	static async sliceUrlOrPass(url: string, tex: SpriteRef): Promise<void> {
		if (url.includes("s=") != true) return;
		let source: URL = new URL(location.href);

		try {
			source = new URL(url);
		} catch (e) {}

		const source_str = source.searchParams.get("s");

		if (source_str == undefined) return;

		const slice = OraSlice.getValues(source_str);

		await tex.afterEffect(async ({ bitmap }) => {
			const sliced = await SpriteUtility.sliceBitmap(bitmap, {
				x: slice.source.x || 0,
				y: slice.source.y || 0,
				width: slice.source.width || bitmap.width,
				height: slice.source.height || bitmap.height,
			});

			await tex.replace(sliced);
		});
	}

	static async injectSprites(
		texture: MeowTexture,
		options: SpriteInjectOptions
	): Promise<void> {
		let image: HTMLImageElement;

		if (options.image instanceof HTMLImageElement) {
			image = options.image;
		} else {
			image = new Image();
			image.src = options.image;
		}

		try {
			await new Promise<void>((resolve, reject) => {
				let done = false;
				image.addEventListener("load", () => {
					if (done == false) resolve();
					done = true;
				});
				image.addEventListener("error", () => {
					if (done == false) reject();
					done = true;
				});
				setTimeout(() => {
					if (done == false) reject();
					done = true;
				}, options.timeout ?? 10_000);
			});

			const promises: Promise<any>[] = [];

			for (const [key, data] of options.sprites) {
				const promise = createImageBitmap(
					image,
					data.x,
					data.y,
					data.width,
					data.height
				)
					.then((bitmap) => {
						texture.addSprite(key, bitmap);
					})
					.catch(() => {});
				promises.push(promise);
			}

			await Promise.all(promises);
		} catch (_) {}
	}
}

class TextureHandler {
	canvas: HTMLCanvasElement = document.createElement("canvas");
	ctx: CanvasRenderingContext2D = this.canvas.getContext("2d")!;
	queue: QueueChain<TextureHandler> = new QueueChain(this);

	repack(texture: MeowTexture) {
		const boxes = SpriteUtility.getBoxes(texture);
		// hard coded padding
		const packing = potpack(boxes, 1);

		SpriteUtility.resizeCanvas(
			this.canvas,
			this.ctx,
			packing.width,
			packing.height
		);

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
					this.ctx.drawImage(
						pending.bitmap,
						box.x,
						box.y,
						box.width,
						box.height
					);
				} else if (texture.sprites[box.id]) {
					const sprite_box = texture.sprites[box.id];

					this.ctx.drawImage(
						texture.canvas,
						sprite_box.x,
						sprite_box.y,
						sprite_box.width,
						sprite_box.height,
						box.x,
						box.y,
						box.width,
						box.height
					);

					sprite_box.x = box.x;
					sprite_box.y = box.y;
					sprite_box.width = box.width;
					sprite_box.height = box.height;
				}
			} catch (e) {
				// console.log(box.image);
			}
		}

		SpriteUtility.resizeCanvas(
			texture.canvas,
			texture.ctx,
			this.canvas.width,
			this.canvas.height
		);

		texture.ctx.drawImage(this.canvas, 0, 0);
	}

	private async getBlob() {
		return await new Promise<Blob>((resolve) =>
			this.canvas.toBlob((blob) => {
				if (!blob) {
					resolve(new Blob());
					return;
				}
				resolve(blob);
			}, "image/png")
		);
	}

	async getUrl() {
		const blob = await this.getBlob();
		return URL.createObjectURL(blob);
	}

	/**
	 * Draws a section of the canvas onto
	 * @param texture
	 * @param s - selection
	 * @param image
	 */
	async selectionToUrl(
		texture: MeowTexture,
		s: {
			x: number;
			y: number;
			width: number;
			height: number;
		}
	) {
		SpriteUtility.resizeCanvas(this.canvas, this.ctx, s.width, s.height);
		this.ctx.drawImage(
			texture.canvas,
			s.x,
			s.y,
			s.width,
			s.height,
			0,
			0,
			s.width,
			s.height
		);

		return await this.getUrl();
	}

	async bitmapToUrl(bitmap: ImageBitmap) {
		// await this.queue.enqueue(async (handler) => {
		this.canvas.width = bitmap.width;
		this.canvas.height = bitmap.height;
		this.ctx.drawImage(bitmap, 0, 0);

		return await this.getUrl();
		// });
	}
}

const texture_handler = new TextureHandler();

class SpriteRef {
	static Utility = SpriteUtility;

	queue: QueueChain<SpriteRef> = new QueueChain(this);
	bitmap?: ImageBitmap;

	constructor(public texture: MeowTexture, public id: SpriteID) {}

	/**
	 * Applies effect if bitmap is resolved,
	 * does nothing if it cannot obtain a bitmap
	 */
	public async afterEffect<T>(
		task: (obj: {
			sprite: SpriteRef;
			bitmap: ImageBitmap;
		}) => Promise<T> | T
	): Promise<void> {
		await this.texture.promise(this.id);
		this.bitmap ??= await this.getBitmap();
		const bitmap = this.bitmap;

		if (bitmap == undefined) {
			return;
		}

		await this.queue.enqueue(
			async () =>
				await task({
					sprite: this,
					bitmap,
				})
		);
	}

	getNormalBitmap(): ImageBitmap | undefined {
		const { texture, id } = this;
		if (this.bitmap != undefined) return this.bitmap;
		const pending = texture.pending_sprites[id];
		if (pending != undefined) return pending.bitmap;
	}

	public async getBitmap(): Promise<ImageBitmap | undefined> {
		const { texture, id } = this;
		const bitmap_a = this.getNormalBitmap();

		if (bitmap_a != undefined) {
			return bitmap_a;
		} else if (texture.sprites[id]) {
			const sprite_box = texture.sprites[id];

			return await createImageBitmap(
				texture.canvas,
				sprite_box.x,
				sprite_box.y,
				sprite_box.width,
				sprite_box.height
			);
		}
	}

	urlCallback(callback: (url: string) => void) {
		const { texture, id } = this;

		(async () => {
			await this.texture.promise(id);

			const bitmap = this.getNormalBitmap();

			if (bitmap != undefined) {
				const url = await texture_handler.bitmapToUrl(bitmap);
				callback(url);
				return;
			} else if (texture.sprites[id] != undefined) {
				const url = await texture_handler.selectionToUrl(
					this.texture,
					texture.sprites[id]
				);

				callback(url);
				return;
			}
		})();
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
	livingSource(): CanvasSpriteSource {
		const { id } = this;
		const source: CanvasSpriteSource = SpriteUtility.blankSource(id);

		this.texture.promise(id).then(async () => {
			const { x, y, width, height, data } = this.getSource();
			source.data = data;
			source.x = x;
			source.y = y;
			source.width = width;
			source.height = height;
		});

		return source;
	}

	getSource(): CanvasSpriteSource {
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
		} else if (texture.sprites[id]) {
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

	drawToCanvas(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number
	) {
		const source = this.getSource();

		if (source.data != undefined) {
			ctx.drawImage(
				source.data,
				source.x,
				source.y,
				source.width,
				source.height,
				x,
				y,
				width,
				height
			);
		}
	}

	ready(id: string, ready_for: "image" | "canvas"): boolean {
		switch (ready_for) {
			case "canvas":
				return this.texture.sprites[id] != undefined;
			case "image":
				return (
					this.texture.sprites[id] != undefined ||
					this.texture.pending_sprites[id] != undefined
				);
			default:
				return false;
		}
	}

	async replace(input: ImageInputType): Promise<void> {
		this.bitmap = await SpriteUtility.normalizeBitmap(input);
	}
}

class SpriteStore {
	records: Map<
		string,
		{
			sprite: SpriteRef;
			time: number;
		}
	> = new Map();

	lifetime: number = 30000;
	debounce: DebouncedSignal<() => void> = new DebouncedSignal(1000);

	constructor() {
		this.debounce.on(() => {
			for (const [id, data] of this.records) {
				if (performance.now() > data.time + this.lifetime) {
					console.log("removing ref from store", id);
					this.records.delete(id);
				}
			}
		});
	}

	useOrGen(id: string, callback: () => SpriteRef): SpriteRef {
		const existing = this.records.get(id);
		this.debounce.emit();

		if (existing == undefined) {
			const sprite = callback();
			this.records.set(id, {
				sprite,
				time: performance.now(),
			});
			return sprite;
		} else {
			existing.time = performance.now();
			return existing.sprite;
		}
	}
}

class MeowTexture {
	static Utility = SpriteUtility;
	static Handler = texture_handler;

	sprites: Record<string, SpriteData> = {};
	pending_sprites: Record<string, PendingSprite> = {};
	loading: Record<string, Signal<() => void>> = {};

	canvas: HTMLCanvasElement = document.createElement("canvas");
	ctx: CanvasRenderingContext2D = this.canvas.getContext("2d")!;
	debounce = new DebouncedSignal(100);

	store = new SpriteStore();

	options: {
		host: string;
	} = {
		host: "",
	};

	constructor(options?: { host?: string }) {
		if (options?.host) {
			this.options.host = options.host;
		}

		this.debounce.on(() => {
			texture_handler.repack(this);
		});
	}

	public resolveUrlOrigin(url: string): string {
		url = url.startsWith("/") ? this.options.host + url : url;
		return url;
	}

	public resolveUrl(url: string): string {
		url = this.resolveUrlOrigin(url);
		try {
			const parsed = new URL(url);
			url = parsed.origin + parsed.pathname + parsed.search;
		} catch (e) {}

		return url;
	}

	exists(id: string): boolean {
		return (
			this.sprites[id] != undefined ||
			this.pending_sprites[id] != undefined
		);
	}

	getUrl(url: string) {
		url = this.resolveUrl(url);

		if (this.exists(url)) {
			return new SpriteRef(this, url);
		} else {
			const image = new Image();
			image.src = url;
			image.crossOrigin = "anonymous";
			this.loading[url] ??= new Signal();
			new Promise<void>((resolve) => {
				image.addEventListener("load", () => {
					resolve();
				});
			}).then(() => {
				this.addSprite(url, image);
			});
			return new SpriteRef(this, url);
		}
	}

	async addSprite(id: string, input: ImageInputType) {
		this.loading[id] ??= new Signal();
		const bitmap = await SpriteUtility.normalizeBitmap(input);
		this.pending_sprites[id] = { bitmap };
		this.loading[id].emit();
		delete this.loading[id];
		this.debounce.emit();
	}

	removeSprite(id: string) {
		delete this.sprites[id];
		delete this.pending_sprites[id];
	}

	async promise(id: string) {
		const loading = this.loading[id];

		if (loading != undefined) {
			return new Promise<void>((resolve) => {
				loading.once(resolve);
			});
		}
	}
}

export { SpriteUtility, TextureHandler, SpriteRef, MeowTexture, SpriteStore };
export type { CanvasSpriteSource };
