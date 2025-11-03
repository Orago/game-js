/**
 * @module Rematrix
 * Forked from: https://github.com/jlmakes/rematrix
 */

export declare type Matrix2D = [number, number, number, number, number, number];

export declare type Matrix3D = [
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number
];

export declare type Matrix = Matrix2D | Matrix3D;
interface Transform3D {
	position: [number, number, number];
	scale: [number, number, number];
	rotation: { x: number; y: number; z: number }; // Euler angles in radians
}

export class Meowtrix {
	public static getPosition(
		matrix: Matrix3D
	): [x: number, y: number, z: number] {
		if (matrix.length !== 16) {
			throw new Error("Matrix must be length 16");
		}

		return [matrix[12], matrix[13], matrix[14]];
	}
	public static getScale(
		matrix: Matrix3D
	): [x: number, y: number, z: number] {
		if (matrix.length !== 16) {
			throw new Error("Matrix must be length 16");
		}

		const scale_x = Math.hypot(matrix[0], matrix[1], matrix[2]);
		const scale_y = Math.hypot(matrix[4], matrix[5], matrix[6]);
		const scale_z = Math.hypot(matrix[8], matrix[9], matrix[10]);

		return [scale_x, scale_y, scale_z];
	}

	public static getRotation(
		matrix: Matrix3D
	): [x: number, y: number, z: number] {
		if (matrix.length !== 16) {
			throw new Error("Matrix must be length 16");
		}

		const [scaleX, scaleY, scaleZ] = Meowtrix.getScale(matrix);

		// Normalize rotation part
		const r00 = matrix[0] / scaleX;
		const r01 = matrix[1] / scaleX;
		const r02 = matrix[2] / scaleX;
		const r10 = matrix[4] / scaleY;
		const r11 = matrix[5] / scaleY;
		const r12 = matrix[6] / scaleY;
		const r20 = matrix[8] / scaleZ;
		const r21 = matrix[9] / scaleZ;
		const r22 = matrix[10] / scaleZ;

		let x: number, y: number, z: number;

		y = Math.asin(-r20);
		if (Math.cos(y) > 1e-6) {
			x = Math.atan2(r21, r22);
			z = Math.atan2(r10, r00);
		} else {
			x = Math.atan2(-r12, r11);
			z = 0;
		}

		return [x, y, z];
	}
	/**
	 * Transformation matrices in the browser come in two flavors:
	 *
	 *  - `matrix` using 6 values (short)
	 *  - `matrix3d` using 16 values (long)
	 *
	 * This utility follows this [conversion guide](https://goo.gl/EJlUQ1)
	 * to expand short form matrices to their equivalent long form.
	 *
	 * @param source A `number[]` with length 6 or 16
	 */

	public static format(source: Matrix): Matrix3D {
		if (source && source.constructor === Array) {
			let values = source
				.filter((value) => typeof value === "number")
				.filter((value) => !isNaN(value));

			if (source.length === 6 && values.length === 6) {
				let matrix = Meowtrix.identity();
				matrix[0] = values[0];
				matrix[1] = values[1];
				matrix[4] = values[2];
				matrix[5] = values[3];
				matrix[12] = values[4];
				matrix[13] = values[5];
				return matrix;
			} else if (source.length === 16 && values.length === 16) {
				return source;
			}
		}
		throw new TypeError("Expected a `number[]` with length 6 or 16.");
	}

	/**
	 * Returns a matrix representing no transformation. The product of any
	 * matrix multiplied by the identity matrix will be the original matrix.
	 *
	 * **Tip:** Similar to how `5 * 1 === 5`, where `1` is the identity.
	 */
	public static identity(): Matrix3D {
		let matrix: Matrix3D = [] as any;
		for (let i = 0; i < 16; i++) {
			i % 5 == 0 ? matrix.push(1) : matrix.push(0);
		}
		return matrix;
	}

