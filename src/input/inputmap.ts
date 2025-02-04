import type Cursor from "./cursor.js";
import type Keyboard from "./keyboard.js";
import type { GamepadAction, KeyboardAction, MouseButton } from "./symbols.js";

import { Gamepads } from "./gamepad.js";

interface InputMapData {
	keyboard?: KeyboardAction[];
	cursor?: MouseButton[];
	gamepad?: GamepadAction[];
	gamepad_deadzone?: number;
}
type MappedKeys = Record<string, InputMapData>;
type Evt<K, Strict extends boolean> = Strict extends true ? keyof K | "*" : keyof K | "*" | (string & {});

export class InputMap<T extends (MappedKeys & {}) = {}, Strict extends boolean = false> {
	current_maps: Map<Evt<T, Strict>, InputMapData> = new Map();
	keyboard?: Keyboard;
	cursor?: Cursor;
	allowed_gamepads?: number[];
	active: boolean = true;
	private onceing: Set<Evt<T, Strict>> = new Set();

	constructor(input?: T, parent: HTMLElement = document.body) {
		// this.keyboard = new Keyboard(parent);
		// this.cursor = new Cursor(parent);

		if (typeof input === "object")
			for (const [name, data] of Object.entries(input))
				this.current_maps.set(name, data);
	}

	setKeyboard(keyboard: Keyboard): this {
		this.keyboard = keyboard;
		return this;
	}

	setCursor(cursor: Cursor): this {
		this.cursor = cursor;
		return this;
	}

	isPressed<K extends Evt<T, Strict>>(name: K): boolean {
		if (this.active == false) return false;

		const data = this.current_maps.get(name);

		if (data?.cursor) {
			for (const button of data.cursor)
				if (this.cursor?.hasButton(button))
					return true;
		}

		if (data?.keyboard) {
			for (const button of data.keyboard)
				if (this.keyboard?.isPressed(button))
					return true;
		}

		if (data?.gamepad) {
			const gamepads = Gamepads
				.getAll()
				.filter((_, i) => (this.allowed_gamepads == null || this.allowed_gamepads.includes(i)))
				.filter(_ => _ != null);

			for (const button of data.gamepad) {
				if (Gamepads.TestAction(gamepads, button, data?.gamepad_deadzone))
					return true;
			}
		}

		return false;
	}

	once<K extends Evt<T, Strict>>(name: K): boolean {
		if (this.active == false) return false;

		const pressed = this.isPressed(name);
		const has = this.onceing.has(name);

		if (has || pressed != true) {
			if (pressed != true && has)
				this.onceing.delete(name);

			return false
		};

		this.onceing.add(name);
		return pressed;
	}
}

