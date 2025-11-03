export declare class FPS {
    value: number;
    currentIndex: number;
    lastTick: number | undefined;
    samples: number[];
    sampleSize: number;
    constructor(sampleSize?: number);
    tick(): number;
}
export declare class Repeater {
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
    callback: (repeater: Repeater) => void;
    constructor(fpsLimit: number, callback: Repeater["callback"]);
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
export default Repeater;
