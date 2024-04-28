import { Rectangle } from '../shapes.js';
export declare function gridFrame(obj: {
    x: number;
    y: number;
}, frames: number, fps: number): number;
export declare function getFrameCount(rect: Rectangle, gridSize: Rectangle): number;
export declare function gridsheetAnimation(frames: number, currentTime: number, endTime: number): number;
export declare function calculateGridWrapOffset(rect: {
    width: number;
    height: number;
}, gridSize: {
    width: number;
    height: number;
}, frame: number): [x: number, y: number];
