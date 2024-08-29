import { RectWithPosition, RectOrPosition } from './shapes';

interface Circle {
	r: number;
	x: number;
	y: number;
}

export class Collision {
	static rect(a: RectWithPosition, b: RectWithPosition): boolean {
		return (
			a.x + a.width > b.x &&
			a.x < b.x + b.width &&
			a.y + a.height > b.y &&
			a.y < b.y + b.height
		);
	}

	static rectContains(
		p: RectWithPosition,
		c: RectOrPosition
	): boolean {
		const px2 = (p.width + p.x) || p.x;
		const py2 = (p.height + p.y) || p.y;
		const cx2 = (c.width || 0 + c.x) || c.x;
		const cy2 = (c.height || 0 + c.y) || c.y;

		return p.x <= c.x && px2 >= cx2 && p.y <= c.y && py2 >= cy2;
	}

	static circle(
		a: Circle,
		b: Circle
	): boolean {
		const distX = Math.abs(b.x - a.x);
		const distY = Math.abs(b.y - a.y);
		const distance = Math.sqrt(distX * distX + distY * distY);

		return distance < a.r + b.r;
	}
}