import Emitter from '@orago/lib/emitter';
import { ProxyNode } from '@orago/dom';

export default class Keyboard {
	object;
	alive = false;
	pressed = {};
	events = new Emitter;
	anyEvents = {};

	constructor(element = document.body) {
		this.domEvents = [
			['keydown', this.onKD.bind(this)],
			['keyup', this.onKU.bind(this)]
		];

		this.object = new ProxyNode(element);
	}

	onKD(e) {
		return this.simulateKeyDown(e.key);
	}

	onKU(e) {
		return this.simulateKeyUp(e.key);
	}

	get start() { return this.init; }

	init() {
		if (this.alive !== false) return;

		this.alive = true;

		this.object.addListener({
			kbEvents: {
				keydown: e => this.simulateKeyDown(e.key),
				keyup: e => this.simulateKeyUp(e.key)
			}
		});
	}

	get stop() { return this.dispose; }
	dispose() {
		if (this.alive !== true) return;

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

	on(key, [name, func]) {
		const { events } = this;
		key = key.toLowerCase();

		events[key] ??= {};
		events[key][name] = func;
	}

	clearEvents() {

	}

	/**
	 * 
	 * @param {string} key 
	 * @param {string} name 
	 */
	disconnect(key, name) {
		key = key.toLowerCase();

		if (typeof this.events?.[key] == 'object'){
			delete this.events[key][name];
		}
	}

	/**
	 * 
	 * @param  {...string} args 
	 * @returns {boolean}
	 */
	anyPressed(...args) {
		return args.some(this.isPressed);
	}

	/**
	 * 
	 * @param {string} key 
	 * @returns {boolean}
	 */
	isPressed = key =>
		this.pressed[key.toLowerCase()] == true;

	/**
	 * 
	 * @param {string} key 
	 * @returns {0|1}
	 */
	intPressed = key => this.isPressed(key) ? 1 : 0;

	/**
	 * @param  {...string} keys 
	 * @returns {{ [key: string]: number }}
	 */
	mapInt(...keys) {
		/**
		 * @param {string} key 
		 * @returns {[string, 0|1]}
		 */
		const keyMap = key => [key, this.intPressed(key)];

		return Object.fromEntries(
			keys.map(keyMap)
		);
	}


	/**
	 * @param {{[key: string]: boolean}} keys 
	 */
	applyKeys(keys) {
		for (const [key, value] of Object.entries(keys)) {
			if (value === true) {
				this.simulateKeyDown(key);
			} else {
				this.simulateKeyUp(key);
			}
		}
	}
}