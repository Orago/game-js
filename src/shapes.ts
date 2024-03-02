import { Vector2 } from '@orago/vector';

export class Box {
	static scaleToFit(containerWidth: number, containerHeight: number, rectWidth: number, rectHeight: number): Box {
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

	static scale(width: number, height: number, scale: number): Box {
		width *= scale;
		height *= scale;

		return new Box(width, height);
	}

	static FromObj(obj: Box): Box {
		return new Box(obj.width, obj.height);
	}

	width: number;
	height: number;

	constructor(width: number, height: number) {
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
	scaled(scale: number): Box {
		return new Box(this.width * scale, this.height * scale);
	}

	/**
	 * @param {{
	 *  width: number,
	 *  height: number
	 * }} param0
	 * @returns {Box}
	 */
	toFit({ width, height }: {
		width: number;
		height: number;
	} = this): Box {
		const fit = Box.scaleToFit(
			width,
			height,
			this.width,
			this.height
		);

		return fit;
	}
}

interface rectWithPosition {
	x: number;
	y: number;
	width: number;
	height: number;
}

export class RectBody extends Box {
	static toBoundingBox(rect: RectBody | Box): Bound | undefined {
		if (rect instanceof RectBody) {
			return new Bound(rect.x, rect.y, rect.width, rect.height);
		} else if (rect instanceof Box) {
			return new Bound(0, 0, rect.width, rect.height);
		}
	}

	static contains(parent: rectWithPosition, child: rectWithPosition): boolean {
		const parentx2 = parent.x + parent.width;
		const parenty2 = parent.y + parent.height;
		const childx2 = child.x + child.width;
		const childy2 = child.y + child.height;

		return parent.x <= child.x && parentx2 >= childx2 && parent.y <= child.y && parenty2 >= childy2;
	}

	static centered(parent: RectBody, child: RectBody | Box): RectBody {
		return new RectBody(
			parent.x + (parent.width - child.width) / 2,
			parent.y + (parent.height - child.height) / 2
		);
	}

	x: number;
	y: number;

	constructor(
		x: number,
		y: number,
		width: number = 0,
		height: number = 0
	) {
		super(width, height);

		this.x = x;
		this.y = y;
	}

	get pos(): Vector2 {
		return new Vector2(this.x, this.y);
	}

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

	move(x: number | Vector2, y: number): RectBody {
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
	static toPositionalRect(bound: Bound): RectBody {
		const [x1, y1, x2, y2] = bound;

		const x = Math.min(x1, x2); // Get the minimum x-coordinate as the top-left corner x
		const y = Math.min(y1, y2); // Get the minimum y-coordinate as the top-left corner y
		const w = Math.abs(x2 - x1); // Calculate the width as the absolute difference between x2 and x1
		const h = Math.abs(y2 - y1); // Calculate the height as the absolute difference between y2 and y1

		return new RectBody(x, y, w, h);
	}

	positions: [
		x1: number,
		y1: number,
		x2: number,
		y2: number
	] = [0, 0, 0, 0];

	constructor(
		x1: number = 0, y1: number = 0,
		x2: number = 0, y2: number = 0
	) {
		this.positions = [x1, y1, x2, y2];
	}

	clear() {
		this.positions = [0, 0, 0, 0];
	}
	set(...items: Array<[
		x1: number,
		x2: number,
		y1: number,
		y2: number
	]>) {
		if (Array.isArray(items) != true) {
			return;
		}

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