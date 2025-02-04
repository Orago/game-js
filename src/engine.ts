import type { Point } from "@orago/lib/vector";

import { ECS } from "@orago/ecs";
import BrushCanvas from "./brush/brush.js";
import { Collision } from "./collision.js";
import Cursor from "./input/cursor.js";
import Keyboard from "./input/keyboard.js";
import { LegacyEntity, LegacySystem } from "./plugins/legacy.js";
import { Repeater } from "./repeater.js";
import { newNode as node, ProxyNode } from "@orago/dom";


// const zoomIncrement = .2;

interface EngineObjectData {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	priority?: number;
	lifetime?: number;
	// options?: {
	// 	zoom?: boolean;
	// 	offset?: boolean;
	// }
}

function screenToWorld(
	screen: Point,
	options?: {
		center?: Point;
		offset?: Point;
		zoom?: number
	}
): Point {
	const center = options?.center ?? { x: 0, y: 0 };
	const offset = options?.offset ?? { x: 0, y: 0 };
	const zoom = options?.zoom ?? 1;

	return {
		x: (screen.x - center.x) / zoom + offset.x,
		y: (screen.y - center.y) / zoom + offset.y
	};
}

function worldToScreen(
	world: Point,
	options?: {
		center?: Point;
		offset?: Point;
		zoom?: number
	}
): Point {
	const center = options?.center ?? { x: 0, y: 0 };
	const offset = options?.offset ?? { x: 0, y: 0 };
	const zoom = options?.zoom ?? 1;

	return {
		x: (world.x - offset.x) * zoom + center.x,
		y: (world.y - offset.y) * zoom + center.y
	};
}


/**
 * Engine Object
 * ! SHOULD NOT BE USED ON IT"S OWN
 * @class
 */
class EngineObject extends LegacyEntity {
	// id = uuidV4();
	public x = 0;
	public y = 0;
	public width = 0;
	public height = 0;

	public enabled = true;
	public visible = true;
	public engine: Engine;
	// options: {
	// 	zoom: boolean;
	// 	offset: boolean;
	// } = {
	// 		zoom: false,
	// 		offset: false,
	// 	};

	// events = new Emitter();

	constructor(engineRef: Engine, data: EngineObjectData = {}) {
		super(engineRef.ecs);
		this.engine = engineRef;

		if (typeof data === "object") {
			if (typeof data.x === "number") this.x = data.x;
			if (typeof data.y === "number") this.y = data.y;
			if (typeof data.width === "number") this.width = data.width;
			if (typeof data.height === "number") this.height = data.height;
			if (typeof data.priority === "number") this.priority = data.priority;

			if (typeof data.lifetime === "number") {
				const endAt = Date.now() + data.lifetime;

				this.events.on(
					"update",
					() =>
						Date.now() > endAt && this.removeType()
				);
			}
		}
	}

	ref(fn: (arg0: this) => void): this {
		fn.bind(this)(this);

		return this;
	}

	tick() {
		this.events.emit("update");
		this.events.emit("render");
	}

	removeType() {
		this.events.emit("remove");
		this.events.all.clear();

		if (this.engine instanceof Engine) {
			this.engine.objects.delete(this);
		}
	}

	addTo(...tags: any[]): this {
		// this.events.emit("add");

		// if (this.engine instanceof World) {
		// 	this.engine.objects.add(this);
		// }

		// tags.forEach(tag => tag?.isObjGroup == true && tag.add(this));

		return this;
	}

	toScreen() {
		const pos = this.engine.worldToScreen({ x: this.x, y: this.y });

		return {
			x: pos.x,
			y: pos.y,
			width: this.width * this.engine.zoom,
			height: this.height * this.engine.zoom
		}
	}

	get canvas() {
		return this.engine.brush;
	}

	collides(restriction: (arg0: EngineObject | null, arg1: EngineObject | null) => boolean = () => false): boolean {
		for (const otherObj of this.engine.objects.values()) {
			if (
				this != otherObj &&
				restriction(this, otherObj)
			) return true;
		}

		return false;
	}

	enable() {
		this.visible = true;
		this.enabled = true;
	}

	disable() {
		this.visible = false;
		this.enabled = false;
	}
}

export default class Engine {
	static screenToWorld = screenToWorld;
	static worldToScreen = worldToScreen;
	static Object = EngineObject;
	static ECS: typeof ECS = ECS;

	static display(engine: Engine, parent: ProxyNode | HTMLElement) {
		const fullFloatStyling = {
			position: "absolute",
			top: 0,
			left: 0,
			width: "100%",
			height: "100%"
		};

		new ProxyNode(engine.brush.canvas)
			.styles(fullFloatStyling);

		const el = ProxyNode.extractEl(engine.dom);

		if (ProxyNode.extractEl(parent)?.contains(el) != true)
			parent.append(el);

		engine.dom.focus();
	}

	public ecs: ECS = new ECS();
	public legacy = new LegacySystem(this.ecs, this);

	/** List of renderable objects */
	public objects: Set<EngineObject> = new Set();
	public offset: Point = { x: 0, y: 0 };
	public zoom: number = 3;

	public brush: BrushCanvas;
	public cursor: Cursor;
	public keyboard: Keyboard;
	public ticks: Repeater;
	public frame: number = 0;

	public dom = node.div;
	public ui = node.div;

	constructor(brush: BrushCanvas) {
		this.brush = brush;
		this.ecs.addSystem(this.legacy);

		this.brush.canvas.setAttribute("tabindex", "1");

		this.dom.append(this.brush.canvas, this.ui);
		this.cursor = new Cursor(this.brush.canvas);
		this.keyboard = new Keyboard(this.dom.element as HTMLElement);

		this.ticks = new Repeater(64, () => {
			this.ecs.update();
			this.frame = this?.ticks?.frame;
		});

		this.ticks.start();
	}

	public collision = Collision;

	public object = (
		data: EngineObjectData,
		ref: (arg0: LegacyEntity) => void
	): LegacyEntity => {
		const entity = new LegacyEntity(this.ecs);

		if (data.priority != null)
			entity.priority = data.priority;

		ref(entity);

		return entity;
	}

	public screenToWorld(
		point: Point,
		options?: {
			center?: boolean;
		}
	): Point {
		return screenToWorld(
			point,
			{
				center: options?.center === true ? this.brush.center() : { x: 0, y: 0 },
				offset: this.offset,
				zoom: this.zoom
			}
		);
	}

	public worldToScreen(
		point: Point,
		options?: {
			center?: boolean;
		}
	): Point {
		return worldToScreen(
			point,
			{
				center: options?.center === true ? this.brush.center() : { x: 0, y: 0 },
				offset: this.offset,
				zoom: this.zoom
			}
		);
	}

	public setCursor(url: string): this {
		this.dom.styles({ cursor: `url(${url}), pointer` });
		return this;
	}

	public destroy() {
		this.keyboard.events.all.clear();
		this.cursor.init();

		/* Queue for deletion */
		this.ecs.killEntities();
		this.ecs.killSystems();
		/* Do final run / deletion */
		this.ecs.update();
		this.ecs.addSystem(this.legacy);
		/* Wipe the canvas */
		this.brush.clear();

		for (const object of Array.from(this.objects))
			object.removeType();
	}
}