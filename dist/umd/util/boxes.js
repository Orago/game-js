(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.gridFrame = gridFrame;
    exports.getFrameCount = getFrameCount;
    exports.gridsheetAnimation = gridsheetAnimation;
    exports.calculateGridWrapOffset = calculateGridWrapOffset;
    function gridFrame(obj, frames, fps) {
        const time = performance.now() / 1000;
        return (Math.floor(time / (1 / fps)) + obj.x + obj.y) % Math.max(frames, 1);
    }
    function getFrameCount(rect, gridSize) {
        return ((rect.width == gridSize.width ? 0 : rect.width) / gridSize.width +
            (rect.height == gridSize.height ? 0 : rect.height) / gridSize.height);
    }
    function gridsheetAnimation(frames, currentTime, endTime) {
        return Math.min(Math.floor((currentTime / endTime) * frames), frames - 1);
    }
    /**
     * Returns an offset vector
     */
    function calculateGridWrapOffset(rect, gridSize, frame) {
        const gridWidth = gridSize?.width ?? 0;
        const gridHeight = gridSize?.height ?? 0;
        // Calculate the number of columns in the grid
        const numCols = Math.ceil(rect.width / gridWidth);
        // Calculate the row and column of the frame based on frame number
        const frameRow = Math.floor(frame / numCols);
        const frameCol = frame % numCols;
        // Calculate the offset of the frame within the grid
        const offsetX = frameCol * gridWidth;
        const offsetY = frameRow * gridHeight;
        return [offsetX, offsetY];
    }
});
//# sourceMappingURL=boxes.js.map