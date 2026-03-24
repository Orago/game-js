import { Signal } from "@orago/lib";
export declare class FPS {
    value: number;
    currentIndex: number;
    lastTick: number | undefined;
    samples: number[];
    sampleSize: number;
    constructor(sampleSize?: number);
    tick(): number;
}
export declare class Ticker {
    tick: Signal<(repeater: Ticker) => void>;
    frame: number;
    paused: boolean;
    RafRef: number | undefined;
    fpsLimit: number;
    actualFps: number;
    delay: number;
    maxFramesPerSecond?: number;
    start_time: number;
    timestamp: number;
    delta: number;
    private readonly _fpsHandler;
    constructor(fpsLimit: number);
    loop(timestamp: number): void;
    get setFps(): number;
    get fps(): number;
    set fps(newFps: number);
    /**
     * Restarts the repeater if it's not already running
     */
    start(): void;
    /**
     * Pauses
     */
    pause(paused?: boolean): void;
}
export default Ticker;
