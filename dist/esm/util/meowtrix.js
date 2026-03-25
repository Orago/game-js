/**
 * @module Rematrix
 * Forked from: https://github.com/jlmakes/rematrix
 */
export class Meowtrix {
    static getPosition(matrix) {
        if (matrix.length !== 16) {
            throw new Error("Matrix must be length 16");
        }
        return [matrix[12], matrix[13], matrix[14]];
    }
    static getScale(matrix) {
        if (matrix.length !== 16) {
            throw new Error("Matrix must be length 16");
        }
        const scale_x = Math.hypot(matrix[0], matrix[1], matrix[2]);
        const scale_y = Math.hypot(matrix[4], matrix[5], matrix[6]);
        const scale_z = Math.hypot(matrix[8], matrix[9], matrix[10]);
        return [scale_x, scale_y, scale_z];
    }
    static getRotation(matrix) {
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
        let x, y, z;
        y = Math.asin(-r20);
        if (Math.cos(y) > 1e-6) {
            x = Math.atan2(r21, r22);
            z = Math.atan2(r10, r00);
        }
        else {
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
    static format(source) {
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
            }
            else if (source.length === 16 && values.length === 16) {
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
    static identity() {
        let matrix = [];
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
    static inverse(source) {
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
        let determinant = 1 / (s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0);
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
    static multiply(matrixA, matrixB) {
        let fma = Meowtrix.format(matrixA);
        let fmb = Meowtrix.format(matrixB);
        let product = [];
        for (let i = 0; i < 4; i++) {
            let row = [fma[i], fma[i + 4], fma[i + 8], fma[i + 12]];
            for (let j = 0; j < 4; j++) {
                let k = j * 4;
                let col = [fmb[k], fmb[k + 1], fmb[k + 2], fmb[k + 3]];
                let result = row[0] * col[0] +
                    row[1] * col[1] +
                    row[2] * col[2] +
                    row[3] * col[3];
                product[i + k] = result;
            }
        }
        return product;
    }
    /**
     * Returns a matrix representing perspective.
     *
     * @param distance A `number` measured in pixels.
     */
    static perspective(distance) {
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
    static rotate(angle) {
        return Meowtrix.rotateZ(angle);
    }
    /**
     * Returns a matrix representing X‑axis rotation.
     *
     * @param angle A `number` measured in degrees.
     */
    static rotateX(angle) {
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
    static rotateY(angle) {
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
    static rotateZ(angle) {
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
    static scale(scalar, scalarY, scalarZ = 1) {
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
    static scaleX(scalar) {
        let matrix = Meowtrix.identity();
        matrix[0] = scalar;
        return matrix;
    }
    /**
     * Returns a matrix representing Y‑axis scaling.
     *
     * @param scalar A `number` decimal multiplier.
     */
    static scaleY(scalar) {
        let matrix = Meowtrix.identity();
        matrix[5] = scalar;
        return matrix;
    }
    /**
     * Returns a matrix representing Z‑axis scaling.
     *
     * @param scalar A `number` decimal multiplier.
     */
    static scaleZ(scalar) {
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
    static skew(angleX, angleY) {
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
    static skewX(angle) {
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
    static skewY(angle) {
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
    static translate(distanceX, distanceY) {
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
    static translate3d(distance_x, distance_y, distance_z) {
        let matrix = Meowtrix.identity();
        if (distance_x !== undefined &&
            distance_y !== undefined &&
            distance_z !== undefined) {
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
    static translateX(distance) {
        let matrix = Meowtrix.identity();
        matrix[12] = distance;
        return matrix;
    }
    /**
     * Returns a matrix representing Y‑axis translation.
     *
     * @param distance A `number` measured in pixels.
     */
    static translateY(distance) {
        let matrix = Meowtrix.identity();
        matrix[13] = distance;
        return matrix;
    }
    /**
     * Returns a matrix representing Z‑axis translation.
     *
     * @param distance A `number` measured in pixels.
     */
    static translateZ(distance) {
        let matrix = Meowtrix.identity();
        matrix[14] = distance;
        return matrix;
    }
    /**
     * Resets the translation components (x, y, z) of a 3D matrix.
     */
    static resetTranslation(matrix) {
        const m = matrix.slice();
        m[12] = 0; // X
        m[13] = 0; // Y
        m[14] = 0; // Z
        return m;
    }
    /**
     * Resets the scaling components (x, y, z) of a 3D matrix to 1.
     */
    static resetScale(matrix) {
        const m = matrix.slice();
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
    static resetRotation(matrix) {
        const m = matrix.slice();
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
    static resetRotationAndTranslation(matrix) {
        return Meowtrix.resetTranslation(Meowtrix.resetRotation(matrix));
    }
    /**
     * Multiplies multiple matrices in order (left → right)
     * Example:
     *   Meowtrix.combine(A, B, C) === A × B × C
     */
    static combine(...matrices) {
        if (matrices.length === 0) {
            return Meowtrix.identity();
        }
        else if (matrices.length === 1) {
            return matrices[0];
        }
        else {
            return matrices.reduce((acc, m) => Meowtrix.multiply(acc, m));
        }
    }
    constructor() {
        this.matrix = Meowtrix.identity();
        this.stack = [];
    }
    multiply(matrixB) {
        this.stack.push(Meowtrix.format(matrixB));
        return this;
    }
    rotate(axis, angle) {
        if (axis == "x") {
            this.stack.push(Meowtrix.rotateX(angle));
        }
        else if (axis == "y") {
            this.stack.push(Meowtrix.rotateY(angle));
        }
        else if (axis == "z") {
            this.stack.push(Meowtrix.rotateZ(angle));
        }
        return this;
    }
    scale(axis, angle) {
        if (axis == "x") {
            this.stack.push(Meowtrix.rotateX(angle));
        }
        else if (axis == "y") {
            this.stack.push(Meowtrix.rotateY(angle));
        }
        else if (axis == "z") {
            this.stack.push(Meowtrix.rotateZ(angle));
        }
        return this;
    }
    scale2(x, y) {
        this.stack.push(Meowtrix.scale(x, y));
        return this;
    }
    translate(options) {
        var _a, _b, _c;
        const x = (_a = options.x) !== null && _a !== void 0 ? _a : 0;
        const y = (_b = options.y) !== null && _b !== void 0 ? _b : 0;
        const z = (_c = options.z) !== null && _c !== void 0 ? _c : 0;
        this.stack.push(Meowtrix.translate3d(x, y, z));
        return this;
    }
    consume() {
        this.matrix = this.stack.reduce(Meowtrix.multiply);
        return this;
    }
}
export class Transform {
    static exportMatrix(matrix) {
        const exported = {
            position: Meowtrix.getPosition(matrix),
            scale: Meowtrix.getScale(matrix),
            rotation: Meowtrix.getRotation(matrix),
            origin: [0, 0],
        };
        return exported;
    }
    constructor(matrix = Meowtrix.identity()) {
        this.matrix = matrix;
        this.position = { x: 0, y: 0, z: 0 };
        this.scale = { x: 1, y: 1, z: 1 };
        this.rotation = { z: 0 }; // (You can extend to 3D if needed)
        this.origin = {
            x: 0,
            y: 0,
        };
        // matrix: Matrix3D = Meowtrix.identity();
        this.dirty = true;
    }
    import(options) {
        this.position = {
            x: options.position[0],
            y: options.position[1],
            z: options.position[2],
        };
        this.scale = {
            x: options.scale[0],
            y: options.scale[1],
            z: options.scale[2],
        };
        this.rotation = { z: options.rotation[2] };
        this.origin = {
            x: options.origin[0],
            y: options.origin[1],
        };
        if (options.rotation_origin != undefined) {
            this.rotation_origin = {
                x: options.rotation_origin[0],
                y: options.rotation_origin[1],
            };
        }
        return this;
    }
    export() {
        var _a, _b, _c, _d;
        const exported = {
            position: [this.position.x, this.position.y, this.position.z],
            scale: [this.scale.x, this.scale.y, this.scale.z],
            rotation: [0, 0, this.rotation.z],
            origin: [0, 0],
        };
        if (((_a = this.rotation_origin) === null || _a === void 0 ? void 0 : _a.x) != undefined) {
            (_b = exported.rotation_origin) !== null && _b !== void 0 ? _b : (exported.rotation_origin = [0, 0]);
            exported.rotation_origin[0] = this.rotation_origin.x;
        }
        if (((_c = this.rotation_origin) === null || _c === void 0 ? void 0 : _c.y) != undefined) {
            (_d = exported.rotation_origin) !== null && _d !== void 0 ? _d : (exported.rotation_origin = [0, 0]);
            exported.rotation_origin[1] = this.rotation_origin.y;
        }
        return exported;
    }
    clone() {
        return new Transform().import(this.export());
    }
    /**
     * Recompute the matrix only when dirty.
     */
    updateMatrix() {
        var _a, _b, _c, _d;
        if (!this.dirty) {
            return;
        }
        const t = Meowtrix.translate3d(this.position.x, this.position.y, this.position.z);
        let r;
        const px = ((_b = (_a = this.rotation_origin) === null || _a === void 0 ? void 0 : _a.x) !== null && _b !== void 0 ? _b : this.origin.x) * this.scale.x;
        const py = ((_d = (_c = this.rotation_origin) === null || _c === void 0 ? void 0 : _c.y) !== null && _d !== void 0 ? _d : this.origin.y) * this.scale.y;
        // Order matters: move back * rotation * move to origin
        r = Meowtrix.combine(Meowtrix.translate(px, py), // move to
        Meowtrix.rotateZ(this.rotation.z), // rotate
        Meowtrix.translate(-px, -py) // move back
        );
        const s = Meowtrix.combine(
        // Meowtrix.translate(-this.origin.x, -this.origin.y),
        Meowtrix.scale(this.scale.x, this.scale.y)
        // Meowtrix.translate(this.origin.x, this.origin.y)
        );
        const origin_offset = Meowtrix.translate(-this.origin.x * this.scale.x, -this.origin.y * this.scale.y);
        // const s = Meowtrix.scale(this.scale.x, this.scale.y, this.scale.z);
        //? local matrix order = translation * rotation * scale
        this.matrix = Meowtrix.combine(origin_offset, t, r, s);
        this.dirty = false;
    }
    // Mark the transform as dirty so its matrix updates next frame.
    markDirty() {
        this.dirty = true;
    }
    setPosition(x, y, z = 0) {
        if (x != this.position.x ||
            y != this.position.y ||
            z != this.position.z) {
            this.position.x = x;
            this.position.y = y;
            this.position.z = z;
            this.dirty = true;
        }
        return this;
    }
    setScale(x, y = x, z = 1) {
        if (x != this.scale.x || y != this.scale.y || z != this.scale.z) {
            this.scale.x = x;
            this.scale.y = y;
            this.scale.z = z;
            this.dirty = true;
        }
        return this;
    }
    setRotationZ(rad) {
        this.rotation.z = rad;
        this.dirty = true;
        return this;
    }
    setOrigin(x, y) {
        if (this.origin == undefined ||
            x != this.origin.x ||
            y != this.origin.y) {
            this.origin.x = x;
            this.origin.y = y;
            this.dirty = true;
        }
        return this;
    }
    setRotationOrigin(x, y) {
        var _a;
        if (this.rotation_origin == undefined ||
            x != this.rotation_origin.x ||
            y != this.rotation_origin.y) {
            (_a = this.rotation_origin) !== null && _a !== void 0 ? _a : (this.rotation_origin = {});
            this.rotation_origin.x = x;
            this.rotation_origin.y = y;
            this.dirty = true;
        }
        return this;
    }
    getMatrix() {
        this.updateMatrix();
        return this.matrix;
    }
}
export class MeowtrixDom {
    static getCanvasMatrix(matrix) {
        const a = matrix[0];
        const b = matrix[1];
        const c = matrix[4];
        const d = matrix[5];
        const e = matrix[12];
        const f = matrix[13];
        return [a, b, c, d, e, f];
    }
    /**
     * Converts a CSS Transform to array.
     * @param source A `string` containing a `matrix` or `matrix3d` property value.
     */
    static fromString(source) {
        if (typeof source === "string") {
            let match = source.match(/matrix(3d)?\(([^)]+)\)/);
            if (match) {
                let raw = match[2].split(",").map(parseFloat);
                return Meowtrix.format(raw);
            }
            if (source === "none" || source === "") {
                return Meowtrix.identity();
            }
        }
        throw new TypeError("Expected a string containing `matrix()` or `matrix3d()");
    }
    /**
     * Returns a CSS Transform property value equivalent to the source matrix.
     *
     * @param source A `number[]` with length 6 or 16.
     */
    static toString(source) {
        return `matrix3d(${Meowtrix.format(source).join(", ")})`;
    }
}
