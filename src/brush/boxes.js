import { Box } from '../shapes.js';

/**
 * @param {{
 *  x: number,
 *  y: number
 * }} obj 
 * @param {number} frames
 * @param {number} fps 
 * @returns {number}
 */
export function gridFrame(obj, frames, fps) {
	const time = performance.now() / 1000;

	return (Math.floor(time / (1 / fps)) + obj.x + obj.y) % Math.max(frames, 1);
}

/**
 * @param {Box} rect
 * @param {Box} gridSize
 * @returns {number}
 */
export function getFrameCount(rect, gridSize) {
	return (
		(rect.width == gridSize.width ? 0 : rect.width) / gridSize.width +
		(rect.height == gridSize.height ? 0 : rect.height) / gridSize.height
	);
}

/**
 * 
 * @param {number} frames 
 * @param {number} currentTime 
 * @param {number} endTime 
 * @returns {number}
 */
export function gridsheetAnimation(frames, currentTime, endTime) {
	// const age = (Date.now() - tile?.data?.created) / tileInfo.harvestAt;

	return Math.min(
		Math.floor(
			(currentTime / endTime) * frames
		),
		frames - 1
	);
}

/**
 * Returns an offset vector
 * @param {object} rect
 * @param {number} rect.width
 * @param {number} rect.height
 * @param {object} gridSize
 * @param {number} gridSize.width
 * @param {number} gridSize.height
 * @param {number} frame
 * @returns {[x: number, y: number]}
 */
export function calculateGridWrapOffset(rect, gridSize, frame) {
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