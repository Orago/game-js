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
export declare class Meowtrix {
    static getPosition(matrix: Matrix3D): [x: number, y: number, z: number];
    static getScale(matrix: Matrix3D): [x: number, y: number, z: number];
    static getRotation(matrix: Matrix3D): [x: number, y: number, z: number];
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
    static format(source: Matrix): Matrix3D;
    /**
     * Returns a matrix representing no transformation. The product of any
     * matrix multiplied by the identity matrix will be the original matrix.
     *
     * **Tip:** Similar to how `5 * 1 === 5`, where `1` is the identity.
     */
    static identity(): Matrix3D;
    /**
     * Returns a matrix representing the inverse transformation of the source
     * matrix. The product of any matrix multiplied by its inverse will be the
     * identity matrix.
     *
     * **Tip:** Similar to how `5 * (1/5) === 1`, where `1/5` is the inverse.
     *
     * @param source A `number[]` with length 6 or 16.
     */
    static inverse(source: Matrix): number[];
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
    static multiply(matrixA: Matrix, matrixB: Matrix): Matrix3D;
    /**
     * Returns a matrix representing perspective.
     *
     * @param distance A `number` measured in pixels.
     */
    static perspective(distance: number): Matrix3D;
    /**
     * Returns a matrix representing Z‑axis rotation.
     *
     * **Tip:** This is just an alias for `Rematrix.rotateZ` for parity with CSS.
     *
     * @param angle A `number` measured in degrees.
     */
    static rotate(angle: number): Matrix3D;
    /**
     * Returns a matrix representing X‑axis rotation.
     *
     * @param angle A `number` measured in degrees.
     */
    static rotateX(angle: number): Matrix3D;
    /**
     * Returns a matrix representing Y‑axis rotation.
     *
     * @param angle A `number` measured in degrees.
     */
    static rotateY(angle: number): Matrix3D;
    /**
     * Returns a matrix representing Z‑axis rotation.
     *
     * @param angle A `number` measured in degrees.
     */
    static rotateZ(angle: number): Matrix3D;
    /**
     * Returns a matrix representing 2D scaling. The first argument
     * is used for both X and Y‑axis scaling, unless an optional
     * second argument is provided to explicitly define Y‑axis scaling.
     *
     * @param scalar A `number` decimal multiplier.
     * @param scalarY A `number` decimal multiplier. (Optional)
     */
    static scale(scalar: number, scalarY?: number, scalarZ?: number): Matrix3D;
    /**
     * Returns a matrix representing X‑axis scaling.
     *
     * @param scalar A `number` decimal multiplier.
     */
    static scaleX(scalar: number): Matrix3D;
    /**
     * Returns a matrix representing Y‑axis scaling.
     *
     * @param scalar A `number` decimal multiplier.
     */
    static scaleY(scalar: number): Matrix3D;
    /**
     * Returns a matrix representing Z‑axis scaling.
     *
     * @param scalar A `number` decimal multiplier.
     */
    static scaleZ(scalar: number): Matrix3D;
    /**
     * Returns a matrix representing shear. The first argument
     * defines X‑axis shearing, and an optional second argument
     * defines Y‑axis shearing.
     *
     * @param angleX A `number` measured in degrees.
     * @param angleY A `number` measured in degrees. (Optional)
     */
    static skew(angleX: number, angleY?: number): Matrix3D;
    /**
     * Returns a matrix representing X‑axis shear.
     *
     * @param angle A `number` measured in degrees.
     */
    static skewX(angle: number): Matrix3D;
    /**
     * Returns a matrix representing Y‑axis shear.
     *
     * @param angle A `number` measured in degrees.
     */
    static skewY(angle: number): Matrix3D;
    /**
     * Returns a matrix representing 2D translation. The first
     * argument defines X‑axis translation, and an optional second
     * argument defines Y‑axis translation.
     *
     * @param distanceX A `number` measured in pixels.
     * @param distanceY A `number` measured in pixels. (Optional)
     */
    static translate(distanceX: number, distanceY?: number): Matrix3D;
    /**
     * Returns a matrix representing 3D translation. The first argument
     * defines X‑axis translation, the second argument defines Y‑axis
     * translation, and the third argument defines Z‑axis translation.
     *
     * @param distance_x A `number` measured in pixels.
     * @param distance_y A `number` measured in pixels.
     * @param distance_z A `number` measured in pixels.
     */
    static translate3d(distance_x: number, distance_y: number, distance_z: number): Matrix3D;
    /**
     * Returns a matrix representing X‑axis translation.
     *
     * @param distance A `number` measured in pixels.
     */
    static translateX(distance: number): Matrix3D;
    /**
     * Returns a matrix representing Y‑axis translation.
     *
     * @param distance A `number` measured in pixels.
     */
    static translateY(distance: number): Matrix3D;
    /**
     * Returns a matrix representing Z‑axis translation.
     *
     * @param distance A `number` measured in pixels.
     */
    static translateZ(distance: number): Matrix3D;
    /**
     * Resets the translation components (x, y, z) of a 3D matrix.
     */
    static resetTranslation(matrix: Matrix3D): Matrix3D;
    /**
     * Resets the scaling components (x, y, z) of a 3D matrix to 1.
     */
    static resetScale(matrix: Matrix3D): Matrix3D;
    /**
     * Resets the rotation of a 3D matrix while preserving scale and translation.
     */
    static resetRotation(matrix: Matrix3D): Matrix3D;
    /**
     * Resets both rotation and translation but keeps scaling.
     */
    static resetRotationAndTranslation(matrix: Matrix3D): Matrix3D;
    /**
     * Multiplies multiple matrices in order (left → right)
     * Example:
     *   Meowtrix.combine(A, B, C) === A × B × C
     */
    static combine(...matrices: Matrix3D[]): Matrix3D;
}
export interface TransformExport {
    position: [x: number, y: number, z: number];
    scale: [x: number, y: number, z: number];
    rotation: [x: number, y: number, z: number];
    origin: [x: number, y: number];
    rotation_origin?: [x: number, y: number];
}
export declare class Transform {
    matrix: Matrix3D;
    static exportMatrix(matrix: Matrix3D): TransformExport;
    position: {
        x: number;
        y: number;
        z: number;
    };
    scale: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        z: number;
    };
    origin: {
        x: number;
        y: number;
    };
    rotation_origin?: {
        x?: number;
        y?: number;
    };
    private dirty;
    constructor(matrix?: Matrix3D);
    import(options: TransformExport): this;
    export(): {
        position: [x: number, y: number, z: number];
        scale: [x: number, y: number, z: number];
        rotation: [x: number, y: number, z: number];
        rotation_origin?: [x: number, y: number];
        origin: [x: number, y: number];
    };
    clone(): Transform;
    /**
     * Recompute the matrix only when dirty.
     */
    updateMatrix(): void;
    markDirty(): void;
    setPosition(x: number, y: number, z?: number): this;
    setScale(x: number, y?: number, z?: number): this;
    setRotationZ(rad: number): this;
    setOrigin(x: number, y: number): this;
    setRotationOrigin(x: number, y: number): this;
    getMatrix(): Matrix3D;
}
export declare class MeowtrixCss {
    /**
     * Converts a CSS Transform to array.
     * @param source A `string` containing a `matrix` or `matrix3d` property value.
     */
    static fromString(source: string): Matrix3D;
    /**
     * Returns a CSS Transform property value equivalent to the source matrix.
     *
     * @param source A `number[]` with length 6 or 16.
     */
    static toString(source: Matrix): string;
}
