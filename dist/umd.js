(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.oragame = {}));
})(this, (function (exports) { 'use strict';

    /**
     * @module Rematrix
     * Forked from: https://github.com/jlmakes/rematrix
     */
    class Meowtrix {
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
            matrix[1] / scaleX;
            matrix[2] / scaleX;
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
    }
    class Transform {
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
    class MeowtrixCss {
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

    class Component {
        constructor() {
            /**
             * Overridden by ECS once it tracks this Component.
             */
            this.signal = () => { };
        }
        /**
         * If a Component wants to support dirty Component optimization, it
         * manages its own bookkeeping of whether its state has changed,
         * and calls `dirty()` on itself when it has.
         */
        dirty() {
            this.signal();
        }
    }

    // Built off
    function queryEntities(ecs, components) {
        const entities = Array.from(new Set(ecs.entities.getAll()));
        const need = new Set(components);
        return entities.filter((entity) => {
            return entity.components.hasAll(need);
        });
    }
    class EcsKeepingUtility {
        constructor(ecs) {
            this.ecs = ecs;
            this.ecs = ecs;
        }
        // public __checkE(entity: Entity): void {
        // 	for (let system of this.ecs.systems.list.keys()) {
        // 		this.checkES(entity, system);
        // 	}
        // }
        checkEntity(entity) {
            for (let system of this.ecs.systems.list.keys()) {
                this.checkES(entity, system);
            }
        }
        checkES(entity, system) {
            const list = this.ecs.systems.list.get(system);
            const hasRequired = entity.components.hasAll(system.components);
            const hasExcluded = system.components_filter != undefined
                ? entity.components.hasAny(system.components_filter)
                : false;
            if (hasRequired && !hasExcluded) {
                // Should be in system
                list === null || list === void 0 ? void 0 : list.add(entity); // no-op if already in
            }
            else {
                // Should not be in system
                list === null || list === void 0 ? void 0 : list.delete(entity); // no-op if already out
            }
        }
        __componentDirty(entity, component) {
            var _a, _b;
            const got = this.ecs.systems.dirty.get(component.constructor);
            // For all systems that care about this Component becoming
            // dirty, tell them, but only if they're actually tracking
            // this Entity.
            if ((got === null || got === void 0 ? void 0 : got.size) == null) {
                return;
            }
            for (let system of got) {
                if ((_a = this.ecs.systems.list.get(system)) === null || _a === void 0 ? void 0 : _a.has(entity)) {
                    (_b = this.ecs.entities.dirty.get(system)) === null || _b === void 0 ? void 0 : _b.add(entity);
                }
            }
        }
    }
    class EcsSystemKeeping {
        constructor(ecs) {
            this.ecs = ecs;
            this.list = new Map();
            this.dirty = new Map();
            /**
             * @deprecated
             * ⚠️ INTERNAL — DO NOT CALL DIRECTLY!
             * This is managed by the ECS lifecycle.
             */
            this.destroyQueue = new Array();
            /**
             * @deprecated
             * ⚠️ INTERNAL — DO NOT CALL DIRECTLY!
             * This is managed by the ECS lifecycle.
             */
            this.priorities = [];
            this.ecs = ecs;
        }
        add(...systems) {
            var _a;
            for (const system of systems) {
                // Checking invariant: systems should not have an empty
                // Components list, or they'll run on every entity. Simply remove
                // or special case this check if you do want a System that runs
                // on everything.
                if (system.components.size == 0) {
                    console.warn("System not added: empty Components list.");
                    console.warn(system);
                    return;
                }
                // Give system a reference to the ECS so it can actually do
                // anything.
                // system.ecs = this;
                // Save system and set who it should track immediately.
                this.list.set(system, new Set());
                this.ecs.components.dirty.set(system, new Set());
                for (let entity of this.ecs.entities.getAll()) {
                    this.ecs._util.checkES(entity, system);
                }
                const dirtyComponents = this.ecs.components.dirty.get(system);
                if (dirtyComponents != undefined) {
                    // Bookkeeping for dirty Component optimization.
                    for (let c of dirtyComponents) {
                        if (!this.dirty.has(c)) {
                            this.dirty.set(c, new Set());
                        }
                        (_a = this.dirty.get(c)) === null || _a === void 0 ? void 0 : _a.add(system);
                    }
                }
                this.ecs.entities.dirty.set(system, new Set());
            }
            this.sortSystems();
        }
        /**
         * Marks `systems` for removal. The actual removal happens at the end
         * of the next `update()`.
         */
        remove(system) {
            this.destroyQueue.push(system);
        }
        getAll() {
            return Array.from(this.list.keys());
        }
        clear() {
            this.destroyQueue = this.getAll();
        }
        sortSystems() {
            // Extract all systems
            this.priorities = this.getAll();
            // Sort their priorities
            // Yes, you actually need a custom sorting function for numbers.
            this.priorities.sort((a, b) => a.priority - b.priority);
        }
    }
    class EcsComponentsKeeping {
        constructor(ecs) {
            this.ecs = ecs;
            this.dirty = new Map();
            this.ecs = ecs;
        }
        add(entity, components) {
            if (Array.isArray(components)) {
                this._handleMultiple(entity, components);
            }
            else {
                this._handleMultiple(entity, [components]);
            }
            this.ecs.entities.add(entity);
        }
        /**
         * @deprecated
         * ⚠️ INTERNAL — DO NOT CALL DIRECTLY!
         * This is managed by the ECS lifecycle.
         */
        _handleMultiple(entity, components) {
            for (const component of components) {
                entity.components.add(component);
                // Let Component signal ECS when it gets dirty.
                component.signal = () => this.ecs._util.__componentDirty(entity, component);
            }
            this.ecs._util.checkEntity(entity);
            for (const component of components) {
                // Initial dirty signal to broadcast to interested Systems so
                // that it gets a first update.
                component.signal();
            }
        }
        remove(entity, component_class) {
            if (component_class instanceof Component) {
                entity.components.delete(Component.constructor);
            }
            else {
                entity.components.delete(component_class);
            }
            this.ecs._util.checkEntity(entity);
        }
    }
    class EcsEntityKeeping {
        constructor(ecs) {
            this.ecs = ecs;
            // public readonly list = new Set<Entity>();
            this.dirty = new Map();
            /**
             * @deprecated
             * ⚠️ INTERNAL — DO NOT CALL DIRECTLY!
             * This is managed by the ECS lifecycle.
             */
            this.insertQueue = new Array();
            /**
             * @deprecated
             * ⚠️ INTERNAL — DO NOT CALL DIRECTLY!
             * This is managed by the ECS lifecycle.
             */
            this.destroyQueue = new Array();
            this.ecs = ecs;
        }
        add(entity) {
            // this.list.add(entity);
            // this.ecs._util.__checkE(entity);
            this.insertQueue.push(entity);
        }
        /**
         * Marks `entity` for removal. The actual removal happens at the end
         * of the next `update()`. This way we avoid subtle bugs where an
         * Entity is removed mid-`update()`, with some Systems seeing it and
         * others not.
         */
        remove(entity) {
            this.destroyQueue.push(entity);
        }
        clear() {
            this.destroyQueue = this.getAll();
        }
        getAll() {
            return Array.from(new Set([
                // ...Array.from(this.list).map((e) => e),
                ...Array.from(this.ecs.systems.list.values())
                    .map((e) => Array.from(e))
                    .flat(),
            ]));
        }
        query(...components) {
            return queryEntities(this.ecs, components);
        }
    }
    /**
     * The ECS is the main driver; it's the backbone of the engine that
     * coordinates Entities, Components, and Systems. You could have a single
     * one for your game, or make a different one for every level, or have
     * multiple for different purposes.
     */
    class Ecs {
        constructor() {
            /**
             * ⚠️ INTERNAL — Be careful when using this!
             */
            this._util = new EcsKeepingUtility(this);
            // Main state
            this.entities = new EcsEntityKeeping(this);
            this.systems = new EcsSystemKeeping(this);
            this.components = new EcsComponentsKeeping(this);
        }
        // Bookkeeping for entities.
        // private nextEntityID = 0
        // private entitiesToDestroy: Entity[] = new Array();
        // private systemsToDestroy: System[] = new Array();
        // Dirty Component optimization.
        // private readonly dirtySystemsCare = new Map<Function, Set<System>>();
        // private readonly dirtyEntities = new Map<System, Set<Entity>>();
        // private readonly dirtyComponents = new Map<System, Set<Function>>();
        /**
         * This is ordinarily called once per tick (e.g., every frame). It
         * updates all Systems, then destroys any Entities that were marked
         * for removal.
         */
        update() {
            // while (this.components.insertQueue.length > 0) {
            // 	const [entity, components] =
            // 		this.components.insertQueue.shift() as [Entity, Component[]];
            // 	this.components._handleMultiple(entity, components);
            // }
            while (this.entities.insertQueue.length > 0) {
                const entity = this.entities.insertQueue.pop();
                this._util.checkEntity(entity);
            }
            for (const system of this.systems.priorities) {
                const entities = this.systems.list.get(system);
                const dirtyEntities = this.entities.dirty.get(system);
                if (entities != undefined && dirtyEntities != undefined) {
                    system.update(entities, dirtyEntities);
                    dirtyEntities === null || dirtyEntities === void 0 ? void 0 : dirtyEntities.clear();
                }
            }
            // ! Old alive system
            // for (const entity of this.entities.getAll()) {
            // 	if (entity.alive == false) {
            // 		this.entities.remove(entity);
            // 	}
            // }
            // Update all systems. (Later, we'll add a way to specify the
            // update order.)
            // for (let [system, entities] of this.systems.entries()) {
            // 	system.update(entities, this.dirtyEntities.get(system) as Set<Entity>);
            // 	this.dirtyEntities.get(system)?.clear();
            // }
            // Remove any entities that were marked for deletion during the
            // update.
            while (this.entities.destroyQueue.length > 0) {
                this.destroyEntity(this.entities.destroyQueue.pop());
            }
            // Remove any systems that were marked for deletion during the
            // update.
            while (this.systems.destroyQueue.length > 0) {
                this.destroySystem(this.systems.destroyQueue.pop());
            }
        }
        // Private methods for doing internal state checks and mutations.
        destroyEntity(entity) {
            // this.entities.list.delete(entity);
            var _a;
            for (let [system, entities] of this.systems.list.entries()) {
                // Remove Entity from System (if applicable).
                entities.delete(entity); // no-op if doesn't have it
                // Remove Entity from dirty list if it was there.
                if (this.entities.dirty.has(system)) {
                    // Again, simply a no-op if it's not in there.
                    (_a = this.entities.dirty.get(system)) === null || _a === void 0 ? void 0 : _a.delete(entity);
                }
            }
        }
        destroySystem(system) {
            this.systems.list.delete(system);
            this.components.dirty.delete(system);
            this.systems.sortSystems();
        }
    }

    /**
     * This custom container is so that calling code can provide the
     * Component *instance* when adding (e.g., add(new Position(...))), and
     * provide the Component *class* otherwise (e.g., get(Position),
     * has(Position), delete(Position)).
     *
     * We also use two different types to refer to the Component's class:
     * `Function` and `ComponentClass<T>`. We use `Function` in most cases
     * because it is simpler to write. We use `ComponentClass<T>` in the
     * `get()` method, when we want TypeScript to know the type of the
     * instance that is returned. Just think of these both as referring to
     * the same thing: the underlying class of the Component.
     *
     * You might notice a footgun here: code that gets this object can
     * directly modify the Components inside (with add(...) and delete(...)).
     * This would screw up our ECS bookkeeping of mapping Systems to
     * Entities! We'll fix this later by only returning callers a view onto
     * the Components that can't change them.
     */
    class ComponentContainer {
        constructor() {
            /**
             * Don't tinker with this unless you know what you're doing
             */
            this.map = new Map();
        }
        add(component) {
            this.map.set(component.constructor, component);
        }
        get(component_class) {
            const exact = this.map.get(component_class);
            if (exact) {
                return exact;
            }
            const sub = [...this.map.values()].find((c) => c.parent_component === component_class);
            return sub;
        }
        has(component_class) {
            if (this.map.has(component_class)) {
                return true;
            }
            for (const comp of this.map.values()) {
                if (comp.parent_component === component_class) {
                    return true;
                }
            }
            return false;
        }
        hasAll(component_classes) {
            for (let cls of component_classes) {
                if (!this.has(cls)) {
                    return false;
                }
            }
            return true;
        }
        hasAny(component_classes) {
            for (let cls of component_classes) {
                if (this.has(cls)) {
                    return true;
                }
            }
            return false;
        }
        delete(component_class) {
            this.map.delete(component_class);
        }
    }
    class Entity {
        // protected readonly ecs: ECS
        constructor() {
            this.components = new ComponentContainer();
            this.id = Entity.count++;
            // this.ecs = ecs;
        }
    }
    Entity.Components = ComponentContainer;
    Entity.count = 0;

    class System {
        // public readonly dirtyComponents: Set<Function> = new Set();
        // public readonly remove_entity_queue: Set<Entity> = new Set();
        constructor() {
            this.priority = 1;
            this.id = System.count++;
        }
    }
    System.count = 0;

    var index = {
        Ecs,
        Component,
        Entity,
        System,
    };

    var index$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Component: Component,
        Ecs: Ecs,
        Entity: Entity,
        System: System,
        default: index
    });

    function gridFrame(obj, frames, fps) {
        const time = performance.now() / 1000;
        return (Math.floor(time / (1 / fps)) + obj.x + obj.y) % Math.max(frames, 1);
    }
    function getFrameCount(rect, gridSize) {
        return ((rect.width == gridSize.width ? 0 : rect.width) / gridSize.width +
            (rect.height == gridSize.height ? 0 : rect.height) / gridSize.height);
    }
    function gridsheetAnimation(frames, currentTime, endTime) {
        return Math.min(Math.floor((currentTime / endTime) * frames), frames - 1);
    }
    /**
     * Returns an offset vector
     */
    function calculateGridWrapOffset(rect, gridSize, frame) {
        var _a, _b;
        const gridWidth = (_a = gridSize === null || gridSize === void 0 ? void 0 : gridSize.width) !== null && _a !== void 0 ? _a : 0;
        const gridHeight = (_b = gridSize === null || gridSize === void 0 ? void 0 : gridSize.height) !== null && _b !== void 0 ? _b : 0;
        // Calculate the number of columns in the grid
        const numCols = Math.ceil(rect.width / gridWidth);
        // Calculate the row and column of the frame based on frame number
        const frameRow = Math.floor(frame / numCols);
        const frameCol = frame % numCols;
        // Calculate the offset of the frame within the grid
        const offsetX = frameCol * gridWidth;
        const offsetY = frameRow * gridHeight;
        return [offsetX, offsetY];
    }

    var boxes = /*#__PURE__*/Object.freeze({
        __proto__: null,
        calculateGridWrapOffset: calculateGridWrapOffset,
        getFrameCount: getFrameCount,
        gridFrame: gridFrame,
        gridsheetAnimation: gridsheetAnimation
    });

    class Collision {
        static rect(a, b) {
            return (a.x + a.width > b.x &&
                a.x < b.x + b.width &&
                a.y + a.height > b.y &&
                a.y < b.y + b.height);
        }
        static rectContains(outer, inner) {
            return (inner.x >= outer.x &&
                inner.x + inner.width <= outer.x + outer.width &&
                inner.y >= outer.y &&
                inner.y + inner.height <= outer.y + outer.height);
        }
        static circle(a, b) {
            const distX = Math.abs(b.x - a.x);
            const distY = Math.abs(b.y - a.y);
            const distance = Math.sqrt(distX * distX + distY * distY);
            return distance < a.r + b.r;
        }
    }

    class Rect {
        static scaleToFitRatio(container, child) {
            // Calculate aspect ratios
            const containerRatio = container.width / container.height;
            const rectRatio = child.width / child.height;
            // Scale the rectangle to fit within the container
            if (rectRatio > containerRatio)
                return container.width / child.width;
            else
                return container.height / child.height;
        }
        static scaleToFit(container, child) {
            // Calculate aspect ratios
            const scaleFactor = Rect.scaleToFitRatio(container, child);
            // Calculate the scaled dimensions
            const width = child.width * scaleFactor;
            const height = child.height * scaleFactor;
            return { width, height };
        }
        static scale(width, height, scale) {
            return { width: width * scale, height: height * scale };
        }
        static from(obj) {
            return new Rect(obj.width, obj.height);
        }
        static contains(parent, child) {
            var _a, _b;
            const parentx2 = parent.x + parent.width;
            const parenty2 = parent.y + parent.height;
            const childx2 = child.x + ((_a = child === null || child === void 0 ? void 0 : child.width) !== null && _a !== void 0 ? _a : 0);
            const childy2 = child.y + ((_b = child === null || child === void 0 ? void 0 : child.height) !== null && _b !== void 0 ? _b : 0);
            return (parent.x <= child.x &&
                parentx2 >= childx2 &&
                parent.y <= child.y &&
                parenty2 >= childy2);
        }
        static centerChild(parent, child) {
            var _a, _b;
            return {
                x: parent.x + (parent.width - child.width) / 2,
                y: parent.y + (parent.height - child.height) / 2,
                width: (_a = child.width) !== null && _a !== void 0 ? _a : 0,
                height: (_b = child.height) !== null && _b !== void 0 ? _b : 0,
            };
        }
        static toBound(rect) {
            var _a, _b;
            return [(_a = rect === null || rect === void 0 ? void 0 : rect.x) !== null && _a !== void 0 ? _a : 0, (_b = rect === null || rect === void 0 ? void 0 : rect.y) !== null && _b !== void 0 ? _b : 0, rect.width, rect.height];
        }
        constructor(width, height) {
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
        scaled(scale) {
            return new Rect(this.width * scale, this.height * scale);
        }
        toFit(_ = this) {
            return Rect.from(Rect.scaleToFit(_, this));
        }
    }
    class Box extends Rect {
        static toBoundingBox(rect) {
            if (rect instanceof Box) {
                return new Bound(rect.x, rect.y, rect.width, rect.height);
            }
            if (rect instanceof Rect) {
                return new Bound(0, 0, rect.width, rect.height);
            }
        }
        constructor(x, y, width = 0, height = 0) {
            super(width, height);
            this.x = x;
            this.y = y;
        }
        position(vector) {
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
        clone() {
            return new Box(this.x, this.y, this.width, this.height);
        }
        move(...args) {
            if (typeof args[0] == "object") {
                this.x += args[0].x;
                this.y += args[0].y;
            }
            else if (typeof args[0] === "number" && typeof args[1] === "number") {
                this.x += args[0];
                this.y += args[1];
            }
            return this;
        }
    }
    class Bound {
        static toPositionalRect(bound) {
            const [x1, y1, x2, y2] = bound;
            const x = Math.min(x1, x2); // Get the minimum x-coordinate as the top-left corner x
            const y = Math.min(y1, y2); // Get the minimum y-coordinate as the top-left corner y
            const w = Math.abs(x2 - x1); // Calculate the width as the absolute difference between x2 and x1
            const h = Math.abs(y2 - y1); // Calculate the height as the absolute difference between y2 and y1
            return new Box(x, y, w, h);
        }
        constructor(x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
            this.positions = [0, 0, 0, 0];
            this.positions = [x1, y1, x2, y2];
        }
        clear() {
            this.positions = [0, 0, 0, 0];
        }
        set(...items) {
            if (Array.isArray(items) != true) {
                return;
            }
            this.clear();
            items.slice(0, 4).map((n, index) => {
                this.positions[index] = typeof n === "number" ? n : 0;
            });
        }
        toRect() {
            return Bound.toPositionalRect(this);
        }
        get valid() {
            return this.positions.some((n) => typeof n !== "number") != true;
        }
        *[Symbol.iterator]() {
            for (const p of this.positions) {
                yield p;
            }
        }
    }

    var shapes = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Bound: Bound,
        Box: Box,
        Rect: Rect
    });

    exports.Bound = Bound;
    exports.Box = Box;
    exports.BoxUtil = boxes;
    exports.Collision = Collision;
    exports.Ecs = index$1;
    exports.Meowtrix = Meowtrix;
    exports.MeowtrixCss = MeowtrixCss;
    exports.Rect = Rect;
    exports.Shapes = shapes;
    exports.Transform = Transform;

}));
