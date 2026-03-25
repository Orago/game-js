import { Size } from "@orago/lib";
export declare function gridFrame(obj: {
    x: number;
    y: number;
}, frames: number, fps: number): number;
export declare function getFrameCount(rect: Size, gridSize: Size): number;
export declare function gridsheetAnimation(frames: number, currentTime: number, endTime: number): number;
/**
 * Returns an offset vector
 */
export declare function calculateGridWrapOffset(rect: Size, gridSize: Size, frame: number): [x: number, y: number];
