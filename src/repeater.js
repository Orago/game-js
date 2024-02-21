export class FPS {
	value = 0;
	currentIndex = 0;

	/** @type {number | undefined} */
	lastTick = 0;

	/** @type {Array<number>} */
	samples = [];

	/**
	 * @param {number} [sampleSize]
	 */
	constructor(sampleSize) {
		this.sampleSize = sampleSize ?? 60;
	}

	tick() {
		if (this.lastTick == null) {
			this.lastTick = performance.now();

			return 0;
		}

		const now = performance.now();
		const delta = (now - this.lastTick) / 1000;
		const currentFPS = 1 / delta;

		this.samples[this.currentIndex] = Math.round(currentFPS);

		let total = 0;

		for (let i = 0; i < this.samples.length; i++) {
			total += this.samples[i];
		}

		const average = Math.round(total / this.samples.length);

		this.value = average;
		this.lastTick = now;
		this.currentIndex++;

		if (this.currentIndex === this.sampleSize) {
			this.currentIndex = 0;
		}

		return this.value;
	}
}

export class Repeater {
	/**
	 * @type {number | undefined}
	 */
	time;

	/**
	 * @type {number}
	 */
	frame = -1;

	/**
	 * @type {boolean}
	 */
	paused = true;

	/**
	 * @type {number | undefined}
	 */
	RafRef;

	/**
	 * @type {number}
	 */
	fpsLimit = -1;

	/**
	 * @type {number}
	 */
	actualFps = -1;

	/**
	 * 
	 * @param {number} fpsLimit 
	 * @param {Function} callback 
	 */
	constructor(fpsLimit, callback) {
		this.fpsLimit = fpsLimit;
		this.delay = 1000 / fpsLimit;
		this.callback = callback;
		this._fpsHandler = new FPS();
	}

	/**
	 * @param {number} timestamp 
	 */
	loop(timestamp) {
		if (this.paused){
			return;
		} else if (this.time == null) {
			this.time = timestamp;
		}

		const seg = Math.floor((timestamp - this.time) / this.delay);

		if (seg > this.frame) {
			this.frame = seg;
			this.actualFps = this._fpsHandler.tick();
			this.callback(this);
		}

		this.RafRef = requestAnimationFrame(this.loop.bind(this));
	}

	get setFps() {
		return this.fpsLimit;
	}

	get fps() {
		return this.actualFps;
	}

	/**
	 * @param {number} newFps 
	 */
	set fps(newFps) {
		if (arguments.length == 0){
			return;
		}

		this.maxFramesPerSecond = newFps;
		this.delay = 1000;
		this.frame = -1;
		this.time = undefined;
	}

	/**
	 * Restarts the repeater if it's not already running
	 */
	start() {
		if (this.paused == true) {
			this.paused = false;
			this.RafRef = requestAnimationFrame(this.loop.bind(this));
		}
	}

	/**
	 * Pauses 
	 * @param {boolean} paused 
	 */
	pause(paused = !this.paused == true) {
		this.paused = paused;

		if (this.paused === true) {
			if (typeof this.RafRef === 'number'){
				cancelAnimationFrame(this.RafRef);
			}

			this.time = undefined;
			this.frame = -1;
		} else {
			this.start();
		}
	}
}

export default Repeater;