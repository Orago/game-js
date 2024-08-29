import Emitter from '@orago/lib/emitter';
import { Vector2 } from '@orago/vector';
import type { Point } from '@orago/vector';
import { v4 as uuidV4 } from 'uuid';
import BrushCanvas from './brush/brush.js';
import { Collision } from './collision.js';
import Cursor from './input/cursor.js';
import Keyboard from './input/keyboard.js';
import { Repeater } from './repeater.js';
import { ECS } from './ecs/ecs.js';
import { LegacyEntity, LegacySystem } from './plugins/legacy.js';

const zoomIncrement = .2;

export interface EngineObjectData {
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



export function screenToWorld(
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

export function worldToScreen(
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
 * ! SHOULD NOT BE USED ON IT'S OWN
 * @class
 */
export class EngineObject extends LegacyEntity {
	// id = uuidV4();
	x = 0;
	y = 0;
	width = 0;
	height = 0;

	enabled = true;
	visible = true;
	engine: World;
	// options: {
	// 	zoom: boolean;
	// 	offset: boolean;
	// } = {
	// 		zoom: false,
	// 		offset: false,
	// 	};

	// events = new Emitter();

	constructor(engineRef: World, data: EngineObjectData = {}) {
		super(engineRef.ecs);
		this.engine = engineRef;

		if (typeof data === 'object') {
			if (typeof data.x === 'number') this.x = data.x;
			if (typeof data.y === 'number') this.y = data.y;
			if (typeof data.width === 'number') this.width = data.width;
			if (typeof data.height === 'number') this.height = data.height;
			if (typeof data.priority === 'number') this.priority = data.priority;

			if (typeof data.lifetime === 'number') {
				const endAt = Date.now() + data.lifetime;

				this.events.on(
					'update',
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
		this.events.emit('update');
		this.events.emit('render');
	}

	removeType() {
		this.events.emit('remove');
		this.events.all.clear();

		if (this.engine instanceof World) {
			this.engine.objects.delete(this);
		}
	}

	addTo(...tags: any[]): this {
		// this.events.emit('add');

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
			) {
				return true;
			}
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

class createObjectGroup {
	engine: World;
	isObjGroup = true;
	#items: Set<EngineObject> = new Set();

	constructor(engine: World) {
		this.engine = engine;
	}

	add() {
		for (const item of arguments) {
			this.#items.add(item)
		}
	}

	kill() {
		for (const item of this.#items) {
			this.engine.objects.delete(item);
			this.#items.delete(item);
		}
	}

	get items() {
		return [...this.#items];
	}
}

export default class World {
	static ECS = ECS;

	ecs: ECS = new ECS();
	legacy = new LegacySystem(this.ecs, this);

	/** List of renderable objects */
	objects: Set<EngineObject> = new Set();
	offset: Point = { x: 0, y: 0 };
	zoom: number = 3;

	brush: BrushCanvas;
	cursor: Cursor;
	keyboard: Keyboard;
	ticks: Repeater;
	frame: number = 0;

	constructor(brush: BrushCanvas) {
		this.brush = brush;
		this.ecs.addSystem(this.legacy);

		if (brush.canvas instanceof HTMLCanvasElement != true)
			throw new Error('Cannot use offscreen canvas for engine');

		if (brush.canvas.parentElement == null)
			throw new Error('Cannot assign container');

		brush.canvas.setAttribute('tabindex', '1');

		this.cursor = new Cursor(brush.canvas);
		this.keyboard = new Keyboard(brush.canvas.parentElement);

		this.ticks = new Repeater(64, () => {
			this.ecs.update();
			this.frame = this?.ticks?.frame;

			// for (const item of this.orderedObjects) {
			// 	item.tick();
			// }
		});

		this.ticks.start();

		// this.cursor.events.on('click', () => {
		// 	for (const obj of this.orderedObjects) {
		// 		if (obj.events.all.has('click') != true)
		// 			continue;

		// 		const screenObj = obj.toScreen();

		// 		const clicked = this.collision.rectContains(
		// 			screenObj,
		// 			this.cursor.pos
		// 		);

		// 		if (clicked == true && obj.enabled) {
		// 			obj.events.emit('click', this.cursor.pos);

		// 			// if (typeof obj.whileClick == 'function')
		// 			//   while (this.cursor.down == true)
		// 			//     obj.whileClick(this.cursor.pos);

		// 			// if (obj.button == true) break;
		// 		}
		// 	}
		// });
	}

	// get orderedObjects() {
	// 	return Array.from(this.objects).sort(
	// 		(a: LegacyEntity, b: LegacyEntity): number =>
	// 			a.priority - b.priority
	// 	);
	// }

	collision = Collision;

	object = (
		data: EngineObjectData,
		ref: (arg0: LegacyEntity) => void
	): LegacyEntity => {

		const entity = new LegacyEntity(this.ecs);

		if (data.priority != null)
			entity.priority = data.priority;

		ref(entity);

		return entity;
	}

	screenToWorld(
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

	worldToScreen(
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

	/**
	 * @deprecated
	 */
	get objectGroup() {
		return new createObjectGroup(this);
	}

	/**
	 * @deprecated
	 */
	findObjects(search: (arg0: EngineObject) => boolean): Array<EngineObject> {
		return Array
			.from(this.objects)
			.filter(search);
	}

	/**
	 * @deprecated
	 */
	allowZoom() {
		const eng = this;

		this.brush.canvas.addEventListener(
			'wheel',
			(evt: Event) => {
				if (evt instanceof WheelEvent != true)
					return;

				if (evt.deltaY > 0 && eng.zoom > zoomIncrement)
					eng.zoom -= zoomIncrement;

				else if (evt.deltaY < 0 && eng.zoom < 20)
					eng.zoom += zoomIncrement;
			},
			false
		);

		let initialDistance: number;
		let pinch_Start_Scale: number | undefined;
		let engine_Mobile_Zoom: number | undefined;

		function parsePinchScale(event: TouchEvent): number | undefined {
			if (event.touches.length !== 2)
				return;

			const [touch1, touch2] = Array.from(event.touches);
			const distance = Math.sqrt(
				(touch2.pageX - touch1.pageX) ** 2 + (touch2.pageY - touch1.pageY) ** 2
			);

			if (initialDistance == null) {
				initialDistance = distance;
				return;
			}

			return distance / initialDistance;
		}

		this.brush.canvas.addEventListener(
			'touchstart',
			function handlePinchStart(event) {
				event.preventDefault();

				if (event instanceof TouchEvent) {
					pinch_Start_Scale = parsePinchScale(event);
					engine_Mobile_Zoom = eng.zoom;
				}
			}
		);

		this.brush.canvas.addEventListener(
			'touchmove',
			function handlePinch(event) {
				event.preventDefault();

				if (event instanceof TouchEvent != true)

					return;

				const scale = parsePinchScale(event);

				if (
					scale == null ||
					pinch_Start_Scale == null ||
					engine_Mobile_Zoom == null
				) return;

				eng.zoom = Math.floor(engine_Mobile_Zoom + (scale - pinch_Start_Scale));

			}
		);

		this.brush.canvas.addEventListener(
			'touchend',
			function handlePinch(event) {
				event.preventDefault();

				engine_Mobile_Zoom = undefined;
				pinch_Start_Scale = undefined;
			}
		);

		return this;
	}

	setCursor(url: string): this {
		const { canvas } = this.brush;

		if (canvas instanceof HTMLCanvasElement)
			canvas.style.cursor = `url(${url}), pointer`;

		return this;
	}

	destroy() {
		this.keyboard.events.all.clear();
		this.cursor.reInit();

		/* Queue for deletion */
		this.ecs.killEntities();

		/* Do final run / deletion */
		this.ecs.update();

		/* Wipe the canvas */
		this.brush.clear();

		for (const object of Array.from(this.objects))
			object.removeType();
	}
}