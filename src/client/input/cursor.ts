import type { Point } from "@orago/lib/vector";
import Emitter from "@orago/lib/emitter";
import { MouseButton } from "./symbols";

type CursorInput = Touch | MouseEvent;
type CursorCalled = (event: Touch | MouseEvent, cursor: Cursor) => void;
// type CursorAction = "click" | "middle" | "context";

// type ActionPress = Record<CursorAction, CursorCalled> & Record<`${CursorAction}-release`, CursorCalled>;

export type CursorEvents = {
	"button-down": (
		which: MouseButton,
		event: Touch | MouseEvent,
		cursor: Cursor
	) => void;
	"button-up": (
		which: MouseButton,
		event: Touch | MouseEvent,
		cursor: Cursor
	) => void;
	"button-change": (
		which: MouseButton,
		state: boolean,
		event: Touch | MouseEvent
	) => void;
	move: (x: number, y: number) => void;
	start: (event: Touch | MouseEvent) => void;
	end: (event: Touch | MouseEvent) => void;

	touch: CursorCalled;
	release: CursorCalled;
};

type CursorButtonInt = 0 | 1 | 2 | 3 | 4 | 10;

function isTouchEvent(input: any): input is TouchEvent {
	const __TouchEvent =
		typeof TouchEvent != "undefined" ? TouchEvent : window.TouchEvent;

	if (!__TouchEvent) {
		return false;
	} else {
		return typeof input === "object" && input instanceof __TouchEvent;
	}
}

function isTouch(input: any): input is Touch {
	const __Touch = typeof Touch != "undefined" ? Touch : window.Touch;

	if (!__Touch) {
		return false;
	} else {
		return typeof input === "object" && input instanceof __Touch;
	}
}

const cursorActionDict: Record<CursorButtonInt, MouseButton> = {
	0: "Left",
	1: "Middle",
	2: "Right",
	3: "Back",
	4: "Forward",
	10: "Touch",
};

const reverseCursorActionDict: Record<MouseButton, CursorButtonInt> =
	Object.fromEntries(
		Object.entries(cursorActionDict).map((e) => [e[1], Number(e[0])])
	) as any;

export default class Cursor {
	// private static actionDict = cursorActionDict;
	// private static reverseActionDict = reverseCursorActionDict;

	private static buttonToAction(value: CursorButtonInt) {
		return cursorActionDict[value];
	}

	// private static actionToButtonID(value: MouseButton) {
	// 	return reverseCursorActionDict[value];
	// }

	public object: HTMLElement;
	public events = new Emitter<CursorEvents, true>();

	public position: Point = { x: 0, y: 0 };
	public start: Point = { x: 0, y: 0 };
	public end: Point = { x: 0, y: 0 };
	public buttons: Set<CursorButtonInt> = new Set();
	public mouse_down: boolean = false;
	public touching: boolean = false;
	public start_time: number = 0;
	private bound_events: Set<any[]> = new Set();
	// private _mobile_mode?: 0 | 2;

	constructor(object: HTMLElement = document.body) {
		this.object = object;
		this.init();
	}

	reconnect(object: HTMLElement) {
		this.object = object;
		this.init();
	}

	hasButton(which: MouseButton) {
		return this.buttons.has(reverseCursorActionDict[which]);
	}

	public init(): this {
		this.dispose();

		for (const [method, func] of Object.entries(this.on)) {
			const fn = func.bind(this);
			this.bound_events.add([method, fn]);
			this.object.addEventListener(method, fn);
		}

		this.events
			.on("move", (x: number, y: number) => this.setPosition(x, y))
			.on("start", (e: CursorInput) => this.onStart(e))
			.on("end", (e: CursorInput) => this.onEnd(e));
		return this;
	}

	public dispose() {
		this.events.all.clear();

		for (const bound_event of this.bound_events) {
			this.object.removeEventListener(bound_event[0], bound_event[1]);
			this.bound_events.delete(bound_event);
		}
	}

	public setPosition(x: number, y: number): void {
		this.position = this.getPosition(x, y);
	}

	public getPosition(x: number, y: number): Point {
		const { object } = this;
		const b = object.getBoundingClientRect();

		return {
			x: Math.floor(((x - b.left) / (b.right - b.left)) * b.width),
			y: Math.floor(((y - b.top) / (b.bottom - b.top)) * b.height),
		};
	}

	public onStart(event: CursorInput): void {
		this.start_time = performance.now();
		const is_touch = isTouch(event);

		const button: MouseButton = is_touch
			? "Touch"
			: Cursor.buttonToAction(event.button as CursorButtonInt);

		this.events.emit("button-down", button, event, this);
		this.events.emit("button-change", button, true, event);

		if (is_touch) {
			this.buttons.add(10);
		} else {
			this.buttons.add(event.button as CursorButtonInt);
		}

		this.position = this.getPosition(event.clientX, event.clientY);
		this.start = this.getPosition(event.clientX, event.clientY);
		this.mouse_down = true;

		this.events.emit("touch", event, this);
	}

	public onEnd(event: CursorInput) {
		const is_touch = isTouch(event);

		const button: MouseButton = is_touch
			? "Touch"
			: Cursor.buttonToAction(event.button as CursorButtonInt);

		this.events.emit("button-up", button, event, this);
		this.events.emit("button-change", button, false, event);

		if (is_touch) {
			this.buttons.delete(10);
		} else {
			this.buttons.delete(event.button as CursorButtonInt);
		}

		this.end = this.getPosition(event.clientX, event.clientY);
		this.mouse_down = false;

		this.events.emit("release", event, this);
	}

	public on: Record<string, (evt: Event) => any> = {
		click: (e: Event) => e.preventDefault(),
		contextmenu: (e: Event) => e.preventDefault(),

		mousemove: (e: Event) =>
			e instanceof MouseEvent &&
			this.events.emit("move", e.clientX, e.clientY),

		touchmove: (e: Event) =>
			isTouchEvent(e) &&
			this.events.emit(
				"move",
				e.touches[0].clientX,
				e.touches[0].clientY
			),

		mouseup: (e: Event) => this.events.emit("end", e as MouseEvent),
		touchend: (e: Event) => (
			e.preventDefault(),
			isTouchEvent(e) && this.events.emit("end", e.changedTouches[0])
		),
		mousedown: (e: Event) => this.events.emit("start", e as MouseEvent),
		touchstart: (e: Event) =>
			isTouchEvent(e) && this.events.emit("start", e.touches[0]),
	};
}
