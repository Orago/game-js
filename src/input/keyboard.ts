import Emitter from '@orago/lib/emitter';
import { ProxyNode } from '@orago/dom';

export default class Keyboard {
	object;
	alive = false;
	pressed: {[key: string]: boolean} = {};
	events = new Emitter();
	anyEvents = {};

	constructor(element = document.body) {
		this.object = new ProxyNode(element);
	}

	init() {
		if (this.alive !== false) {
			return;
		}

		this.alive = true;

		this.object.addListener({
			kbEvents: {
				keydown: (e: KeyboardEvent) => this.simulateKeyDown(e.key),
				keyup: (e: KeyboardEvent) => this.simulateKeyUp(e.key)
			}
		});
	}

	get stop() { return this.dispose; }
	dispose() {
		if (this.alive !== true) return;

		this.alive = false;

		this.object.removeListener('kbEvents');
	}

	simulateKeyDown(keyIn: string) {
		const key = (keyIn || '').toLowerCase();

		this.pressed[key] = true;

		this.events.emit('key-' + key, key);
	}

	simulateKeyUp(key: string) {
		delete this.pressed[(key || '').toLowerCase()];
	}

	anyPressed(...args: string[]): boolean {
		return args.some(this.isPressed);
	}

	isPressed = (key: string): boolean =>
		this.pressed[key.toLowerCase()] == true;


	intPressed = (key: string): 0 | 1 => this.isPressed(key) ? 1 : 0;

	mapInt(...keys: string[]): { [key: string]: number; } {
		const keyMap = (key: string): [string, 0 | 1] => [key, this.intPressed(key)];

		return Object.fromEntries(
			keys.map(keyMap)
		);
	}

	applyKeys(keys: { [key: string]: boolean; }) {
		for (const [key, value] of Object.entries(keys)) {
			if (value === true) {
				this.simulateKeyDown(key);
			} else {
				this.simulateKeyUp(key);
			}
		}
	}
}