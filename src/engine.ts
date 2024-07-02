import Emitter from '@orago/lib/emitter';
import { Vector2, Position2D } from '@orago/vector';
import { v4 as uuidV4 } from 'uuid';
import { Collision } from './collision.js';
import BrushCanvas from './brush/brush.js';
import Cursor from './input/cursor.js';
import Keyboard from './input/keyboard.js';
import { Repeater } from './repeater.js';

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
	pos: Position2D,
	options?: {
		center?: Position2D;
		offset?: Position2D;
		zoom?: number
	}
): Vector2 {
	const center = options?.center ?? { x: 0, y: 0 };
	const offset = options?.offset ?? { x: 0, y: 0 };
	const zoom = options?.zoom ?? 1;

	return new Vector2(
		(pos.x - offset.x) * zoom + center.x,
		(pos.y - offset.y) * zoom + center.y
	);
}

export function worldToScreen(
	pos: Position2D,
	options?: {
		center?: Position2D;
		offset?: Position2D;
		zoom?: number
	}
): Vector2 {
	const center = options?.center ?? { x: 0, y: 0 };
	const offset = options?.offset ?? { x: 0, y: 0 };
	const zoom = options?.zoom ?? 1;

	return new Vector2(
		(pos.x + offset.x) * zoom + (center.x / zoom),
		(pos.y + offset.y) * zoom + (center.y / zoom)
	);
}


/**
 * Engine Object
 * ! SHOULD NOT BE USED ON IT'S OWN
 * @class
 */
export class EngineObject {
	id = uuidV4();
	x = 0;
	y = 0;
	width = 0;
	height = 0;

	priority = 1;
	enabled = true;
	visible = true;
	engine: Engine;
	// options: {
	// 	zoom: boolean;
	// 	offset: boolean;
	// } = {
	// 		zoom: false,
	// 		offset: false,
	// 	};

	events = new Emitter();

	constructor(engineRef: Engine, data: EngineObjectData = {}) {
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

		if (this.engine instanceof Engine) {
			this.engine.objects.delete(this);
		}
	}

	addTo(...tags: any[]): this {
		this.events.emit('add');

		if (this.engine instanceof Engine) {
			this.engine.objects.add(this);
		}

		tags.forEach(tag => tag?.isObjGroup == true && tag.add(this));

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
	engine: Engine;
	isObjGroup = true;
	#items: Set<EngineObject> = new Set();

	constructor(engine: Engine) {
		if (engine?._pc_by_orago != 'orago is the coolest lol') {
			throw 'Cannot Create Tag Set';
		}

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

export default class Engine {
	_pc_by_orago = 'orago is the coolest lol';

	/** List of renderable objects */
	objects: Set<EngineObject> = new Set();
	offset: Vector2 = new Vector2;
	zoom: number = 3;

	brush: BrushCanvas;
	cursor: Cursor;
	keyboard: Keyboard;
	ticks: Repeater;
	frame: number = 0;

	// objectEvents = new WeakMap<EngineObject, Emitter>;

	constructor(brush: BrushCanvas) {
		this.brush = brush;

		if (brush.canvas instanceof HTMLCanvasElement != true) {
			throw new Error('Cannot use offscreen canvas for engine');
		} else if (brush.canvas.parentElement == null) {
			throw new Error('Cannot assign container');
		}

		brush.canvas.setAttribute('tabindex', '1');

		this.cursor = new Cursor(brush.canvas);
		this.keyboard = new Keyboard(brush.canvas.parentElement);

		this.ticks = new Repeater(64, () => {
			this.frame = this?.ticks?.frame;

			for (const item of this.orderedObjects) {
				item.tick();
			}
		});

		this.ticks.start();

		this.cursor.events.on('click', () => {
			for (const obj of this.orderedObjects) {
				const screenObj = obj.toScreen();

				const clicked = this.collision.rectContains(
					{
						x: screenObj.x,
						y: screenObj.y,
						w: screenObj.width,
						h: screenObj.height
					},
					this.cursor.pos
				);

				if (clicked == true && obj.enabled) {
					obj.events.emit('click', this.cursor.pos);

					// if (typeof obj.whileClick == 'function')
					//   while (this.cursor.down == true)
					//     obj.whileClick(this.cursor.pos);

					// if (obj.button == true) break;
				}
			}
		});
	}

	get orderedObjects() {
		return Array.from(this.objects).sort(
			(a: EngineObject, b: EngineObject): number =>
				a.priority - b.priority
		);
	}

	collision = Collision;


	object = (
		data: EngineObjectData,
		ref: (arg0: EngineObject) => void
	): EngineObject =>
		new EngineObject(this, data)
			.ref(ref);

	screenToWorld(
		pos: Position2D,
		options?: {
			center?: boolean;
		}
	): Vector2 {
		return screenToWorld(
			pos,
			{
				center: options?.center === true ? this.brush.center() : { x: 0, y: 0 },
				offset: this.offset,
				zoom: this.zoom
			}
		)
	}

	worldToScreen(
		pos: Position2D,
		options?: {
			center?: boolean;
		}
	): Vector2 {
		return worldToScreen(
			pos,
			{
				center: options?.center === true ? this.brush.center() : { x: 0, y: 0 },
				offset: this.offset,
				zoom: this.zoom
			}
		);
	}

	get objectGroup() {
		return new createObjectGroup(this);
	}

	findObjects(search: (arg0: EngineObject) => boolean): Array<EngineObject> {
		return Array.from(this.objects).filter(search);
	}

	allowZoom() {
		const eng = this;

		this.brush.canvas.addEventListener(
			'wheel',
			(evt: Event) => {
				if (evt instanceof WheelEvent) {
					if (evt.deltaY > 0 && eng.zoom > zoomIncrement)
						eng.zoom -= zoomIncrement;
					else if (evt.deltaY < 0 && eng.zoom < 20)
						eng.zoom += zoomIncrement;
				}
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

				if (event instanceof TouchEvent) {
					const scale = parsePinchScale(event);

					if (
						scale == null ||
						pinch_Start_Scale == null ||
						engine_Mobile_Zoom == null
					)
						return;

					eng.zoom = Math.floor(engine_Mobile_Zoom + (scale - pinch_Start_Scale));
				}
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

		for (const object of Array.from(this.objects))
			object.removeType();
	}
}