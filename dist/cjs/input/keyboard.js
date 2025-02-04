"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const emitter_1 = __importDefault(require("@orago/lib/emitter"));
const dom_1 = require("@orago/dom");
const unions = {
    ShiftLeft: "Shift",
    ShiftRight: "Shift",
    BracketLeft: "Bracket",
    BracketRight: "Bracket",
    ControlLeft: "Control",
    ControlRight: "Control",
    AltLeft: "Alt",
    AltRight: "Alt"
};
class Keyboard {
    static formatKeycode(value) {
        return value;
    }
    constructor(element = document.body) {
        this.events = new emitter_1.default();
        /* Keys pressed */
        this.pressed = {};
        this.alive = false;
        this.union = "both";
        this.isPressed = (key) => { var _a; return ((_a = this.pressed) === null || _a === void 0 ? void 0 : _a[key]) == true; };
        this.intPressed = (key) => this.isPressed(key) ? 1 : 0;
        this.object = new dom_1.ProxyNode(element);
    }
    attatch(proxyNode) {
        this.object.removeListener("kbEvents");
        this.object = proxyNode;
        this.object.addListener({
            kbEvents: {
                keydown: (event) => this.simulateKeyDown(event.code),
                keyup: (event) => this.simulateKeyUp(event.code)
            }
        });
    }
    init() {
        if (this.alive !== false)
            return;
        this.alive = true;
        this.attatch(this.object);
    }
    get stop() { return this.dispose; }
    dispose() {
        if (this.alive !== true)
            return;
        this.alive = false;
        this.pressed = {};
        this.object.removeListener("kbEvents");
    }
    simulateKeyDown(keycode) {
        keycode = Keyboard.formatKeycode(keycode);
        this.pressed[keycode] = true;
        const alt = unions === null || unions === void 0 ? void 0 : unions[keycode];
        if (this.union != "split") {
            if (alt != null)
                this.simulateKeyDown(alt);
        }
        if (this.union == "joint" && alt != undefined) {
            return;
        }
        this.events.emit("keydown", keycode);
    }
    simulateKeyUp(keycode) {
        keycode = Keyboard.formatKeycode(keycode);
        delete this.pressed[keycode];
        const alt = unions === null || unions === void 0 ? void 0 : unions[keycode];
        if (this.union != "split") {
            if (alt != null)
                this.simulateKeyUp(alt);
        }
        if (this.union == "joint" && alt != undefined) {
            return;
        }
        // this.events.emit("Up-" + keycode as any);
        this.events.emit("keyup", keycode);
    }
    anyPressed(...args) {
        return args.some(this.isPressed);
    }
    mapInt(...keys) {
        const keyMap = (key) => [key, this.intPressed(key)];
        return Object.fromEntries(keys.map(keyMap));
    }
    applyKeys(keys) {
        for (const [key, value] of Object.entries(keys)) {
            if (value === true)
                this.simulateKeyDown(key);
            else
                this.simulateKeyUp(key);
        }
    }
}
exports.default = Keyboard;
