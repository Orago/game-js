// import Emitter from "@orago/lib/emitter";

import { GamepadAction } from "./symbols";
type Gamepad = GamepadEvent["gamepad"];

// type GamepadEvents = {
// 	button: (index: number) => void;

// }

// class GamepadInstance {
// 	instance: Gamepad;
// 	gamepad_events = new Emitter<GamepadEvents, true>();

// 	constructor(gamepad: Gamepad) {
// 		this.instance = gamepad;
// 	}
// }
/**
 * Returns the distance between two values
 * @param {number} first
 * @param {number} second
 * @returns {number}
 */
const difference = (first: number, second: number): number =>
	first - second > 0 ? first - second : (first - second) * -1;

export class Gamepads {
	static mappedButtons: Record<GamepadAction, number> = {
		"Left-Axis-Up": -16,
		"Left-Axis-Down": -15,
		"Left-Axis-Left": -14,
		"Left-Axis-Right": -13,

		"Right-Axis-Up": -12,
		"Right-Axis-Down": -11,
		"Right-Axis-Left": -10,
		"Right-Axis-Right": -9,

		"Left-Axis-X": -8,
		"Left-Axis-Y": -7,

		"Right-Axis-X": -6,
		"Right-Axis-Y": -5,

		"Button-1": 0,
		"Button-2": 1,
		"Button-3": 2,
		"Button-4": 3,
		"Left-Shoulder": 4,
		"Right-Shoulder": 5,
		"Left-Trigger": 6,
		"Right-Trigger": 7,
		View: 8,
		Menu: 9,
		"Left-Stick": 10,
		"Right-Stick": 11,
		"Pad-Up": 12,
		"Pad-Down": 13,
		"Pad-Left": 14,
		"Pad-Right": 15,
		Home: 16,
	};

	static allowed() {
		return "navigator" in window && "getGamepads" in window["navigator"];
	}

	static getAll(): (Gamepad | null)[] {
		if (Gamepads.allowed() == false) {
			return [];
		}

		return navigator.getGamepads();
	}

	static getActive(): Gamepad[] {
		return Gamepads.getAll().filter((e) => e != null);
	}

	static TestAction(
		gamepads: Gamepad[],
		action: GamepadAction,
		minimum: number = 0.6
	) {
		if (gamepads == null || gamepads.length == 0) {
			return false;
		}

		for (const gamepad of gamepads) {
			if (gamepad == null) {
				continue;
			}

			const index = Gamepads.mappedButtons[action];

			// Reserved
			if (index < 0) {
				if (difference(gamepad.axes[0], 0) > minimum) {
					if (action == "Left-Axis-X") {
						return true;
					} else if (
						action == "Left-Axis-Left" &&
						gamepad.axes[0] < 0
					) {
						return true;
					} else if (
						action == "Left-Axis-Right" &&
						gamepad.axes[0] > 0
					) {
						return true;
					}
				}

				if (difference(gamepad.axes[1], 0) > minimum) {
					if (action == "Left-Axis-Y") {
						return true;
					} else if (
						action == "Left-Axis-Up" &&
						gamepad.axes[1] < 0
					) {
						return true;
					} else if (
						action == "Left-Axis-Down" &&
						gamepad.axes[1] > 0
					) {
						return true;
					}
				}

				if (difference(gamepad.axes[2], 0) > minimum) {
					if (action == "Right-Axis-X") {
						return true;
					} else if (
						action == "Right-Axis-Left" &&
						gamepad.axes[2] < 0
					) {
						return true;
					} else if (
						action == "Right-Axis-Right" &&
						gamepad.axes[2] > 0
					) {
						return true;
					}
				}

				if (difference(gamepad.axes[3], 0) > minimum) {
					if (action == "Right-Axis-Y") {
						return true;
					} else if (
						action == "Right-Axis-Up" &&
						gamepad.axes[3] < 0
					) {
						return true;
					} else if (
						action == "Right-Axis-Down" &&
						gamepad.axes[3] > 0
					) {
						return true;
					}
				}
			}

			const button = gamepad?.buttons?.[index];

			if (button?.pressed == true && button?.value > minimum) {
				return true;
			}
		}

		return false;
	}

	static TestButton(gamepads: Gamepad[], index: number, minimum = 0.6) {
		if (gamepads == null || gamepads.length == 0) {
			return false;
		}

		for (const gamepad of gamepads) {
			if (gamepad == null) {
				continue;
			}

			const button = gamepad?.buttons?.[index];

			if (button?.pressed == true && button?.value > minimum) {
				return true;
			}
		}

		return false;
	}

	// public connected = new Map<Gamepad, GamepadInstance>();
	// public events: Emitter<{
	// 	init: () => void;
	// 	destroy: () => void;
	// }> = new Emitter();

	// private in_session: boolean = false;
}
