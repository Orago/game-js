import { LikeRectangle } from '../shapes.js';
export declare function gridFrame(obj: {
    x: number;
    y: number;
}, frames: number, fps: number): number;
export declare function getFrameCount(rect: LikeRectangle, gridSize: LikeRectangle): number;
export declare function gridsheetAnimation(frames: number, currentTime: number, endTime: number): number;
export declare function calculateGridWrapOffset(rect: LikeRectangle, gridSize: LikeRectangle, frame: number): [x: number, y: number];
