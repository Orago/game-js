import { Signal } from "@orago/lib";

export class FPS {
	public value: number = 0;
	public currentIndex: number = 0;
	public lastTick: number | undefined = 0;
	public samples: number[] = [];
	public sampleSize: number;

	constructor(sampleSize?: number) {
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

		for (let i = 0; i < this.samples.length; i++) total += this.samples[i];

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

export class Ticker {
	public tick: Signal<(repeater: Ticker) => void> = new Signal();
	public frame: number = -1;
	public paused: boolean = true;
	public RafRef: number | undefined;
	public fpsLimit: number = -1;
	public actualFps: number = -1;
	public delay: number;
	public maxFramesPerSecond?: number;
	public start_time: number = 0;
	public timestamp: number = 0;
	public delta: number = 0;

	private readonly _fpsHandler: FPS;

	constructor(fpsLimit: number) {
		this.fpsLimit = fpsLimit;
		this.delay = 1000 / fpsLimit;
		this._fpsHandler = new FPS();
	}

	loop(timestamp: number) {
		if (this.paused) {
			return;
		}

		if (this.start_time == null) {
			this.start_time = timestamp;
		}

		const seg = Math.floor((timestamp - this.start_time) / this.delay);

		if (seg > this.frame) {
			this.frame = seg;
			this.actualFps = this._fpsHandler.tick();
			this.delta = (timestamp - this.timestamp) / 1000;

			if (timestamp - this.timestamp > 3000) {
				this.delta = 0;
			}
			this.timestamp = timestamp;
			this.tick.emit(this);
		}

		this.RafRef = requestAnimationFrame(this.loop.bind(this));
	}

	get setFps() {
		return this.fpsLimit;
	}

	get fps() {
		return this.actualFps;
	}

	set fps(newFps: number) {
		if (arguments.length == 0) {
			return;
		}

		this.maxFramesPerSecond = newFps;
		this.delay = 1000;
		this.frame = -1;
		this.start_time = 0;
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
	 */
	pause(paused: boolean = !this.paused == true): void {
		if (paused !== true) {
			this.start();
			return;
		} else {
			this.paused = paused;
		}

		if (typeof this.RafRef === "number") {
			cancelAnimationFrame(this.RafRef);
		}

		this.start_time = 0;
		this.frame = -1;
	}
}

export default Ticker;
