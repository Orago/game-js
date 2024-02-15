/**
 * @typedef {object} rect
 * @property {number} x - Horizontal Position
 * @property {number} y - Vertical Position
 * @property {number} w - Width
 * @property {number} h - Height
 */
export class Collision {
	/**
	 * @param {rect} rect1 
	 * @param {rect} rect2 
	 * @returns {boolean}
	 */
	static rect(rect1, rect2) {
		return (
			rect1.x + rect1.w > rect2.x &&
			rect1.x < rect2.x + rect2.w &&
			rect1.y + rect1.h > rect2.y &&
			rect1.y < rect2.y + rect2.h
		)
	}

	/**
	 * @param {rect} p 
	 * @param {object} c
	 * @param {number} c.x
	 * @param {number} c.y 
	 * @param {number} [c.w]
	 * @param {number} [c.h]
	 * @returns {boolean}
	 */
	static rectContains(p, c) {
		p.w = p.w || 0; /* | *//* | */ p.h = p.h || 0;
		const px2 = (p.x + p.w) || p.x;
		const py2 = (p.y + p.h) || p.y;

		c.w = c.w || 0; /* | *//* | */ c.h = c.h || 0;
		const cx2 = (c.x + c.w) || c.x;
		const cy2 = (c.y + c.h) || c.y;

		return p.x <= c.x && px2 >= cx2 && p.y <= c.y && py2 >= cy2;
	}

	/**
	 * @param {object} a
	 * @param {number} a.r
	 * @param {number} a.x
	 * @param {number} a.y
	 * @param {object} b 
	 * @param {number} b.r
	 * @param {number} b.x
	 * @param {number} b.y
	 * @returns {boolean}
	 */
	static circle(a, b) {
		const distX = Math.abs(b.x - a.x);
		const distY = Math.abs(b.y - a.y);
		const distance = Math.sqrt(distX * distX + distY * distY);

		return distance < a.r + b.r;
	}
}