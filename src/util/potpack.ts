import { Size, Rectangle, Geometry } from "@orago/lib";





export class BoxUtil {
	static from(x: number, y: number, width: number, height: number) {
		return {
			x,
			y,
			width,
			height,
		};
	}

	static asArray(
		obj: Rectangle,
	): [x: number, y: number, width: number, height: number] {
		return [obj.x, obj.y, obj.width, obj.height];
	}

	static asRect(obj: Rectangle): {
		x: number;
		y: number;
		width: number;
		height: number;
	} {
		const { x, y, width, height } = obj;
		return { x, y, width, height };
	}
}

export default function potpack<T extends Size[]>(
	boxes: T,
	padding: number = 0,
): {
	width: number;
	height: number;
	fill: number;
	boxes: (T[number] & Rectangle)[];
} {
	// calculate total box area and maximum box width
	let area = 0;
	let maxWidth = 0;

	for (const box of boxes) {
		area += (box.width + padding) * (box.height + padding);
		maxWidth = Math.max(maxWidth, box.width + padding);
	}

	// sort the boxes for insertion by height, descending
	const sorted_boxes = [...boxes].sort((a, b) => b.height - a.height);
	// aim for a squarish resulting container,
	// slightly adjusted for sub-100% space utilization
	const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth);

	// start with a single empty space, unbounded at the bottom
	const spaces = [{ x: 0, y: 0, width: startWidth, height: Infinity }];

	let width = 0;
	let height = 0;

	const new_boxes: Rectangle[] = sorted_boxes.map((e) => ({ ...e, x: 0, y: 0 }));

	for (const box of new_boxes) {
		const pad_box_w = box.width + padding;
		const pad_box_h = box.height + padding;
		// look through spaces backwards so that we check smaller spaces first
		for (let i = spaces.length - 1; i >= 0; i--) {
			const space = spaces[i];

			// look for empty spaces that can accommodate the current box
			if (pad_box_w > space.width || pad_box_h > space.height) continue;

			/**
			 * found the space; add the box to its top-left corner
			 * |-------|-------|
			 * |  box  |       |
			 * |_______|       |
			 * |         space |
			 * |_______________|
			 */
			box.x = space.x;
			box.y = space.y;

			height = Math.max(height, box.y + pad_box_h);
			width = Math.max(width, box.x + pad_box_w);

			if (pad_box_w === space.width && pad_box_h === space.height) {
				// space matches the box exactly; remove it
				const last = spaces.pop();
				if (i < spaces.length && last) spaces[i] = last;
			} else if (pad_box_h === space.height) {
				/**
				 * space matches the box height; update it accordingly
				 * |-------|---------------|
				 * |  box  | updated space |
				 * |_______|_______________|
				 */
				space.x += pad_box_w;
				space.width -= pad_box_w;
			} else if (pad_box_w === space.width) {
				/**
				 * space matches the box width; update it accordingly
				 * |---------------|
				 * |      box      |
				 * |_______________|
				 * | updated space |
				 * |_______________|
				 */
				space.y += pad_box_h;
				space.height -= pad_box_h;
			} else {
				/**
				 * otherwise the box splits the space into two spaces
				 * |-------|-----------|
				 * |  box  | new space |
				 * |_______|___________|
				 * | updated space     |
				 * |___________________|
				 */
				spaces.push({
					x: space.x + pad_box_w,
					y: space.y,
					width: space.width - pad_box_w,
					height: pad_box_h,
				});

				space.y += pad_box_h;
				space.height -= pad_box_h;
			}
			break;
		}
	}

	return {
		width, // container width
		height, // container height
		fill: width > 0 && height > 0 ? area / (width * height) : 0, // space utilization
		boxes: new_boxes as (Rectangle & T[number])[],
	};
}