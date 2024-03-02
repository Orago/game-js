import { Box } from '../shapes.js';

export function gridFrame(obj: { x: number; y: number; }, frames: number, fps: number): number {
	const time = performance.now() / 1000;

	return (Math.floor(time / (1 / fps)) + obj.x + obj.y) % Math.max(frames, 1);
}

export function getFrameCount(rect: Box, gridSize: Box): number {
	return (
		(rect.width == gridSize.width ? 0 : rect.width) / gridSize.width +
		(rect.height == gridSize.height ? 0 : rect.height) / gridSize.height
	);
}

export function gridsheetAnimation(frames: number, currentTime: number, endTime: number): number {
	return Math.min(
		Math.floor(
			(currentTime / endTime) * frames
		),
		frames - 1
	);
}

/**
 * Returns an offset vector
 */
export function calculateGridWrapOffset(rect: { width: number; height: number; }, gridSize: { width: number; height: number; }, frame: number): [x: number, y: number] {
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