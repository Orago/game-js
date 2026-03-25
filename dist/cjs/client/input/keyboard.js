"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const emitter_1 = __importDefault(require("@orago/lib/emitter"));
const unions = {
    ShiftLeft: "Shift",
    ShiftRight: "Shift",
    BracketLeft: "Bracket",
    BracketRight: "Bracket",
    ControlLeft: "Control",
    ControlRight: "Control",
    AltLeft: "Alt",
    AltRight: "Alt",
};
class VNodeEventGroup {
    constructor(node) {
        this.node = node;
        this.map = new Map();
        this.node = node;
    }
    on(event, callback) {
        this.map.set(event, callback);
        this.node.events.on(event, callback);
        return this;
    }
    off(event, callback) {
        this.map.delete(event);
        this.node.events.off(event, callback);
        return this;
    }
    clear() {
        for (const [event, callback] of this.map.entries()) {
            this.off(event, callback);
        }
        return this;
    }
}
class Keyboard {
    static formatKeycode(value) {
        return value;
    }
    constructor(element = document.body) {
        this.events = new emitter_1.default();
        // state management
        this.pressed = {};
        this.union = "both";
        // systems management
        this.alive = false;
        this.bound_events = new Set();
        this.isPressed = (key) => { var _a; return ((_a = this.pressed) === null || _a === void 0 ? void 0 : _a[key]) == true; };
        this.intPressed = (key) => this.isPressed(key) ? 1 : 0;
        this.on = {
            keydown: (event) => {
                this.simulateKeyDown(event.code);
            },
            keyup: (event) => {
                this.simulateKeyUp(event.code);
            },
        };
        this.element = element;
    }
    changeKeyState(key, state) {
        this.events.emit("key-change", key, state);
        // Keydown
        if (state == true) {
            this.events.emit("keydown", key);
        }
        else {
            this.events.emit("keyup", key);
        }
    }
    init() {
        if (this.alive !== false) {
            return this;
        }
        this.alive = true;
        this.reset();
        return this;
    }
    reset() {
        this.dispose();
        for (const [method, func] of Object.entries(this.on)) {
            const fn = func.bind(this);
            this.bound_events.add([this.element, method, fn]);
            this.element.addEventListener(method, fn);
        }
    }
    dispose() {
        this.pressed = {};
        this.alive = false;
        for (const bound_event of this.bound_events) {
            const [element, method, fn] = bound_event;
            element.removeEventListener(method, fn);
            this.bound_events.delete(bound_event);
        }
        // if (this.alive !== true) {
        // 	return;
        // }
    }
    /**
     * @deprecated
     */
    get stop() {
        return this.dispose;
    }
    simulateKeyDown(keycode) {
        keycode = Keyboard.formatKeycode(keycode);
        this.pressed[keycode] = true;
        const alt = unions === null || unions === void 0 ? void 0 : unions[keycode];
        if (this.union != "split") {
            if (alt != null) {
                this.simulateKeyDown(alt);
            }
        }
        if (this.union == "joint" && alt != undefined) {
            return;
        }
        this.changeKeyState(keycode, true);
        this.events.emit("keydown", keycode);
    }
    simulateKeyUp(keycode) {
        keycode = Keyboard.formatKeycode(keycode);
        delete this.pressed[keycode];
        const alt = unions === null || unions === void 0 ? void 0 : unions[keycode];
        if (this.union != "split") {
            if (alt != null) {
                this.simulateKeyUp(alt);
            }
        }
        if (this.union == "joint" && alt != undefined) {
            return;
        }
        // this.events.emit("Up-" + keycode as any);
        this.changeKeyState(keycode, false);
        this.events.emit("keyup", keycode);
    }
    anyPressed(...args) {
        return args.some(this.isPressed);
    }
    mapInt(...keys) {
        const keyMap = (key) => [
            key,
            this.intPressed(key),
        ];
        return Object.fromEntries(keys.map(keyMap));
    }
    applyKeys(keys) {
        for (const [key, value] of Object.entries(keys)) {
            if (value === true) {
                this.simulateKeyDown(key);
            }
            else {
                this.simulateKeyUp(key);
            }
        }
    }
}
exports.default = Keyboard;
