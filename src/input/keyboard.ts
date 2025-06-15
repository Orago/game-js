import { KeyboardAction, SideActionJoint, SidedAction } from "./symbols.js";
import Emitter from "@orago/lib/emitter";
import { VNode } from "@orago/dom";

// type KeyboardActions = "Down-" | "Up-"
// type KeyboardCharEvents = Record<Lowercase<`${KeyboardActions}${KeyboardAction}`>, () => void>;
type KeyboardEvents = {
	keydown: (char: KeyboardAction) => void;
	keyup: (char: KeyboardAction) => void;
};

const unions: Record<SidedAction, SideActionJoint> = {
	ShiftLeft: "Shift",
	ShiftRight: "Shift",
	BracketLeft: "Bracket",
	BracketRight: "Bracket",
	ControlLeft: "Control",
	ControlRight: "Control",
	AltLeft: "Alt",
	AltRight: "Alt",
};

type KeyboardUnionMode = "both" | "split" | "joint";

class VNodeEventGroup {
	map: Map<string, Function> = new Map();

	constructor(private node: VNode) {
		this.node = node;
	}

	public on(event: string, callback: Function): this {
		this.map.set(event, callback);
		this.node.events.on(event, callback);
		return this;
	}

	public off(event: string, callback?: Function): this {
		this.map.delete(event);
		this.node.events.off(event, callback);
		return this;
	}

	public clear(): this {
		for (const [event, callback] of this.map.entries()) {
			this.off(event, callback);
		}
		return this;
	}
}

export default class Keyboard {
	private static formatKeycode(value: string): KeyboardAction {
		return value as KeyboardAction;
	}

	public object: VNode;
	public readonly events: Emitter<KeyboardEvents, true> = new Emitter();

	/* Keys pressed */
	public pressed: Partial<Record<KeyboardAction, boolean>> = {};
	public alive: boolean = false;
	public union: KeyboardUnionMode = "both";

	public event_group?: VNodeEventGroup;

	constructor(element: HTMLElement = document.body) {
		this.object = new VNode(element);
		this.event_group = new VNodeEventGroup(this.object);
	}

	attatch(node: VNode) {
		this.dispose();
		this.object = node;
		this.event_group = new VNodeEventGroup(this.object);

		this.event_group
			.on("keydown", (event: KeyboardEvent) => {
				this.simulateKeyDown(event.code as KeyboardAction);
			})
			.on("keyup", (event: KeyboardEvent) => {
				this.simulateKeyUp(event.code as KeyboardAction);
			});
	}

	init() {
		if (this.alive !== false) {
			return;
		}

		this.alive = true;
		this.attatch(this.object);
	}

	public get stop() {
		return this.dispose;
	}

	public dispose() {
		if (this.event_group != undefined) {
			this.event_group.clear();
		}

		this.pressed = {};
		this.alive = false;

		// if (this.alive !== true) {
		// 	return;
		// }
	}

	public simulateKeyDown(keycode: KeyboardAction) {
		keycode = Keyboard.formatKeycode(keycode);

		this.pressed[keycode] = true;

		const alt = unions?.[keycode as SidedAction];
		if (this.union != "split") {
			if (alt != null) this.simulateKeyDown(alt);
		}

		if (this.union == "joint" && alt != undefined) {
			return;
		}

		this.events.emit("keydown", keycode);
	}

	public simulateKeyUp(keycode: KeyboardAction) {
		keycode = Keyboard.formatKeycode(keycode);
		delete this.pressed[keycode];

		const alt = unions?.[keycode as SidedAction];
		if (this.union != "split") {
			if (alt != null) this.simulateKeyUp(alt);
		}

		if (this.union == "joint" && alt != undefined) {
			return;
		}

		// this.events.emit("Up-" + keycode as any);
		this.events.emit("keyup", keycode);
	}

	public anyPressed(...args: KeyboardAction[]): boolean {
		return args.some(this.isPressed);
	}

	public isPressed = (key: KeyboardAction): boolean =>
		this.pressed?.[key] == true;

	public intPressed = (key: KeyboardAction): 0 | 1 =>
		this.isPressed(key) ? 1 : 0;

	public mapInt(...keys: KeyboardAction[]): Record<string, number> {
		const keyMap = (key: KeyboardAction): [KeyboardAction, 0 | 1] => [
			key,
			this.intPressed(key),
		];

		return Object.fromEntries(keys.map(keyMap));
	}

	public applyKeys(keys: Partial<Record<KeyboardAction, boolean>>) {
		for (const [key, value] of Object.entries(keys)) {
			if (value === true) this.simulateKeyDown(key as KeyboardAction);
			else this.simulateKeyUp(key as KeyboardAction);
		}
	}
}
