interface rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

export class Collision {
	static rect(rect1: rect, rect2: rect): boolean {
		return (
			rect1.x + rect1.w > rect2.x &&
			rect1.x < rect2.x + rect2.w &&
			rect1.y + rect1.h > rect2.y &&
			rect1.y < rect2.y + rect2.h
		)
	}

	static rectContains(
		p: rect,
		c: {
			x: number;
			y: number;
			w?: number;
			h?: number;
		}
	): boolean {
		p.w = p.w || 0; /* | *//* | */ p.h = p.h || 0;
		const px2 = (p.x + p.w) || p.x;
		const py2 = (p.y + p.h) || p.y;

		c.w = c.w || 0; /* | *//* | */ c.h = c.h || 0;
		const cx2 = (c.x + c.w) || c.x;
		const cy2 = (c.y + c.h) || c.y;

		return p.x <= c.x && px2 >= cx2 && p.y <= c.y && py2 >= cy2;
	}

	static circle(
		a: {
			r: number;
			x: number;
			y: number;
		},
		b: {
			r: number;
			x: number;
			y: number;
		}
	): boolean {
		const distX = Math.abs(b.x - a.x);
		const distY = Math.abs(b.y - a.y);
		const distance = Math.sqrt(distX * distX + distY * distY);

		return distance < a.r + b.r;
	}
}