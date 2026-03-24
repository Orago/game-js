"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputMapHandler = exports.InputMap = exports.InputSource = void 0;
const cursor_js_1 = __importDefault(require("./cursor.js"));
const gamepad_js_1 = require("./gamepad.js");
var InputSource;
(function (InputSource) {
    InputSource[InputSource["KEYBOARD"] = 1] = "KEYBOARD";
    InputSource[InputSource["CURSOR"] = 2] = "CURSOR";
    InputSource[InputSource["GAMEPAD"] = 4] = "GAMEPAD";
})(InputSource || (exports.InputSource = InputSource = {}));
class InputMap {
    /**
     *
     * @param input
     * @param parent - unused
     */
    constructor(input) {
        this.current_maps = new Map();
        this.current_states = {};
        this.active = true;
        this.onceing = new Set();
        if (typeof input === "object") {
            const mappings = Object.entries(input);
            for (const [name, data] of mappings) {
                this.current_maps.set(name, data);
                this.current_states[name] = {
                    sources: 0,
                };
            }
        }
    }
    hasSource(name, source) {
        return (this.current_states[name].sources & source) == source;
    }
    addSource(name, source) {
        this.current_states[name].sources |= source;
    }
    removeSource(name, source) {
        this.current_states[name].sources &= ~source;
    }
    isPressed(name) {
        if (this.active == false) {
            return false;
        }
        if (this.check_hook != undefined) {
            this.check_hook();
        }
        const current_state = this.current_states[name];
        if (current_state.simulated == true) {
            return true;
        }
        else if (current_state.sources != 0) {
            return true;
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
class InputMapHandler {
    constructor(input_map) {
        this.input_map = input_map;
        this.hooks = {};
        this.allowed_gamepads = [];
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
    tickKeyboard(keyboard) {
        const pressed_keys = new Set(Object.keys(keyboard.pressed));
        for (const [name, data] of this.input_map.current_maps) {
            if (data.keyboard == undefined) {
                continue;
            }
            const is_pressed = data.keyboard.some((key) => pressed_keys.has(key));
            if (is_pressed) {
                this.input_map.addSource(name, InputSource.KEYBOARD);
            }
            else {
                this.input_map.removeSource(name, InputSource.KEYBOARD);
            }
        }
    }
    setKeyboard(keyboard) {
        this.removeKeyboard();
        this.keyboard = keyboard;
        this.hooks.keyboard = (key, state) => {
            for (const [name, data] of this.input_map.current_maps) {
                if (data.keyboard != undefined && data.keyboard.includes(key)) {
                    if (state == true) {
                        this.input_map.addSource(name, InputSource.KEYBOARD);
                    }
                    else {
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
    tickCursor(cursor) {
        const pressed_actions = new Set(Array.from(cursor.buttons).map(cursor_js_1.default.buttonToAction));
        for (const [name, data] of this.input_map.current_maps) {
            if (data.cursor == undefined) {
                continue;
            }
            const is_pressed = data.cursor.some((action) => pressed_actions.has(action));
            if (is_pressed) {
                this.input_map.addSource(name, InputSource.CURSOR);
            }
            else {
                this.input_map.removeSource(name, InputSource.CURSOR);
            }
        }
    }
    setCursor(cursor) {
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
        const gamepads = gamepad_js_1.Gamepads.getAll()
            .filter((_, i) => this.allowed_gamepads == null ||
            this.allowed_gamepads.includes(i))
            .filter((_) => _ != null);
        for (const [name, data] of this.input_map.current_maps) {
            if (data.gamepad != undefined) {
                for (const button of data.gamepad) {
                    const is_active = gamepad_js_1.Gamepads.TestAction(gamepads, button, data === null || data === void 0 ? void 0 : data.gamepad_deadzone);
                    if (is_active) {
                        this.input_map.addSource(name, InputSource.GAMEPAD);
                    }
                    else {
                        this.input_map.removeSource(name, InputSource.GAMEPAD);
                    }
                }
            }
        }
    }
    enableGamepads(poll_interval) {
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
exports.InputMapHandler = InputMapHandler;
