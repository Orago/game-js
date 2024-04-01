"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repeater = exports.FPS = void 0;
class FPS {
    constructor(sampleSize) {
        this.value = 0;
        this.currentIndex = 0;
        this.lastTick = 0;
        this.samples = [];
        this.sampleSize = sampleSize !== null && sampleSize !== void 0 ? sampleSize : 60;
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
exports.FPS = FPS;
class Repeater {
    constructor(fpsLimit, callback) {
        this.frame = -1;
        this.paused = true;
        this.fpsLimit = -1;
        this.actualFps = -1;
        this.fpsLimit = fpsLimit;
        this.delay = 1000 / fpsLimit;
        this.callback = callback;
        this._fpsHandler = new FPS();
    }
    loop(timestamp) {
        if (this.paused) {
            return;
        }
        else if (this.time == null) {
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
    set fps(newFps) {
        if (arguments.length == 0) {
            return;
        }
        this.maxFramesPerSecond = newFps;
        this.delay = 1000;
        this.frame = -1;
        this.time = undefined;
    }
    start() {
        if (this.paused == true) {
            this.paused = false;
            this.RafRef = requestAnimationFrame(this.loop.bind(this));
        }
    }
    pause(paused = !this.paused == true) {
        this.paused = paused;
        if (this.paused === true) {
            if (typeof this.RafRef === 'number') {
                cancelAnimationFrame(this.RafRef);
            }
            this.time = undefined;
            this.frame = -1;
        }
        else {
            this.start();
        }
    }
}
exports.Repeater = Repeater;
exports.default = Repeater;
