import Cursor, { type CursorEvents } from "./cursor.js";
import type Keyboard from "./keyboard.js";
import type { GamepadAction, KeyboardAction, MouseButton } from "./symbols.js";
import { Gamepads } from "./gamepad.js";
import type { KeyboardEvents } from "./keyboard.js";

interface InputMapData {
	keyboard?: KeyboardAction[];
	cursor?: MouseButton[];
	gamepad?: GamepadAction[];
	gamepad_deadzone?: number;

	/**
	 * Dangerous
	 * @deprecated
	 */
	simulated?: boolean;
}

export enum InputSource {
	KEYBOARD = 1 << 0,
	CURSOR = 1 << 1,
	GAMEPAD = 1 << 2,
}

interface ActionState {
	// pressed: boolean;
	// just_pressed: boolean;
	// just_released: boolean;
	sources: number; // currently pressed sources
	/** Dangerous */
	simulated?: boolean;
}
type MappedKeys = Record<string, InputMapData>;
type Evt<K, Strict extends boolean> = Strict extends true
	? keyof K | "*"
	: keyof K | "*" | (string & {});

export class InputMap<
	T extends MappedKeys & {} = {},
	Strict extends boolean = false
> {
	current_maps: Map<Evt<T, Strict>, InputMapData> = new Map();
	current_states: Record<Evt<T, Strict>, ActionState> = {} as any;
	active: boolean = true;

	private onceing: Set<Evt<T, Strict>> = new Set();

	/**
	 * This should only be modified by the engine itself
	 */
	check_hook?: Function;

	/**
	 *
	 * @param input
	 * @param parent - unused
	 */
	constructor(input?: T) {
		if (typeof input === "object") {
			const mappings = Object.entries(input) as [
				Evt<T, Strict>,
				InputMapData
			][];
			for (const [name, data] of mappings) {
				this.current_maps.set(name, data);
				this.current_states[name] = {
					sources: 0,
				};
			}
		}
	}

	hasSource<K extends Evt<T, Strict>>(name: K, source: InputSource): boolean {
		return (this.current_states[name].sources & source) == source;
	}

	addSource<K extends Evt<T, Strict>>(name: K, source: InputSource): void {
		this.current_states[name].sources |= source;
	}

	removeSource<K extends Evt<T, Strict>>(name: K, source: InputSource): void {
		this.current_states[name].sources &= ~source;
	}

	isPressed<K extends Evt<T, Strict>>(name: K): boolean {
		if (this.active == false) {
			return false;
		}

		if (this.check_hook != undefined) {
			this.check_hook();
		}

		const current_state = this.current_states[name];

		if (current_state.simulated == true) {
			return true;
		} else if (current_state.sources != 0) {
			return true;
		}

		return false;
	}

	once<K extends Evt<T, Strict>>(name: K): boolean {
		if (this.active == false) {
			return false;
		}

		const pressed = this.isPressed(name);
		const has = this.onceing.has(name);

		if (has || pressed != true) {
			if (pressed != true && has) {
				this.onceing.delete(name);
			}

			return false;
		}

		this.onceing.add(name);
		return pressed;
	}
}

export class InputMapHandler<MP extends InputMap> {
	keyboard?: Keyboard;
	cursor?: Cursor;

	hooks: {
		keyboard?: KeyboardEvents["key-change"];
		cursor?: CursorEvents["button-change"];
		gamepad_poll?: number;
	} = {};

	allowed_gamepads: number[] = [];

	constructor(public input_map: MP) {
		this.input_map = input_map;
		this.input_map.check_hook = () => {
			this.tick();
		};
	}

	tick() {
		if (this.cursor) {
			this.tickCursor(this.cursor);
		}

		if (this.keyboard) {
			this.tickKeyboard(this.keyboard);
		}

		if (this.allowed_gamepads.length > 0) {
			this.updateGamepads();
		}
	}

	tickKeyboard(keyboard: Keyboard) {
		const pressed_keys = new Set(
			Object.keys(keyboard.pressed) as KeyboardAction[]
		);

		for (const [name, data] of this.input_map.current_maps) {
			if (data.keyboard == undefined) {
				continue;
			}
			const is_pressed = data.keyboard.some((key) =>
				pressed_keys.has(key)
			);

			if (is_pressed) {
				this.input_map.addSource(name, InputSource.KEYBOARD);
			} else {
				this.input_map.removeSource(name, InputSource.KEYBOARD);
			}
		}
	}

	setKeyboard(keyboard: Keyboard): this {
		this.removeKeyboard();
		this.keyboard = keyboard;
		this.hooks.keyboard = (key, state) => {
			for (const [name, data] of this.input_map.current_maps) {
				if (data.keyboard != undefined && data.keyboard.includes(key)) {
					if (state == true) {
						this.input_map.addSource(name, InputSource.KEYBOARD);
					} else {
						this.input_map.removeSource(name, InputSource.KEYBOARD);
					}
				}
			}
		};
		this.keyboard.events.on("key-change", this.hooks.keyboard);

		return this;
	}

	removeKeyboard() {
		if (this.hooks.keyboard != undefined) {
			if (this.keyboard != undefined) {
				this.keyboard.events.off("key-change", this.hooks.keyboard);
				delete this.keyboard;
			}

			delete this.hooks.keyboard;
		}
	}

	tickCursor(cursor: Cursor) {
		const pressed_actions = new Set(
			Array.from(cursor.buttons).map(Cursor.buttonToAction)
		);

		for (const [name, data] of this.input_map.current_maps) {
			if (data.cursor == undefined) {
				continue;
			}
			const is_pressed = data.cursor.some((action) =>
				pressed_actions.has(action)
			);

			if (is_pressed) {
				this.input_map.addSource(name, InputSource.CURSOR);
			} else {
				this.input_map.removeSource(name, InputSource.CURSOR);
			}
		}
	}

	setCursor(cursor: Cursor): this {
		this.removeCursor();

		this.cursor = cursor;
		this.hooks.cursor = () => this.tickCursor(cursor);
		this.cursor.events.on("button-change", this.hooks.cursor);

		return this;
	}

	removeCursor() {
		if (this.hooks.cursor != undefined) {
			if (this.cursor != undefined) {
				this.cursor.events.off("button-change", this.hooks.cursor);
				delete this.cursor;
			}

			delete this.hooks.cursor;
		}
	}

	updateGamepads() {
		const gamepads = Gamepads.getAll()
			.filter(
				(_, i) =>
					this.allowed_gamepads == null ||
					this.allowed_gamepads.includes(i)
			)
			.filter((_) => _ != null);

		for (const [name, data] of this.input_map.current_maps) {
			if (data.gamepad != undefined) {
				for (const button of data.gamepad) {
					const is_active = Gamepads.TestAction(
						gamepads,
						button,
						data?.gamepad_deadzone
					);

					if (is_active) {
						this.input_map.addSource(name, InputSource.GAMEPAD);
					} else {
						this.input_map.removeSource(name, InputSource.GAMEPAD);
					}
				}
			}
		}
	}

	enableGamepads(poll_interval: number) {
		this.removeGamepads();
		this.hooks.gamepad_poll = setInterval(() => {
			this.updateGamepads();
		}, poll_interval);
	}

	removeGamepads() {
		if (this.hooks.gamepad_poll != undefined) {
			clearInterval(this.hooks.gamepad_poll);
			delete this.hooks.gamepad_poll;
		}
	}
}
