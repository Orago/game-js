import Emitter from '@orago/lib/emitter';
import { ProxyNode } from '@orago/dom';
export default class Keyboard {
    constructor(element = document.body) {
        this.alive = false;
        this.pressed = {};
        this.events = new Emitter();
        this.anyEvents = {};
        this.isPressed = (key) => this.pressed[key.toLowerCase()] == true;
        this.intPressed = (key) => this.isPressed(key) ? 1 : 0;
        this.object = new ProxyNode(element);
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
