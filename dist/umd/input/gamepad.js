// import Emitter from "@orago/lib/emitter";
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Gamepads = void 0;
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
    const difference = (first, second) => first - second > 0 ? first - second : (first - second) * -1;
    class Gamepads {
        static allowed() {
            return 'navigator' in window && 'getGamepads' in window['navigator'];
        }
        static getAll() {
            if (Gamepads.allowed() == false)
                return [];
            return navigator.getGamepads();
        }
        static getActive() {
            return Gamepads.getAll().filter(e => e != null);
        }
        static TestAction(gamepads, action, minimum = .6) {
            var _a;
            if (gamepads == null || gamepads.length == 0)
                return false;
            for (const gamepad of gamepads) {
                if (gamepad == null)
                    continue;
                const index = Gamepads.mappedButtons[action];
                // Reserved
                if (index < 0) {
                    if (difference(gamepad.axes[0], 0) > minimum) {
                        if (action == "Left-Axis-X")
                            return true;
                        if (action == "Left-Axis-Left" && gamepad.axes[0] < 0)
                            return true;
                        if (action == "Left-Axis-Right" && gamepad.axes[0] > 0)
                            return true;
                    }
                    if (difference(gamepad.axes[1], 0) > minimum) {
                        if (action == "Left-Axis-Y")
                            return true;
                        if (action == "Left-Axis-Up" && gamepad.axes[1] < 0)
                            return true;
                        if (action == "Left-Axis-Down" && gamepad.axes[1] > 0)
                            return true;
                    }
                    if (difference(gamepad.axes[2], 0) > minimum) {
                        if (action == "Right-Axis-X")
                            return true;
                        if (action == "Right-Axis-Left" && gamepad.axes[2] < 0)
                            return true;
                        if (action == "Right-Axis-Right" && gamepad.axes[2] > 0)
                            return true;
                    }
                    if (difference(gamepad.axes[3], 0) > minimum) {
                        if (action == "Right-Axis-Y")
                            return true;
                        if (action == "Right-Axis-Up" && gamepad.axes[3] < 0)
                            return true;
                        if (action == "Right-Axis-Down" && gamepad.axes[3] > 0)
                            return true;
                    }
                }
                const button = (_a = gamepad === null || gamepad === void 0 ? void 0 : gamepad.buttons) === null || _a === void 0 ? void 0 : _a[index];
                if ((button === null || button === void 0 ? void 0 : button.pressed) == true && (button === null || button === void 0 ? void 0 : button.value) > minimum)
                    return true;
            }
            return false;
        }
        static TestButton(gamepads, index, minimum = .6) {
            var _a;
            if (gamepads == null || gamepads.length == 0)
                return false;
            for (const gamepad of gamepads) {
                if (gamepad == null)
                    continue;
                const button = (_a = gamepad === null || gamepad === void 0 ? void 0 : gamepad.buttons) === null || _a === void 0 ? void 0 : _a[index];
                if ((button === null || button === void 0 ? void 0 : button.pressed) == true && (button === null || button === void 0 ? void 0 : button.value) > minimum) {
                    return true;
                }
            }
            return false;
        }
    }
    exports.Gamepads = Gamepads;
    Gamepads.mappedButtons = {
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
        "View": 8,
        "Menu": 9,
        "Left-Stick": 10,
        "Right-Stick": 11,
        "Pad-Up": 12,
        "Pad-Down": 13,
        "Pad-Left": 14,
        "Pad-Right": 15,
        "Home": 16
    };
});
