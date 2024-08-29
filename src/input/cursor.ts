import Emitter from '@orago/lib/emitter';
import type { Point } from '@orago/lib/vector';

const holdTime = 500;

type cursorInput = Touch | MouseEvent;

function isTouchEvent(input: any): input is TouchEvent {
	const __TouchEvent = typeof TouchEvent != 'undefined' ? TouchEvent : window.TouchEvent;

	return typeof input === 'object' && input instanceof __TouchEvent;
}

function isTouch(input: any): input is Touch {
	const __Touch = typeof Touch != 'undefined' ? Touch : window.Touch;

	return typeof input === 'object' && input instanceof __Touch;
}

export default class Cursor {
	object: HTMLElement;
	events: Emitter = new Emitter();

	pos: Point = { x: 0, y: 0 };
	start: Point = { x: 0, y: 0 };
	end: Point = { x: 0, y: 0 };

	down: boolean = false;
	button: number = -1;
	startTime: number = 0;

	constructor(object: HTMLElement = document.body) {
		this.object = object;

		for (const [method, func] of Object.entries(this.on))
			object.addEventListener(method, func.bind(this));

		this.reInit();
	}

	reInit() {
		this.events.all.clear();

		this
			.events
			.on('move', (x: number, y: number) => this.setPos(x, y))
			.on('start', (e: cursorInput) => this.onStart(e))
			.on('end', (e: cursorInput) => this.onEnd(e));
	}

	setPos(x: number, y: number): void {
		this.pos = this.getPos(x, y);
	}

	getPos(x: number, y: number): Point {
		const { object } = this;
		const b = object.getBoundingClientRect();

		return {
			x: Math.floor(((x - b.left) / (b.right - b.left)) * b.width),
			y: Math.floor(((y - b.top) / (b.bottom - b.top)) * b.height)
		}
	}

	onStart(event: cursorInput): void {
		this.startTime = performance.now();

		setTimeout(() => {
			if (isTouch(event)) {
				if (this.down == true)
					this.events.emit('context');
				else
					this.events.emit('click', event, this);
			}
		}, holdTime);

		if (isTouch(event) != true) {
			switch (event.button) {
				case 0: this.events.emit('click', event, this); break;
				case 1: this.events.emit('middle', event, this); break;
				case 2: this.events.emit('context', event, this); break;
			}

			this.button = event.button;
		}

		this.pos = this.getPos(event.clientX, event.clientY);
		this.start = this.getPos(event.clientX, event.clientY);
		this.down = true;

		this.events.emit('touch', event, this);
	}

	onEnd(event: cursorInput) {
		if (isTouch(event) != true) {
			switch (event.button) {
				case 0: this.events.emit('click-release', event, this); break;
				case 1: this.events.emit('middle-release', event, this); break;
				case 2: this.events.emit('context-release', event, this); break;
			}
		}

		this.end = this.getPos(event.clientX, event.clientY);
		this.down = false;

		this.events.emit('release', event, this);
	}

	on: Record<string, (evt: Event) => any> = {
		click: (e: Event) => e.preventDefault(),
		contextmenu: (e: Event) => e.preventDefault(),

		mousemove: (e: Event) =>
			e instanceof MouseEvent &&
			this.events.emit('move', e.clientX, e.clientY),

		touchmove: (e: Event) =>
			isTouchEvent(e) &&
			this.events.emit('move', e.touches[0].clientX, e.touches[0].clientY),

		mouseup: (e: Event) => this.events.emit('end', e),
		touchend: (e: Event) =>
			isTouchEvent(e) &&
			this.events.emit('end', e.changedTouches[0]),

		mousedown: (e: Event) => this.events.emit('start', e),
		touchstart: (e: Event) =>
			isTouchEvent(e) &&
			this.events.emit('start', e.touches[0]),
	}
}