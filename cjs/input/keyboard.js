"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const emitter_1 = __importDefault(require("@orago/lib/emitter"));
const dom_1 = require("@orago/dom");
class Keyboard {
    constructor(element = document.body) {
        this.alive = false;
        this.pressed = {};
        this.events = new emitter_1.default();
        this.isPressed = (key) => this.pressed[key.toLowerCase()] == true;
        this.intPressed = (key) => this.isPressed(key) ? 1 : 0;
        this.object = new dom_1.ProxyNode(element);
    }
    init() {
        if (this.alive !== false)
            return;
        this.alive = true;
        this.object.addListener({
            kbEvents: {
                keydown: (e) => this.simulateKeyDown(e.key),
                keyup: (e) => this.simulateKeyUp(e.key)
            }
        });
    }
    get stop() { return this.dispose; }
    dispose() {
        if (this.alive !== true)
            return;
        this.alive = false;
        this.object.removeListener('kbEvents');
    }
    simulateKeyDown(keyIn) {
        const key = (keyIn || '').toLowerCase();
        this.pressed[key] = true;
        this.events.emit('key-' + key, key);
    }
    simulateKeyUp(key) {
        delete this.pressed[(key || '').toLowerCase()];
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
