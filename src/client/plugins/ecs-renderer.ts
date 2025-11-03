// import { Component, Entity, System } from "@orago/ecs";
import { Ecs, Engine } from "../index.js";
import { Matrix3D, Meowtrix, Transform } from "../../util/meowtrix.js";
import { PositionComponent } from "../../ecs/physics.js";

export function getCanvasMatrix(matrix: Matrix3D) {
	const a = matrix[0];
	const b = matrix[1];
	const c = matrix[4];
	const d = matrix[5];
	const e = matrix[12];
	const f = matrix[13];

	return [a, b, c, d, e, f] as const;
}

export enum RenderType {
	TEXT,
	RECTANGLE,
	IMAGE,
}

export class RenderingComponent extends Ecs.Component {
	visuals: Set<RenderComponent>;
	constructor(visuals: RenderComponent[]) {
		super();

		this.visuals = new Set(visuals);
	}
}

enum EngineFlags {
	// ALL = -1,
	NONE = 0,
	OFFSET = 1 << 0,
	SCALE = 1 << 1,
}

export class RenderComponent {
	static Flags = EngineFlags;
	static makeFlags(flags: EngineFlags[]) {
		let current = EngineFlags.NONE;

		for (const flag of flags) {
			current |= flag;
		}

		return current;
	}

	transform = new Transform();

	rotation: [x: number, y: number] = [0, 0];
	scale: [x: number, y: number] = [1, 1];
	translate: [x: number, y: number, z: number] = [0, 0, 0];
	layer: number = 1;

	engine_flags: number = 0;
}

export class TextRenderComponent extends RenderComponent {
	public cache_canvas?: HTMLCanvasElement;
	private cache_ctx?: CanvasRenderingContext2D;
	private cache_key?: string;
	public font: string = "sans-serif";

	public options: {
		font: string;
		size: number;
		color: string;
	};

	public width: number = 0;
	public height: number = 0;

	constructor(public text: string, public size: number) {
		super();

		this.options = {
			font: "sans-serif",
			size,
			color: "black",
		};
	}

	preloadCanvas() {
		if (this.cache_canvas == undefined) {
			this.cache_canvas = document.createElement("canvas");
			this.cache_ctx = this.cache_canvas.getContext("2d")!;
		}

		return {
			canvas: this.cache_canvas!,
			ctx: this.cache_ctx!,
		};
	}

	getTextCache(): HTMLCanvasElement {
		const key = `${this.text}_${this.size}_${this.options.font}`;
		if (this.cache_canvas && key === this.cache_key) {
			return this.cache_canvas; // Return cached version
		}

		const obj = this.preloadCanvas();
		const canvas = obj.canvas;
		const ctx = obj.ctx;

		const size = this.options.size;

		const font_state = (ctx.font = `${size}px ${this.options.font}`);

		const metrics = ctx.measureText(this.text);
		canvas.width = metrics.width;
		canvas.height = size;

		const y_diff = size * 1.14 - size;

		ctx.font = font_state;
		ctx.fillStyle = this.options.color;
		ctx.fillText(this.text, 0, size - y_diff);

		this.width = canvas.width;
		this.height = canvas.height;
		this.cache_key = key;

		return canvas;
	}

	// Call this if text changes
	updateText(text: string) {
		if (this.text !== text) {
			this.text = text;
			this.cache_key = undefined; // invalidate cache
		}
	}
}

export class RectangleRenderComponent extends RenderComponent {
	color?: string;

	constructor(
		public width: number,
		public height: number = width,
		color?: string
	) {
		super();
		this.width = width;
		this.height = height;

		this.color = color;
	}
}

export class ImageRenderComponent extends RenderComponent {
	opacity?: number;
	source?: [x: number, y: number, w: number, h: number];
	destination?: [x: number, y: number, w: number, h: number];

	constructor(public image: HTMLImageElement | HTMLCanvasElement) {
		super();
		this.image = image;
	}
}

export class RenderSystem extends Ecs.System {
	public components = new Set([RenderingComponent]);
	public clear: boolean = true;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;

	constructor(public engine: Engine) {
		super();

		this.canvas = engine.brush.canvas;
		this.ctx = engine.brush.ctx;
	}

	update(entities: Set<Ecs.Entity>): void {
		const components: RenderComponent[] = [];

		for (const entity of entities) {
			const rendering_component =
				entity.components.get(RenderingComponent);

			components.push(...rendering_component.visuals);
		}

		this.render(components);
	}

	render(components: RenderComponent[]) {
		components.sort((a, b) => a.layer - b.layer);

		if (this.clear == true) {
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		}
		this.ctx.save();

		let last_matrix: string | null = null;

		for (const comp of components) {
			let current_matrix = comp.transform.getMatrix();

			if (comp.engine_flags & EngineFlags.OFFSET) {
				current_matrix = Meowtrix.multiply(
					current_matrix,
					Meowtrix.translate(
						-this.engine.camera.x,
						-this.engine.camera.y
					)
				);
			}

			const matrix_key = current_matrix.join(",");

			// update matrix when change is noticed
			if (matrix_key !== last_matrix) {
				const new_matrix = getCanvasMatrix(current_matrix);
				this.ctx.setTransform(...new_matrix);
				last_matrix = matrix_key;
			}

			if (comp instanceof RectangleRenderComponent) {
				this.drawRectangle(comp);
			} else if (comp instanceof TextRenderComponent) {
				this.drawText(comp);
			} else if (comp instanceof ImageRenderComponent) {
				this.drawImage(comp);
			}
		}

		this.ctx.restore();
	}

	private drawRectangle(comp: RectangleRenderComponent) {
		this.ctx.fillStyle = comp.color ?? "black";
		this.ctx.fillRect(0, 0, comp.width, comp.height);
	}

	private drawText(comp: TextRenderComponent) {
		const canvas = comp.getTextCache();
		this.ctx.drawImage(canvas, 0, 0);
	}

	private drawImage(comp: ImageRenderComponent) {
		const src = comp.source ?? [0, 0, comp.image.width, comp.image.height];
		const dst = comp.destination ?? [0, 0, src[2], src[3]];

		if (comp.opacity !== undefined) {
			this.ctx.globalAlpha = comp.opacity;
		}

		this.ctx.drawImage(
			comp.image,
			src[0],
			src[1],
			src[2],
			src[3],
			dst[0],
			dst[1],
			dst[2],
			dst[3]
		);

		if (comp.opacity !== undefined) {
			this.ctx.globalAlpha = 1;
		}
	}
}

export class RenderParticleGenerator extends Ecs.Component {
	constructor() {
		super();
	}

	generator(callback: () => RenderComponent) {}
}

export class RenderParticleSystem extends Ecs.System {
	public components: Set<Function> = new Set([
		PositionComponent,
		RenderParticleGenerator,
	]);

	constructor() {
		super();
	}

	update(entities: Set<Ecs.Entity>, dirty: Set<Ecs.Entity>): void {}
}
