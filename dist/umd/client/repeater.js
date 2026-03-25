(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@orago/lib"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Ticker = exports.FPS = void 0;
    const lib_1 = require("@orago/lib");
    class FPS {
        value = 0;
        currentIndex = 0;
        lastTick = 0;
        samples = [];
        sampleSize;
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
            for (let i = 0; i < this.samples.length; i++)
                total += this.samples[i];
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
    class Ticker {
        tick = new lib_1.Signal();
        frame = -1;
        paused = true;
        RafRef;
        fpsLimit = -1;
        actualFps = -1;
        delay;
        maxFramesPerSecond;
        start_time = 0;
        timestamp = 0;
        delta = 0;
        _fpsHandler;
        constructor(fpsLimit) {
            this.fpsLimit = fpsLimit;
            this.delay = 1000 / fpsLimit;
            this._fpsHandler = new FPS();
        }
        loop(timestamp) {
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
        set fps(newFps) {
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
        pause(paused = !this.paused == true) {
            if (paused !== true) {
                this.start();
                return;
            }
            else {
                this.paused = paused;
            }
            if (typeof this.RafRef === "number") {
                cancelAnimationFrame(this.RafRef);
            }
            this.start_time = 0;
            this.frame = -1;
        }
    }
    exports.Ticker = Ticker;
    exports.default = Ticker;
});
//# sourceMappingURL=repeater.js.map