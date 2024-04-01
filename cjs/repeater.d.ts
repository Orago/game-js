export declare class FPS {
    value: number;
    currentIndex: number;
    lastTick: number | undefined;
    samples: Array<number>;
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
    callback: Function;
    _fpsHandler: FPS;
    maxFramesPerSecond?: number;
    constructor(fpsLimit: number, callback: Function);
    loop(timestamp: number): void;
    get setFps(): number;
    get fps(): number;
    set fps(newFps: number);
    start(): void;
    pause(paused?: boolean): void;
}
export default Repeater;
