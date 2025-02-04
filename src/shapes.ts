import { type Point } from '@orago/lib/vector';

export interface Rectangle {
	width: number;
	height: number;
}

export type Circle = { r: number; } & Point;

export type PositionedRectangle = Rectangle & Point;

/**
 * @deprecated
 * @see {PositionedRectangle}
 */
export type RectWithPosition = PositionedRectangle;


/**
 * @deprecated
 */
export interface RectOrPosition {
	x: number;
	y: number;
	width?: number;
	height?: number;
}

export type LikeBounds = [
	x1: number,
	y1: number,
	x2: number,
	y2: number
];

export class RectangleUtil {
	static scaleToFitRatio(
		container: Rectangle,
		child: Rectangle
	): number {
		// Calculate aspect ratios
		const containerRatio = container.width / container.height;
		const rectRatio = child.width / child.height;

		// Scale the rectangle to fit within the container
		if (rectRatio > containerRatio)
			return container.width / child.width;
		else
			return container.height / child.height;
	}

	static scaleToFit(
		container: Rectangle,
		child: Rectangle
	): Rectangle {
		// Calculate aspect ratios
		const scaleFactor = RectangleUtil.scaleToFitRatio(container, child);

		// Calculate the scaled dimensions
		const width = child.width * scaleFactor;
		const height = child.height * scaleFactor;

		return { width, height };
	}

	static scale(width: number, height: number, scale: number): Rectangle {
		return { width: width * scale, height: height * scale };
	}

	static from(obj: Rectangle): RectangleUtil {
		return new RectangleUtil(obj.width, obj.height);
	}

	static contains(parent: PositionedRectangle, child: Point & Partial<Rectangle>): boolean {
		const parentx2 = parent.x + parent.width;
		const parenty2 = parent.y + parent.height;
		const childx2 = child.x + (child?.width ?? 0);
		const childy2 = child.y + (child?.height ?? 0);
		return parent.x <= child.x && parentx2 >= childx2 && parent.y <= child.y && parenty2 >= childy2;
	}

	static centerChild(parent: PositionedRectangle, child: Rectangle): PositionedRectangle {
		return {
			x: parent.x + (parent.width - child.width) / 2,
			y: parent.y + (parent.height - child.height) / 2,
			width: child.width ?? 0,
			height: child.height ?? 0,
		};
	}

	static toBound(rect: Rectangle & { x?: number; y?: number; }): [x: number, y: number, width: number, height: number] {
		return [rect?.x ?? 0, rect?.y ?? 0, rect.width, rect.height];
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
	 * @returns {RectangleUtil}
	 */
	scaled(scale: number): RectangleUtil {
		return new RectangleUtil(this.width * scale, this.height * scale);
	}

	toFit(_: Rectangle = this): RectangleUtil {
		return RectangleUtil.from(RectangleUtil.scaleToFit(_, this));
	}
}

export class RectBody extends RectangleUtil {
	static toBoundingBox(rect: RectBody | RectangleUtil): Bound | undefined {
		if (rect instanceof RectBody)
			return new Bound(rect.x, rect.y, rect.width, rect.height);

		if (rect instanceof RectangleUtil)
			return new Bound(0, 0, rect.width, rect.height);
	}
	/**
	 * @deprecated
	 * Moved to RectangleUtil.contains
	 */
	static contains = RectangleUtil.contains;
	/**
	 * @deprecated
	 * Moved to RectangleUtil.centerChild
	 */
	static centered = RectangleUtil.centerChild;

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

	get pos(): Point {
		return {
			x: this.x,
			y: this.y
		};
	}

	set pos(vector2) {
		this.x = vector2.x;
		this.y = vector2.y;
	}

	public copy() {
		return new RectBody(
			this.x,
			this.y,
			this.width,
			this.height
		);
	}

	public move(input: Point): RectBody;
	public move(x: number, y: number): RectBody;
	public move(...args: any[]): RectBody {
		if (typeof args[0] == 'object') {
			this.x += args[0].x;
			this.y += args[0].y;
		}
		else if (typeof args[0] === 'number' && typeof args[1] === 'number') {
			this.x += args[0];
			this.y += args[1];
		}

		return this;
	}
}

export class Bound {
	public static toPositionalRect(bound: Bound): RectBody {
		const [x1, y1, x2, y2] = bound;
		const x = Math.min(x1, x2); // Get the minimum x-coordinate as the top-left corner x
		const y = Math.min(y1, y2); // Get the minimum y-coordinate as the top-left corner y
		const w = Math.abs(x2 - x1); // Calculate the width as the absolute difference between x2 and x1
		const h = Math.abs(y2 - y1); // Calculate the height as the absolute difference between y2 and y1
		return new RectBody(x, y, w, h);
	}

	public positions: LikeBounds = [0, 0, 0, 0];

	constructor(
		x1: number = 0, y1: number = 0,
		x2: number = 0, y2: number = 0
	) {
		this.positions = [x1, y1, x2, y2];
	}

	public clear() {
		this.positions = [0, 0, 0, 0];
	}

	public set(...items: LikeBounds[]) {
		if (Array.isArray(items) != true)
			return;

		this.clear();

		items
			.slice(0, 4)
			.map((n, index) => {
				this.positions[index] = typeof n === 'number' ? n : 0;
			});
	}

	public toRect() {
		return Bound.toPositionalRect(this);
	}

	public get valid() {
		return this.positions.some(n => typeof n !== 'number') != true;
	}

	*[Symbol.iterator]() {
		for (const p of this.positions)
			yield p;
	}
}