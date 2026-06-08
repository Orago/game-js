import type { Point } from "@orago/lib";
import { Emitter } from "@orago/lib";
import type { MouseButton } from "./symbols.js";

type CursorInput = Touch | MouseEvent;
// type CursorCalled = (event: Touch | MouseEvent, cursor: Cursor) => void;
type CursorCalled = () => void;
// type CursorAction = "click" | "middle" | "context";

// type ActionPress = Record<CursorAction, CursorCalled> & Record<`${CursorAction}-release`, CursorCalled>;

export interface CursorButtonPressContext {
	which: MouseButton;
	preventDefault: () => void;
}

export interface CursorButtonChangeContext {
	which: MouseButton;
	state: boolean;
	preventDefault: () => void;
}

export type CursorEvents = {
	"button-down": (c: CursorButtonPressContext) => void;
	"button-up": (c: CursorButtonPressContext) => void;
	"button-change": (c: CursorButtonChangeContext) => void;

	move: (x: number, y: number) => void;
	start: (event: Touch | MouseEvent) => void;
	end: (event: Touch | MouseEvent) => void;

	touch: CursorCalled;
	release: CursorCalled;
};

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

export enum CursorButton {
	LEFT = 0,
	MIDDLE = 1,
	RIGHT = 2,
	BACK = 3,
	FORWARD = 4,
	TOUCH = 10,
}

const cursorActionDict: Record<CursorButton, MouseButton> = {
	[CursorButton.LEFT]: "Left",
	[CursorButton.MIDDLE]: "Middle",
	[CursorButton.RIGHT]: "Right",
	[CursorButton.BACK]: "Back",
	[CursorButton.FORWARD]: "Forward",
	[CursorButton.TOUCH]: "Touch",
};

const reverseCursorActionDict: Record<MouseButton, CursorButton> =
	Object.fromEntries(
		Object.entries(cursorActionDict).map((e) => [e[1], Number(e[0])])
	) as any;

export default class Cursor {
	static Button = CursorButton;
	// private static actionDict = cursorActionDict;
	// private static reverseActionDict = reverseCursorActionDict;

	public static buttonToAction(value: CursorButton) {
		return cursorActionDict[value];
	}

	public static getButtonID(event: CursorInput): CursorButton {
		return isTouch(event)
			? CursorButton.TOUCH
			: (event.button as CursorButton);
	}

	// private static actionToButtonID(value: MouseButton) {
	// 	return reverseCursorActionDict[value];
	// }

	public element: HTMLElement;
	public events: Emitter<CursorEvents, true> = new Emitter();

	// state management
	public position: Point = { x: 0, y: 0 };
	public start_position: Point = { x: 0, y: 0 };
	public end_position: Point = { x: 0, y: 0 };
	public buttons: Set<CursorButton> = new Set();
	public mouse_down: boolean = false;
	public touching: boolean = false;
	public start_time: number = 0;

	// systems management
	public alive: boolean = false;
	private bound_events: Set<[HTMLElement, string, (event: Event) => any]> =
		new Set();
	// private _mobile_mode?: 0 | 2;

	constructor(element: HTMLElement = document.body) {
		this.element = element;
		this.reset();
	}

	reconnect(element: HTMLElement) {
		this.element = element;
		this.reset();
	}

	hasButton(which: MouseButton) {
		return this.buttons.has(reverseCursorActionDict[which]);
	}

	init(): this {
		if (this.alive !== false) {
			return this;
		}

		this.alive = true;
		this.reset();
		return this;
	}

	toggleButton(button_int: CursorButton, down: boolean, event: CursorInput) {
		const button: MouseButton = Cursor.buttonToAction(button_int);
		let prevented: boolean = false;
		const preventDefault = () => {
			if (prevented == true) {
				return;
			}
			prevented = true;
			if ("preventDefault" in event) {
				event.preventDefault();
			}
		};
		if (down == true) {
			this.buttons.add(button_int);
			this.events.emit("button-down", { which: button, preventDefault });
		} else {
			this.buttons.delete(button_int);
			this.events.emit("button-up", { which: button, preventDefault });
		}

		this.events.emit("button-change", {
			which: button,
			state: true,
			preventDefault,
		});
	}

	public reset(): this {
		this.dispose();

		for (const [method, func] of Object.entries(this.on)) {
			const fn = func.bind(this);
			this.bound_events.add([this.element, method, fn]);
			this.element.addEventListener(method, fn);
		}

		this.events
			.on("move", (x: number, y: number) => this.setPosition(x, y))
			.on("start", (e: CursorInput) => this.onStart(e))
			.on("end", (e: CursorInput) => this.onEnd(e));
		return this;
	}

	public dispose() {
		this.events.all.clear();
		this.alive = false;

		for (const bound_event of this.bound_events) {
			const [element, method, fn] = bound_event;
			element.removeEventListener(method, fn);
			this.bound_events.delete(bound_event);
		}
	}

	public setPosition(x: number, y: number): void {
		this.position = this.getPosition(x, y);
	}

	public getPosition(x: number, y: number): Point {
		const b = this.element.getBoundingClientRect();

		return {
			x: Math.floor(((x - b.left) / (b.right - b.left)) * b.width),
			y: Math.floor(((y - b.top) / (b.bottom - b.top)) * b.height),
		};
	}

	public onStart(event: CursorInput): void {
		const button_id = Cursor.getButtonID(event);

		this.start_time = performance.now();
		this.position = this.getPosition(event.clientX, event.clientY);
		this.start_position = this.getPosition(event.clientX, event.clientY);
		this.mouse_down = true;

		this.toggleButton(button_id, true, event);
		this.events.emit("touch");
	}

	public onEnd(event: CursorInput) {
		const button_id = Cursor.getButtonID(event);

		this.end_position = this.getPosition(event.clientX, event.clientY);
		this.mouse_down = false;

		this.toggleButton(button_id, false, event);
		this.events.emit("release");
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
