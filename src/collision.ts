import type { PositionedRectangle, Circle } from './shapes';

export class Collision {
	public static rect(a: PositionedRectangle, b: PositionedRectangle): boolean {
		return (
			a.x + a.width > b.x &&
			a.x < b.x + b.width &&
			a.y + a.height > b.y &&
			a.y < b.y + b.height
		);
	}

	public static rectContains(outer: PositionedRectangle, inner: PositionedRectangle): boolean {
		return (
			inner.x >= outer.x &&
			inner.x + inner.width <= outer.x + outer.width &&
			inner.y >= outer.y &&
			inner.y + inner.height <= outer.y + outer.height
		);
	}

	public static circle(
		a: Circle,
		b: Circle
	): boolean {
		const distX = Math.abs(b.x - a.x);
		const distY = Math.abs(b.y - a.y);
		const distance = Math.sqrt(distX * distX + distY * distY);

		return distance < a.r + b.r;
	}
}