	/**
	 * Returns a matrix representing the inverse transformation of the source
	 * matrix. The product of any matrix multiplied by its inverse will be the
	 * identity matrix.
	 *
	 * **Tip:** Similar to how `5 * (1/5) === 1`, where `1/5` is the inverse.
	 *
	 * @param source A `number[]` with length 6 or 16.
	 */
	public static inverse(source: Matrix) {
		let m = Meowtrix.format(source);

		let s0 = m[0] * m[5] - m[4] * m[1];
		let s1 = m[0] * m[6] - m[4] * m[2];
		let s2 = m[0] * m[7] - m[4] * m[3];
		let s3 = m[1] * m[6] - m[5] * m[2];
		let s4 = m[1] * m[7] - m[5] * m[3];
		let s5 = m[2] * m[7] - m[6] * m[3];

		let c5 = m[10] * m[15] - m[14] * m[11];
		let c4 = m[9] * m[15] - m[13] * m[11];
		let c3 = m[9] * m[14] - m[13] * m[10];
		let c2 = m[8] * m[15] - m[12] * m[11];
		let c1 = m[8] * m[14] - m[12] * m[10];
		let c0 = m[8] * m[13] - m[12] * m[9];

		let determinant =
			1 / (s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0);

		if (isNaN(determinant) || determinant === Infinity) {
			throw new Error("Inverse determinant attempted to divide by zero.");
		}

		return [
			(m[5] * c5 - m[6] * c4 + m[7] * c3) * determinant,
			(-m[1] * c5 + m[2] * c4 - m[3] * c3) * determinant,
			(m[13] * s5 - m[14] * s4 + m[15] * s3) * determinant,
			(-m[9] * s5 + m[10] * s4 - m[11] * s3) * determinant,

			(-m[4] * c5 + m[6] * c2 - m[7] * c1) * determinant,
			(m[0] * c5 - m[2] * c2 + m[3] * c1) * determinant,
			(-m[12] * s5 + m[14] * s2 - m[15] * s1) * determinant,
			(m[8] * s5 - m[10] * s2 + m[11] * s1) * determinant,

			(m[4] * c4 - m[5] * c2 + m[7] * c0) * determinant,
			(-m[0] * c4 + m[1] * c2 - m[3] * c0) * determinant,
			(m[12] * s4 - m[13] * s2 + m[15] * s0) * determinant,
			(-m[8] * s4 + m[9] * s2 - m[11] * s0) * determinant,

			(-m[4] * c3 + m[5] * c1 - m[6] * c0) * determinant,
			(m[0] * c3 - m[1] * c1 + m[2] * c0) * determinant,
			(-m[12] * s3 + m[13] * s1 - m[14] * s0) * determinant,
			(m[8] * s3 - m[9] * s1 + m[10] * s0) * determinant,
		];
	}

	/**
	 * Returns a matrix representing the combined transformations
	 * of both argument matrices.
	 *
	 * **Note:** Order is important. For example, rotating 45° along the Z‑axis,
	 * followed by translating 500 pixels along the Y‑axis...
	 * Is not the same as translating 500 pixels along the Y‑axis,
	 * followed by rotating 45° along on the Z‑axis.
	 *
	 * @param matrixA A `number[]` with length 6 or 16.
	 * @param matrixB A `number[]` with length 6 or 16.
	 */

	public static multiply(matrixA: Matrix, matrixB: Matrix): Matrix3D {
		let fma = Meowtrix.format(matrixA);
		let fmb = Meowtrix.format(matrixB);
		let product = [];

		for (let i = 0; i < 4; i++) {
			let row = [fma[i], fma[i + 4], fma[i + 8], fma[i + 12]];
			for (let j = 0; j < 4; j++) {
				let k = j * 4;
				let col = [fmb[k], fmb[k + 1], fmb[k + 2], fmb[k + 3]];
				let result =
					row[0] * col[0] +
					row[1] * col[1] +
					row[2] * col[2] +
					row[3] * col[3];

				product[i + k] = result;
			}
		}

		return product as Matrix3D;
	}

	/**
	 * Returns a matrix representing perspective.
	 *
	 * @param distance A `number` measured in pixels.
	 */

	public static perspective(distance: number): Matrix3D {
		let matrix = Meowtrix.identity();
		matrix[11] = -1 / distance;
		return matrix;
	}

	/**
	 * Returns a matrix representing Z‑axis rotation.
	 *
	 * **Tip:** This is just an alias for `Rematrix.rotateZ` for parity with CSS.
	 *
	 * @param angle A `number` measured in degrees.
	 */

	public static rotate(angle: number): Matrix3D {
		return Meowtrix.rotateZ(angle);
	}

	/**
	 * Returns a matrix representing X‑axis rotation.
	 *
	 * @param angle A `number` measured in degrees.
	 */

