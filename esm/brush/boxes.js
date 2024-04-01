export function gridFrame(obj, frames, fps) {
    const time = performance.now() / 1000;
    return (Math.floor(time / (1 / fps)) + obj.x + obj.y) % Math.max(frames, 1);
}
export function getFrameCount(rect, gridSize) {
    return ((rect.width == gridSize.width ? 0 : rect.width) / gridSize.width +
        (rect.height == gridSize.height ? 0 : rect.height) / gridSize.height);
}
export function gridsheetAnimation(frames, currentTime, endTime) {
    return Math.min(Math.floor((currentTime / endTime) * frames), frames - 1);
}
export function calculateGridWrapOffset(rect, gridSize, frame) {
    var _a, _b;
    const gridWidth = (_a = gridSize === null || gridSize === void 0 ? void 0 : gridSize.width) !== null && _a !== void 0 ? _a : 0;
    const gridHeight = (_b = gridSize === null || gridSize === void 0 ? void 0 : gridSize.height) !== null && _b !== void 0 ? _b : 0;
    const numCols = Math.ceil(rect.width / gridWidth);
    const frameRow = Math.floor(frame / numCols);
    const frameCol = frame % numCols;
    const offsetX = frameCol * gridWidth;
    const offsetY = frameRow * gridHeight;
    return [offsetX, offsetY];
}
