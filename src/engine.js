import Emitter from '@orago/lib/emitter';
import { Vector2 } from '@orago/vector';
import { v4 as uuidV4 } from 'uuid';
import { Collision } from './collision.js';
import BrushCanvas from './brush/brush.js';
import cursor from './input/cursor.js';
import keyboard from './input/keyboard.js';
import { Repeater } from './repeater.js';
import { RectBody } from './shapes.js';

const zoomIncrement = .2;

/**
 * @typedef {object} EngineObjectData
 * @property {number} [x] - Horiztonal position
 * @property {number} [y] - Vertical position
 * @property {number} [width] - Width
 * @property {number} [height] - Height
 * @property {number} [priority] - Order to execute or render
 * @property {number} [lifetime] - Expiration date
 */

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

	/**
	 * @type {Engine}
	 */
	engine;

	events = new Emitter();

	/**
	 * @param {Engine} engineRef 
	 * @param {EngineObjectData} data 
	 */
	constructor(engineRef, data = {}) {
		this.engine = engineRef;

		if (typeof data === 'object') {
			if (typeof data.x === 'number') {
				this.x = data.x;
			}

			if (typeof data.y === 'number') {
				this.y = data.y;
			}

			if (typeof data.width === 'number') {
				this.width = data.width;
			}

			if (typeof data.height === 'number') {
				this.height = data.height;
			}

			if (typeof data.priority === 'number') {
				this.priority = data.priority;
			}

			if (typeof data.lifetime === 'number') {
				const endAt = Date.now() + data.lifetime;

				this.events.on('update', () => Date.now() > endAt && this.removeType());
			}
		}
	}

	/**
	 * @param {function(EngineObject): void} fn 
	 * @returns {this}
	 */
	ref(fn) {
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

	/**
	 * 
	 * @param  {...any} tags 
	 * @returns {this}
	 */
	addTo(...tags) {
		this.events.emit('add');

		if (this.engine instanceof Engine)
			this.engine.objects.add(this);

		tags.forEach(tag => tag?.isObjGroup == true && tag.add(this));

		return this;
	}

	get canvas() {
		return this.engine.brush;
	}

	/**
	 * 
	 * @param {function (?EngineObject, ?EngineObject): boolean} restriction 
	 * @returns {boolean}
	 */
	collides(restriction = () => false) {
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
	isObjGroup = true;

	#items = new Set();

	/**
	 * 
	 * @param {Engine} engine 
	 */
	constructor(engine) {
		if (engine?._pc_by_orago != 'orago is the coolest lol')
			throw 'Cannot Create Tag Set';

		this.engine = engine;
	}

	add() {
		for (const item of arguments)
			this.#items.add(item)
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
	/**
	 * List of renderable objects
	 * @type {Set<EngineObject>}
	 */
	objects = new Set();

	zoom = 3;

	offset = new Vector2;

	/**
	 * 
	 * @param {BrushCanvas} brush 
	 */
	constructor(brush) {
		this.brush = brush;


		if (brush.canvas instanceof HTMLCanvasElement != true) {
			throw new Error('Cannot use offscreen canvas for engine');
		}

		const { parentElement } = brush.canvas;

		if (parentElement == null) {
			throw new Error('Cannot assign container');
		}

		brush.canvas.setAttribute('tabindex', '1');

		this.cursor = new cursor(brush.canvas);
		this.keyboard = new keyboard(parentElement);

		this.ticks = new Repeater(64, () => {
			this.frame = this?.ticks?.frame;

			for (const item of this.orderedObjects) {
				item.tick();
			}
		});

		this.ticks.start();

		this.cursor.events.on('click', () => {
			for (const obj of this.orderedObjects) {
				const clicked = this.collision.rectContains(
					{
						x: obj.x,
						y: obj.y,
						w: obj.width,
						h: obj.height
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
		return Array.from(this.objects).toSorted(
			/**
			 * @param {EngineObject} a 
			 * @param {EngineObject} b 
			 * @returns {number}
			 */
			(a, b) =>
				a.priority - b.priority
		);
	}

	collision = Collision;

	/**
	 * 
	 * @param {EngineObjectData} data 
	 * @param {function (EngineObject): void} ref 
	 * @returns {EngineObject}
	 */
	object = (data, ref) =>
		new EngineObject(this, data)
			.ref(ref);

	/**
	 * @param {Vector2 | RectBody} pos 
	 * @param {{
	 *  center?: boolean
	 * }} options 
	 * @returns {Vector2}
	 * @this {Engine}
	 */
	screenToWorld(pos, options) {
		const center = options?.center === true ? this.brush.center() : { x: 0, y: 0 };

		pos.x - 5;

		return new Vector2(
			(pos.x - this.offset.x) * this.zoom + center.x,
			(pos.y - this.offset.y) * this.zoom + center.y
		);
	}

	/**
	 * 
	 * @param {Vector2} pos 
	 * @param {{
	 *  center?: boolean
	 * }} options 
	 * @returns {Vector2}
	 * @this {Engine}
	 */
	worldToScreen(pos, options) {
		const center = options?.center === true ? this.brush.center() : { x: 0, y: 0 };

		return new Vector2(
			(pos.x / this.zoom + this.offset.x) - center.x / this.zoom,
			(pos.y / this.zoom + this.offset.y) - center.y / this.zoom
		);
	}

	get objectGroup() {
		return new createObjectGroup(this);
	}

	/**
	 * 
	 * @param {function (EngineObject): boolean} search 
	 * @returns {Array<EngineObject>}
	 */
	findObjects(search) {
		return Array.from(this.objects).filter(search);
	}

	allowZoom() {
		const eng = this;

		/** @param {WheelEvent} e */
		this.onZoom = function (e) {
			if (e.deltaY > 0 && eng.zoom > zoomIncrement) {
				eng.zoom -= zoomIncrement;
			} else if (e.deltaY < 0 && eng.zoom < 20) {
				eng.zoom += zoomIncrement;
			}
		};

		this.brush.canvas.addEventListener(
			'wheel',
			/** @param {Event} evt */
			evt => {
				if (evt instanceof WheelEvent) {
					if (evt.deltaY > 0 && eng.zoom > zoomIncrement) {
						eng.zoom -= zoomIncrement;
					} else if (evt.deltaY < 0 && eng.zoom < 20) {
						eng.zoom += zoomIncrement;
					}
				}
			},
			false
		);

		/** @type {number} */
		let initialDistance;

		/** @type {number | undefined} */
		let pinch_Start_Scale;

		/** @type {number | undefined} */
		let engine_Mobile_Zoom;

		/**
		 * 
		 * @param {TouchEvent} event 
		 * @returns {number | undefined}
		 */
		function parsePinchScale(event) {
			if (event.touches.length !== 2) {
				return;
			}

			const [touch1, touch2] = event.touches;
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

		this.brush.canvas.addEventListener('touchmove', function handlePinch(event) {
			event.preventDefault();

			if (event instanceof TouchEvent) {
				const scale = parsePinchScale(event);
				if (scale == null || pinch_Start_Scale == null || engine_Mobile_Zoom == null) return;

				eng.zoom = Math.floor(engine_Mobile_Zoom + (scale - pinch_Start_Scale));
			}
		});

		this.brush.canvas.addEventListener('touchend', function handlePinch(event) {
			event.preventDefault();

			engine_Mobile_Zoom = undefined;
			pinch_Start_Scale = undefined;
		});

		return this;
	}

	/**
	 * 
	 * @param {string} url 
	 * @returns {this}
	 */
	setCursor(url) {
		const { canvas } = this.brush;

		if (canvas instanceof HTMLCanvasElement)
			canvas.style.cursor = `url(${url}), pointer`;

		// this.cursor.

		return this;
	}

	destroy() {
		this.keyboard.events.all.clear();
		this.cursor.reInit();

		for (const object of Array.from(this.objects)) {
			object.removeType();
		}
	}
}