	public static rotateX(angle: number): Matrix3D {
		let theta = (Math.PI / 180) * angle;
		let matrix = Meowtrix.identity();

		matrix[5] = matrix[10] = Math.cos(theta);
		matrix[6] = matrix[9] = Math.sin(theta);
		matrix[9] *= -1;

		return matrix;
	}

	/**
	 * Returns a matrix representing Y‑axis rotation.
	 *
	 * @param angle A `number` measured in degrees.
	 */

	public static rotateY(angle: number): Matrix3D {
		let theta = (Math.PI / 180) * angle;
		let matrix = Meowtrix.identity();

		matrix[0] = matrix[10] = Math.cos(theta);
		matrix[2] = matrix[8] = Math.sin(theta);
		matrix[2] *= -1;

		return matrix;
	}

	/**
	 * Returns a matrix representing Z‑axis rotation.
	 *
	 * @param angle A `number` measured in degrees.
	 */

	public static rotateZ(angle: number): Matrix3D {
		let theta = (Math.PI / 180) * angle;
		let matrix = Meowtrix.identity();

		matrix[0] = matrix[5] = Math.cos(theta);
		matrix[1] = matrix[4] = Math.sin(theta);
		matrix[4] *= -1;

		return matrix;
	}

	/**
	 * Returns a matrix representing 2D scaling. The first argument
	 * is used for both X and Y‑axis scaling, unless an optional
	 * second argument is provided to explicitly define Y‑axis scaling.
	 *
	 * @param scalar A `number` decimal multiplier.
	 * @param scalarY A `number` decimal multiplier. (Optional)
	 */

	public static scale(
		scalar: number,
		scalarY?: number,
		scalarZ: number = 1
	): Matrix3D {
		let matrix = Meowtrix.identity();

		matrix[0] = scalar;
		matrix[5] = typeof scalarY === "number" ? scalarY : scalar;
		matrix[10] = scalarZ;

		return matrix;
	}

	/**
	 * Returns a matrix representing X‑axis scaling.
	 *
	 * @param scalar A `number` decimal multiplier.
	 */

	public static scaleX(scalar: number): Matrix3D {
		let matrix = Meowtrix.identity();
		matrix[0] = scalar;
		return matrix;
	}

	/**
	 * Returns a matrix representing Y‑axis scaling.
	 *
	 * @param scalar A `number` decimal multiplier.
	 */

	public static scaleY(scalar: number): Matrix3D {
		let matrix = Meowtrix.identity();
		matrix[5] = scalar;
		return matrix;
	}

	/**
	 * Returns a matrix representing Z‑axis scaling.
	 *
	 * @param scalar A `number` decimal multiplier.
	 */

	public static scaleZ(scalar: number): Matrix3D {
		let matrix = Meowtrix.identity();
		matrix[10] = scalar;
		return matrix;
	}

	/**
	 * Returns a matrix representing shear. The first argument
	 * defines X‑axis shearing, and an optional second argument
	 * defines Y‑axis shearing.
	 *
	 * @param angleX A `number` measured in degrees.
	 * @param angleY A `number` measured in degrees. (Optional)
	 */
	public static skew(angleX: number, angleY?: number): Matrix3D {
		let thetaX = (Math.PI / 180) * angleX;
		let matrix = Meowtrix.identity();

		matrix[4] = Math.tan(thetaX);

		if (angleY) {
			let thetaY = (Math.PI / 180) * angleY;
			matrix[1] = Math.tan(thetaY);
		}

		return matrix;
	}

	/**
	 * Returns a matrix representing X‑axis shear.
	 *
	 * @param angle A `number` measured in degrees.
	 */
	public static skewX(angle: number): Matrix3D {
		let theta = (Math.PI / 180) * angle;
		let matrix = Meowtrix.identity();

		matrix[4] = Math.tan(theta);

		return matrix;
	}

	/**
	 * Returns a matrix representing Y‑axis shear.
	 *
	 * @param angle A `number` measured in degrees.
	 */
	public static skewY(angle: number): Matrix3D {
		let theta = (Math.PI / 180) * angle;
		let matrix = Meowtrix.identity();

		matrix[1] = Math.tan(theta);

		return matrix;
	}

