import type { Point } from "@orago/lib";

/**
 * @deprecated
 */
export interface RectangleLike {
	width: number;
	height: number;
}
/**
 * @deprecated
 */
export type CircleLike = { r: number } & Point;

/**
 * @deprecated
 */
export type PositionedRectangleLike = RectangleLike & Point;

/**
 * @deprecated
 */
export type BoundsLike = [x1: number, y1: number, x2: number, y2: number];

export class Rect {
	static scaleToFitRatio(
		container: RectangleLike,
		child: RectangleLike
	): number {
		// Calculate aspect ratios
		const containerRatio = container.width / container.height;
		const rectRatio = child.width / child.height;

		// Scale the rectangle to fit within the container
		if (rectRatio > containerRatio) return container.width / child.width;
		else return container.height / child.height;
	}

	static scaleToFit(
		container: RectangleLike,
		child: RectangleLike
	): RectangleLike {
		// Calculate aspect ratios
		const scaleFactor = Rect.scaleToFitRatio(container, child);

		// Calculate the scaled dimensions
		const width = child.width * scaleFactor;
		const height = child.height * scaleFactor;

		return { width, height };
	}

	static scale(width: number, height: number, scale: number): RectangleLike {
		return { width: width * scale, height: height * scale };
	}

	static from(obj: RectangleLike): Rect {
		return new Rect(obj.width, obj.height);
	}

	static contains(
		parent: PositionedRectangleLike,
		child: Point & Partial<RectangleLike>
	): boolean {
		const parentx2 = parent.x + parent.width;
		const parenty2 = parent.y + parent.height;
		const childx2 = child.x + (child?.width ?? 0);
		const childy2 = child.y + (child?.height ?? 0);
		return (
			parent.x <= child.x &&
			parentx2 >= childx2 &&
			parent.y <= child.y &&
			parenty2 >= childy2
		);
	}

	static centerChild(
		parent: PositionedRectangleLike,
		child: RectangleLike
	): PositionedRectangleLike {
		return {
			x: parent.x + (parent.width - child.width) / 2,
			y: parent.y + (parent.height - child.height) / 2,
			width: child.width ?? 0,
			height: child.height ?? 0,
		};
	}

	static toBound(
		rect: RectangleLike & { x?: number; y?: number }
	): [x: number, y: number, width: number, height: number] {
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
	 * @returns {Rect}
	 */
	scaled(scale: number): Rect {
		return new Rect(this.width * scale, this.height * scale);
	}

	toFit(_: RectangleLike = this): Rect {
		return Rect.from(Rect.scaleToFit(_, this));
	}
}

export class Box extends Rect {
	static toBoundingBox(rect: Box | Rect): Bound | undefined {
		if (rect instanceof Box) {
			return new Bound(rect.x, rect.y, rect.width, rect.height);
		}

		if (rect instanceof Rect) {
			return new Bound(0, 0, rect.width, rect.height);
		}
	}

	x: number;
	y: number;

	constructor(x: number, y: number, width: number = 0, height: number = 0) {
		super(width, height);

		this.x = x;
		this.y = y;
	}

	position(): Point;
	position(vector2: Point): this;
	position(vector?: Point): any {
		if (vector == undefined) {
			return {
				x: this.x,
				y: this.y,
			};
		}

		this.x = vector.x;
		this.y = vector.y;

		return this;
	}

	public clone(): Box {
		return new Box(this.x, this.y, this.width, this.height);
	}

	public move(input: Point): Box;
	public move(x: number, y: number): Box;
	public move(...args: any[]): Box {
		if (typeof args[0] == "object") {
			this.x += args[0].x;
			this.y += args[0].y;
		} else if (typeof args[0] === "number" && typeof args[1] === "number") {
			this.x += args[0];
			this.y += args[1];
		}

		return this;
	}
}

export class Bound {
	public static toPositionalRect(bound: Bound): Box {
		const [x1, y1, x2, y2] = bound;
		const x = Math.min(x1, x2);
		const y = Math.min(y1, y2);
		const w = Math.abs(x2 - x1);
		const h = Math.abs(y2 - y1);
		return new Box(x, y, w, h);
	}

	public positions: BoundsLike = [0, 0, 0, 0];

	constructor(
		x1: number = 0,
		y1: number = 0,
		x2: number = 0,
		y2: number = 0
	) {
		this.positions = [x1, y1, x2, y2];
	}

	public clear() {
		this.positions = [0, 0, 0, 0];
	}

	public set(...items: BoundsLike[]) {
		if (Array.isArray(items) != true) {
			return;
		}

		this.clear();

		items.slice(0, 4).map((n, index) => {
			this.positions[index] = typeof n === "number" ? n : 0;
		});
	}

	public toRect() {
		return Bound.toPositionalRect(this);
	}

	public get valid() {
		return this.positions.some((n) => typeof n !== "number") != true;
	}

	*[Symbol.iterator]() {
		for (const p of this.positions) {
			yield p;
		}
	}
}
