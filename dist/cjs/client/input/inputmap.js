"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputMap = void 0;
const gamepad_js_1 = require("./gamepad.js");
class InputMap {
    /**
     *
     * @param input
     * @param parent - unused
     */
    constructor(input, parent = document.body) {
        // this.keyboard = new Keyboard(parent);
        // this.cursor = new Cursor(parent);
        this.current_maps = new Map();
        this.active = true;
        this.onceing = new Set();
        if (typeof input === "object") {
            for (const [name, data] of Object.entries(input)) {
                this.current_maps.set(name, data);
            }
        }
    }
    setKeyboard(keyboard) {
        this.keyboard = keyboard;
        return this;
    }
    setCursor(cursor) {
        this.cursor = cursor;
        return this;
    }
    isPressed(name) {
        var _a, _b;
        if (this.active == false) {
            return false;
        }
        const data = this.current_maps.get(name);
        if ((data === null || data === void 0 ? void 0 : data.simulated) == true) {
            return true;
        }
        if (data === null || data === void 0 ? void 0 : data.cursor) {
            for (const button of data.cursor) {
                if ((_a = this.cursor) === null || _a === void 0 ? void 0 : _a.hasButton(button)) {
                    return true;
                }
            }
        }
        if (data === null || data === void 0 ? void 0 : data.keyboard) {
            for (const button of data.keyboard) {
                if ((_b = this.keyboard) === null || _b === void 0 ? void 0 : _b.isPressed(button)) {
                    return true;
                }
            }
        }
        if (data === null || data === void 0 ? void 0 : data.gamepad) {
            const gamepads = gamepad_js_1.Gamepads.getAll()
                .filter((_, i) => this.allowed_gamepads == null ||
                this.allowed_gamepads.includes(i))
                .filter((_) => _ != null);
            for (const button of data.gamepad) {
                if (gamepad_js_1.Gamepads.TestAction(gamepads, button, data === null || data === void 0 ? void 0 : data.gamepad_deadzone)) {
                    return true;
                }
            }
        }
        return false;
    }
    once(name) {
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
exports.InputMap = InputMap;