	/**
	 * Returns a matrix representing 2D translation. The first
	 * argument defines X‑axis translation, and an optional second
	 * argument defines Y‑axis translation.
	 *
	 * @param distanceX A `number` measured in pixels.
	 * @param distanceY A `number` measured in pixels. (Optional)
	 */
	public static translate(distanceX: number, distanceY?: number): Matrix3D {
		let matrix = Meowtrix.identity();
		matrix[12] = distanceX;

		if (distanceY) {
			matrix[13] = distanceY;
		}

		return matrix;
	}

	/**
	 * Returns a matrix representing 3D translation. The first argument
	 * defines X‑axis translation, the second argument defines Y‑axis
	 * translation, and the third argument defines Z‑axis translation.
	 *
	 * @param distance_x A `number` measured in pixels.
	 * @param distance_y A `number` measured in pixels.
	 * @param distance_z A `number` measured in pixels.
	 */

	public static translate3d(
		distance_x: number,
		distance_y: number,
		distance_z: number
	): Matrix3D {
		let matrix = Meowtrix.identity();
		if (
			distance_x !== undefined &&
			distance_y !== undefined &&
			distance_z !== undefined
		) {
			matrix[12] = distance_x;
			matrix[13] = distance_y;
			matrix[14] = distance_z;
		}
		return matrix;
	}

	/**
	 * Returns a matrix representing X‑axis translation.
	 *
	 * @param distance A `number` measured in pixels.
	 */
	public static translateX(distance: number): Matrix3D {
		let matrix = Meowtrix.identity();
		matrix[12] = distance;
		return matrix;
	}

	/**
	 * Returns a matrix representing Y‑axis translation.
	 *
	 * @param distance A `number` measured in pixels.
	 */
	public static translateY(distance: number): Matrix3D {
		let matrix = Meowtrix.identity();
		matrix[13] = distance;
		return matrix;
	}
	/**
	 * Returns a matrix representing Z‑axis translation.
	 *
	 * @param distance A `number` measured in pixels.
	 */
	public static translateZ(distance: number): Matrix3D {
		let matrix = Meowtrix.identity();
		matrix[14] = distance;
		return matrix;
	}

	/**
	 * Resets the translation components (x, y, z) of a 3D matrix.
	 */
	public static resetTranslation(matrix: Matrix3D): Matrix3D {
		const m = matrix.slice() as Matrix3D;
		m[12] = 0; // X
		m[13] = 0; // Y
		m[14] = 0; // Z
		return m;
	}

	/**
	 * Resets the scaling components (x, y, z) of a 3D matrix to 1.
	 */
	public static resetScale(matrix: Matrix3D): Matrix3D {
		const m = matrix.slice() as Matrix3D;

		const [sx, sy, sz] = Meowtrix.getScale(m);

		// Normalize rotation part to remove scaling
		if (sx !== 0) {
			m[0] /= sx;
			m[1] /= sx;
			m[2] /= sx;
		}
		if (sy !== 0) {
			m[4] /= sy;
			m[5] /= sy;
			m[6] /= sy;
		}
		if (sz !== 0) {
			m[8] /= sz;
			m[9] /= sz;
			m[10] /= sz;
		}

		return m;
	}

	/**
	 * Resets the rotation of a 3D matrix while preserving scale and translation.
	 */
	public static resetRotation(matrix: Matrix3D): Matrix3D {
		const m = matrix.slice() as Matrix3D;
		const [sx, sy, sz] = Meowtrix.getScale(m);

		// Reset rotation to identity while keeping scale
		m[0] = sx;
		m[1] = 0;
		m[2] = 0;
		m[4] = 0;
		m[5] = sy;
		m[6] = 0;
		m[8] = 0;
		m[9] = 0;
		m[10] = sz;

		return m;
	}

	/**
	 * Resets both rotation and translation but keeps scaling.
	 */
	public static resetRotationAndTranslation(matrix: Matrix3D): Matrix3D {
		return Meowtrix.resetTranslation(Meowtrix.resetRotation(matrix));
	}

	/**
	 * Multiplies multiple matrices in order (left → right)
	 * Example:
	 *   Meowtrix.combine(A, B, C) === A × B × C
	 */
	public static combine(...matrices: Matrix3D[]): Matrix3D {
		if (matrices.length === 0) {
			return Meowtrix.identity();
		} else if (matrices.length === 1) {
			return matrices[0];
		}

		return matrices.reduce((acc, m) => Meowtrix.multiply(acc, m));
	}
}

