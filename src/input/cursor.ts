import Emitter from '@orago/lib/emitter';
import { Vector2 } from '@orago/vector';

const holdTime = 500;

type cursorInput = Touch | MouseEvent;

export default class cursor {
	events: Emitter = new Emitter();
	object: HTMLElement;
	pos: Vector2 = new Vector2();
	down: boolean = false;
	button: number = -1;
	context = {};
	release = {};
	click = {};
	start = { x: 0, y: 0 };
	end = { x: 0, y: 0 };
	startTime: number = 0;

	constructor(object: HTMLElement = document.body) {
		this.object = object;

		for (const [method, func] of Object.entries(this.on)) {
			object.addEventListener(method, func.bind(this));
		}

		this.reInit();
	}

	reInit() {
		this.events.all.clear();

		this.events.on('move', (x: number, y: number) => {
			this.pos = this.getPos(x, y);
		});

		this.events.on('start', (e: cursorInput) => this.onStart(e));
		this.events.on('end', (e: cursorInput) => this.onEnd(e));
	}

	getPos(x: number, y: number): Vector2 {
		const { object } = this;
		const { top, bottom, left, right, width, height } = object.getBoundingClientRect();

		return new Vector2(
			Math.floor(((x - left) / (right - left)) * width),
			Math.floor(((y - top) / (bottom - top)) * height)
		);
	}

	onStart(e: cursorInput) {
		this.startTime = performance.now();

		setTimeout(() => {
			if (window.TouchEvent && e instanceof Touch) {
				if (this.down == true) {
					this.events.emit('context');
				} else {
					this.events.emit('click', e, this);
				}
			}
		}, holdTime);

		if (e instanceof Touch != true) {
			switch (e.button) {
				case 0: this.events.emit('click', e, this); break;
				case 1: this.events.emit('middle', e, this); break;
				case 2: this.events.emit('context', e, this); break;
			}

			this.button = e.button;
		}

		this.pos = this.getPos(e.clientX, e.clientY);
		this.start = this.getPos(e.clientX, e.clientY);
		this.down = true;

		this.events.emit('touch', e, this);
	}

	onEnd(e: cursorInput) {
		if (e instanceof Touch != true) {
			switch (e.button) {
				case 0: this.events.emit('click-release', e, this); break;
				case 1: this.events.emit('middle-release', e, this); break;
				case 2: this.events.emit('context-release', e, this); break;
			}
		}

		this.end = this.getPos(e.clientX, e.clientY);
		this.down = false;

		this.events.emit('release', e, this);
	}

	on: { [key: string]: (evt: Event) => any } = {
		click: (e: Event) => e.preventDefault(),
		contextmenu: (e: Event) => e.preventDefault(),

		mousemove: (e: Event) =>
			e instanceof MouseEvent &&
			this.events.emit('move', e.clientX, e.clientY),

		touchmove: (e: Event) =>
			e instanceof TouchEvent &&
			this.events.emit('move', e.touches[0].clientX, e.touches[0].clientY),

		mouseup: (e: Event) => this.events.emit('end', e),
		touchend: (e: Event) =>
			e instanceof TouchEvent &&
			this.events.emit('end', e.changedTouches[0]),

		mousedown: (e: Event) => this.events.emit('start', e),
		touchstart: (e: Event) =>
			e instanceof TouchEvent &&
			this.events.emit('start', e.touches[0]),
	}
}