import type { RectangleLike } from "./shapes.js";
export declare function gridFrame(obj: {
    x: number;
    y: number;
}, frames: number, fps: number): number;
export declare function getFrameCount(rect: RectangleLike, gridSize: RectangleLike): number;
export declare function gridsheetAnimation(frames: number, currentTime: number, endTime: number): number;
/**
 * Returns an offset vector
 */
export declare function calculateGridWrapOffset(rect: RectangleLike, gridSize: RectangleLike, frame: number): [x: number, y: number];