export class Transform {
	position = { x: 0, y: 0, z: 0 };
	scale = { x: 1, y: 1, z: 1 };
	rotation = { z: 0 }; // (You can extend to 3D if needed)
	rotation_origin?: {
		x?: number;
		y?: number;
	};

	origin: {
		x: number;
		y: number;
	} = {
		x: 0,
		y: 0,
	};
	matrix: Matrix3D = Meowtrix.identity();
	private dirty = true;

	/**
	 * Recompute the matrix only when dirty.
	 */
	updateMatrix(): void {
		if (!this.dirty) {
			return;
		}

		const t = Meowtrix.translate3d(
			this.position.x,
			this.position.y,
			this.position.z
		);
		let r: Matrix3D;

		// if (this.rotation_origin == undefined) {
		// 	r = Meowtrix.rotateZ(this.rotation.z);
		// } else {
		const px = (this.rotation_origin?.x ?? this.origin.x) * this.scale.x;
		const py = (this.rotation_origin?.y ?? this.origin.y) * this.scale.y;

		// Order matters: move back * rotation * move to origin
		r = Meowtrix.combine(
			Meowtrix.translate(px, py), // move to
			Meowtrix.rotateZ(this.rotation.z), // rotate
			Meowtrix.translate(-px, -py) // move back
		);
		// }

		const s = Meowtrix.combine(
			// Meowtrix.translate(-this.origin.x, -this.origin.y),
			Meowtrix.scale(this.scale.x, this.scale.y)
			// Meowtrix.translate(this.origin.x, this.origin.y)
		);
		const origin_offset = Meowtrix.translate(
			-this.origin.x * this.scale.x,
			-this.origin.y * this.scale.y
		);
		// const s = Meowtrix.scale(this.scale.x, this.scale.y, this.scale.z);

		// Local matrix = translation * rotation * scale
		this.matrix = Meowtrix.combine(origin_offset, t, r, s);

		this.dirty = false;
	}

	/** Mark the transform as dirty so its matrix updates next frame. */
	markDirty(): void {
		this.dirty = true;
	}

	setPosition(x: number, y: number, z: number = 0): this {
		if (
			x != this.position.x ||
			y != this.position.y ||
			z != this.position.z
		) {
			this.position.x = x;
			this.position.y = y;
			this.position.z = z;
			this.dirty = true;
		}

		return this;
	}

	setScale(x: number, y: number = x, z: number = 1): this {
		if (x != this.scale.x || y != this.scale.y || z != this.scale.z) {
			this.scale.x = x;
			this.scale.y = y;
			this.scale.z = z;
			this.dirty = true;
		}

		return this;
	}

	setRotationZ(rad: number): this {
		this.rotation.z = rad;
		this.dirty = true;
		return this;
	}

	setOrigin(x: number, y: number): this {
		if (
			this.origin == undefined ||
			x != this.origin.x ||
			y != this.origin.y
		) {
			this.origin.x = x;
			this.origin.y = y;
			this.dirty = true;
		}
		return this;
	}

	setRotationOrigin(x: number, y: number): this {
		if (
			this.rotation_origin == undefined ||
			x != this.rotation_origin.x ||
			y != this.rotation_origin.y
		) {
			this.rotation_origin ??= {};
			this.rotation_origin.x = x;
			this.rotation_origin.y = y;
			this.dirty = true;
		}
		return this;
	}

	getMatrix(): Matrix3D {
		this.updateMatrix();
		return this.matrix;
	}
}

export class MeowtrixCss {
	/**
	 * Converts a CSS Transform to array.
	 * @param source A `string` containing a `matrix` or `matrix3d` property value.
	 */
	public static fromString(source: string): Matrix3D {
		if (typeof source === "string") {
			let match = source.match(/matrix(3d)?\(([^)]+)\)/);
			if (match) {
				let raw = match[2].split(",").map(parseFloat);
				return Meowtrix.format(raw as any);
			}
			if (source === "none" || source === "") {
				return Meowtrix.identity();
			}
		}
		throw new TypeError(
			"Expected a string containing `matrix()` or `matrix3d()"
		);
	}

	/**
	 * Returns a CSS Transform property value equivalent to the source matrix.
	 *
	 * @param source A `number[]` with length 6 or 16.
	 */
	public static toString(source: Matrix): string {
		return `matrix3d(${Meowtrix.format(source).join(", ")})`;
	}
}
