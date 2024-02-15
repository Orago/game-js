import Emitter from '@orago/lib/emitter';
import { Vector2 } from '@orago/vector';

const holdTime = 500;

export default class cursor {
	/**
	 * @type {Emitter}
	 */
	events = new Emitter();

	/**
	 * 
	 * @param {HTMLElement} object 
	 */
	constructor(object = document.body) {
		this.object = object;

		for (const [method, func] of Object.entries(this.on))
			object.addEventListener(method, func.bind(this));

		this.reInit();
	}

	reInit() {
		this.events.all.clear();

		this.events.on('move', (x, y) => {
			this.pos = this.getPos(x, y);
		});

		this.events.on('start', e => this.onStart(e));
		this.events.on('end', e => this.onEnd(e));
	}

	pos = new Vector2();

	down = false;
	button = -1;
	context = {};
	release = {};
	click = {};
	start = { x: 0, y: 0 };
	end = { x: 0, y: 0 };

	/**
	 * @param {number} x 
	 * @param {number} y
	 * @returns {Vector2}
	 */
	getPos(x, y) {
		const { object } = this;
		const { top, bottom, left, right, width, height } = object.getBoundingClientRect();

		return new Vector2(
			Math.floor(((x - left) / (right - left)) * width),
			Math.floor(((y - top) / (bottom - top)) * height)
		);
	}

	/**
	 * 
	 * @param {Event} e 
	 */
	onStart(e) {
		// if ()
		this.startTime = performance.now();

		setTimeout(() => {
			if (window.TouchEvent && e instanceof Touch) {
				if (this.down == true) this.events.emit('context');
				else this.events.emit('click', e, this);
			}
		}, holdTime);

		if (e instanceof Touch != true) {
			switch (e?.which) {
				case 1: this.events.emit('click', e, this); break;
				case 1: this.events.emit('middle', e, this); break;
				case 3: this.events.emit('context', e, this); break;
			}
		}

		this.pos = this.getPos(e.clientX, e.clientY);
		this.start = this.getPos(e.clientX, e.clientY);
		this.button = e.button;
		this.down = true;

		this.events.emit('touch', e, this);
	}

	onEnd(e) {
		if (e instanceof Touch != true) {
			switch (e?.which) {
				case 1: this.events.emit('click-release', e, this); break;
				case 1: this.events.emit('middle-release', e, this); break;
				case 3: this.events.emit('context-release', e, this); break;
			}
		}

		this.end = this.getPos(e.clientX, e.clientY);
		this.down = false;
	}

	on = {
		click: e => e.preventDefault(),
		contextmenu: e => e.preventDefault(),

		mousemove: e => this.events.emit('move', e.clientX, e.clientY),
		touchmove: e => this.events.emit('move', e.touches[0].clientX, e.touches[0].clientY),

		mouseup: e => this.events.emit('end', e),
		touchend: e => this.events.emit('end', e.changedTouches[0]),

		mousedown: e => this.events.emit('start', e),
		touchstart: e => this.events.emit('start', e.touches[0]),
	}
}