import type { PositionedRectangleLike, CircleLike } from "./shapes.js";

export class Collision {
	public static rect(
		a: PositionedRectangleLike,
		b: PositionedRectangleLike
	): boolean {
		return (
			a.x + a.width > b.x &&
			a.x < b.x + b.width &&
			a.y + a.height > b.y &&
			a.y < b.y + b.height
		);
	}

	public static rectContains(
		outer: PositionedRectangleLike,
		inner: PositionedRectangleLike
	): boolean {
		return (
			inner.x >= outer.x &&
			inner.x + inner.width <= outer.x + outer.width &&
			inner.y >= outer.y &&
			inner.y + inner.height <= outer.y + outer.height
		);
	}

	public static circle(a: CircleLike, b: CircleLike): boolean {
		const distX = Math.abs(b.x - a.x);
		const distY = Math.abs(b.y - a.y);
		const distance = Math.sqrt(distX * distX + distY * distY);

		return distance < a.r + b.r;
	}
}
