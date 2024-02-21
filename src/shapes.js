import { Vector2 } from '@orago/vector';

export class Box {
	/**
	 * @param {number} containerWidth 
	 * @param {number} containerHeight 
	 * @param {number} rectWidth 
	 * @param {number} rectHeight 
	 * @returns {Box}
	 */
	static scaleToFit(containerWidth, containerHeight, rectWidth, rectHeight) {
		// Calculate aspect ratios
		const containerRatio = containerWidth / containerHeight;
		const rectRatio = rectWidth / rectHeight;

		let scaleFactor = 1;

		// Scale the rectangle to fit within the container
		if (rectRatio > containerRatio)
			scaleFactor = containerWidth / rectWidth;

		else scaleFactor = containerHeight / rectHeight;

		// Calculate the scaled dimensions
		const width = rectWidth * scaleFactor;
		const height = rectHeight * scaleFactor;

		return new Box(width, height);
	}

	/**
	 * 
	 * @param {number} width 
	 * @param {number} height 
	 * @param {number} scale - multiplication factor
	 * @returns {Box}
	 */
	static scale(width, height, scale) {
		width *= scale;
		height *= scale;

		return new Box(width, height);
	}

	/**
	 * @param {Box} obj 
	 * @returns {Box}
	 */
	static FromObj(obj) {
		return new Box(obj.width, obj.height);
	}

	/**
	 * @param {number} width 
	 * @param {number} height 
	 */
	constructor(width, height) {
		this.width = width;
		this.height = height;
	}

	*[Symbol.iterator]() {
		yield this.width;
		yield this.height;
	}

	/**
	 * Upscales rectangle by scale factor
	 * @param {number} scale 
	 * @returns {Box}
	 */
	scaled(scale) {
		return new Box(this.width * scale, this.height * scale);
	}

	/**
	 * @param {{
	 *  width: number,
	 *  height: number
	 * }} param0
	 * @returns {Box}
	 */
	toFit({ width, height } = this) {
		const fit = Box.scaleToFit(
			width,
			height,
			this.width,
			this.height
		);

		return fit;
	}
}

/**
 * @typedef {object} rectWithPosition
 * @property {number} x - Horizontal
 * @property {number} y - Vertical
 * @property {number} width - Width
 * @property {number} height - Height
 */

export class RectBody extends Box {
	/**
	 * @param {RectBody | Box} rect 
	 * @returns {Bound | undefined}
	 */
	static toBoundingBox(rect) {
		if (rect instanceof RectBody) {
			return new Bound(rect.x, rect.y, rect.width, rect.height);
		} else if (rect instanceof Box) {
			return new Bound(0, 0, rect.width, rect.height);
		}
	}

	/**
	 * 
	 * @param {rectWithPosition} parent 
	 * @param {rectWithPosition} child
	 * @returns {boolean}
	 */
	static contains(parent, child) {
		const parentx2 = parent.x + parent.width;
		const parenty2 = parent.y + parent.height;
		const childx2 = child.x + child.width;
		const childy2 = child.y + child.height;

		return parent.x <= child.x && parentx2 >= childx2 && parent.y <= child.y && parenty2 >= childy2;
	}

	/**
	 * 
	 * @param {RectBody} parent 
	 * @param {RectBody | Box} child 
	 * @returns {RectBody}
	 */
	static centered(parent, child) {
		return new RectBody(
			parent.x + (parent.width - child.width) / 2,
			parent.y + (parent.height - child.height) / 2
		);
	}

	/**
	 * 
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} width 
	 * @param {number} height 
	 */
	constructor(x, y, width = 0, height = 0) {
		super(width, height);

		this.x = x;
		this.y = y;
	}

	/**
	 * @returns {Vector2}
	 */
	get pos() {
		return new Vector2(this.x, this.y);
	}

	/**
	 * @type {Vector2}
	 */
	set pos(vector2) {
		this.x = vector2.x;
		this.y = vector2.y;
	}

	copy() {
		return new RectBody(
			this.x,
			this.y,
			this.width,
			this.height
		);
	}

	/**
	 * 
	 * @param {number | Vector2} x 
	 * @param {number} [y]
	 * @returns {RectBody}
	 */
	move(x, y) {
		let input = x;

		if (input instanceof Vector2) {
			this.x += input.x;
			this.y += input.y;
		} else if (typeof x === 'number' && typeof y === 'number') {
			this.x += x;
			this.y += y;
		}

		return this;
	}
}

export class Bound {
	/**
	 * @param {Bound} bound 
	 * @returns {RectBody}
	 */
	static toPositionalRect(bound) {
		const [x1, y1, x2, y2] = bound;

		const x = Math.min(x1, x2); // Get the minimum x-coordinate as the top-left corner x
		const y = Math.min(y1, y2); // Get the minimum y-coordinate as the top-left corner y
		const w = Math.abs(x2 - x1); // Calculate the width as the absolute difference between x2 and x1
		const h = Math.abs(y2 - y1); // Calculate the height as the absolute difference between y2 and y1

		return new RectBody(x, y, w, h);
	}

	/**
	 * @type {[
	 *  x1: number,
	 *  y1: number,
	 *  x2: number,
	 *  y2: number
	 * ]}
	 */
	positions = [0, 0, 0, 0];

	/**
	 * @param {number} [x1]
	 * @param {number} [y1]
	 * @param {number} [x2]
	 * @param {number} [y2]
	 */
	constructor(x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
		this.positions = [x1, y1, x2, y2];
	}

	clear() {
		this.positions = [0, 0, 0, 0];
	}

	/**
	 * @param {Array<[
	 *  x1: number,
	 *  x2: number,
	 *  y1: number,
	 *  y2: number
	 * ]>} items 
	 */
	set(...items) {
		if (Array.isArray(items) != true)
			return;

		this.clear();

		items.slice(0, 4).map((n, index) => {
			this.positions[index] = typeof n === 'number' ? n : 0;
		})
	}

	toRect() {
		return Bound.toPositionalRect(this);
	}

	get valid() {
		return this.positions.some(n => typeof n !== 'number') != true
	}

	*[Symbol.iterator]() {
		for (const p of this.positions)
			yield p;
	}
}