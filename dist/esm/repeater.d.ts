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
    time: number | undefined;
    frame: number;
    paused: boolean;
    RafRef: number | undefined;
    fpsLimit: number;
    actualFps: number;
    delay: number;
    maxFramesPerSecond?: number;
    delta: number;
    private readonly _fpsHandler;
    callback: Function;
    constructor(fpsLimit: number, callback: Function);
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
