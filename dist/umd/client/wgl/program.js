(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WGLSprite = exports.InstanceBuffer = exports.TextureAtlas = exports.WglProgram = void 0;
    const vs = `#version 300 es
precision highp float;

layout(location=0) in vec2 a_pos;
layout(location=1) in vec2 a_uv;

layout(location=2) in vec2 i_pos;
layout(location=3) in vec2 i_size;
layout(location=4) in vec4 i_uvrect;
layout(location=5) in float i_rot;
layout(location=6) in vec4 i_tint; // per-instance tint

uniform vec2 u_resolution;

out vec2 v_uv;
out vec4 i_tint_v; // pass to fragment shader

void main() {
// Rotate local quad coordinates
float c = cos(i_rot);
float s = sin(i_rot);
vec2 rotated = vec2(
    a_pos.x * c - a_pos.y * s,
    a_pos.x * s + a_pos.y * c
);

v_uv = mix(i_uvrect.xy, i_uvrect.zw, a_uv);
// Apply size and position
vec2 world = rotated * i_size + i_pos;
vec2 clip = (world / u_resolution) * 2.0 - 1.0;
clip.y = -clip.y;

gl_Position = vec4(clip, 0.0, 1.0);

// pass to fragment
i_tint_v = i_tint;
}
`;
    const fs = `#version 300 es
precision highp float;

in vec2 v_uv;
in vec4 i_tint_v;  // <- from vertex shader
out vec4 color;

uniform sampler2D u_tex;

void main() {
    vec4 texColor = texture(u_tex, v_uv);
    color = vec4(texColor.rgb * i_tint_v.rgb, texColor.a * i_tint_v.a);
}
`;
    const OSF = {
        destination: {
            size: 4,
            start: 0,
        },
        source: {
            size: 4,
            start: 4,
        },
        rotation: {
            size: 1,
            start: 8,
        },
        color: {
            size: 4,
            start: 9,
        },
    };
    class WglProgram {
        constructor() {
            this.canvas = document.createElement("canvas");
            this.gl = this.canvas.getContext("webgl2");
            if (!this.gl)
                throw new Error("WebGL2 required");
            this.setup();
            this.gl.clearColor(0, 0.5, 0, 0);
        }
        setup() {
            const gl = this.gl;
            function compile(type, src) {
                const s = gl.createShader(type);
                gl.shaderSource(s, src);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                    throw new Error(gl.getShaderInfoLog(s));
                }
                return s;
            }
            this.program = gl.createProgram();
            const prog = this.program;
            gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
            gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
                throw new Error(gl.getProgramInfoLog(prog));
            gl.useProgram(prog);
            // transparent
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            this.u_resolution = this.gl.getUniformLocation(prog, "u_resolution");
            const quad = new Float32Array([
                // x,y    u,v
                -0.5, -0.5, 0, 0, 0.5, -0.5, 1, 0, -0.5, 0.5, 0, 1, -0.5, 0.5, 0, 1,
                0.5, -0.5, 1, 0, 0.5, 0.5, 1, 1,
            ]);
            const quadVBO = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
            gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
            const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 8);
            // ------------------ INSTANCE BUFFER ------------------
            this.instances = new InstanceBuffer(this.gl, WglProgram.fpi);
            const fpi = this.instances.floats_per_instance;
            // pos (vec2)
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, fpi * 4, 0);
            gl.vertexAttribDivisor(2, 1);
            // size (vec2)
            gl.enableVertexAttribArray(3);
            gl.vertexAttribPointer(3, 2, gl.FLOAT, false, fpi * 4, 8);
            gl.vertexAttribDivisor(3, 1);
            // uv rect (vec4)
            gl.enableVertexAttribArray(4);
            gl.vertexAttribPointer(4, 4, gl.FLOAT, false, fpi * 4, 16);
            gl.vertexAttribDivisor(4, 1);
            // rotation (float)
            gl.enableVertexAttribArray(5);
            gl.vertexAttribPointer(5, 1, gl.FLOAT, false, fpi * 4, 32);
            gl.vertexAttribDivisor(5, 1);
            // color (vec4)
            gl.enableVertexAttribArray(6);
            gl.vertexAttribPointer(6, 4, gl.FLOAT, false, fpi * 4, 36); // ← FIXED
            gl.vertexAttribDivisor(6, 1);
            this.gl.uniform1i(this.gl.getUniformLocation(prog, "u_tex"), 0);
        }
        setTexture(texture) {
            this.texture = texture;
            const gl = this.gl;
            if (this.texture) {
                gl.useProgram(this.program);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, this.texture.texture);
            }
        }
        resize(width, height) {
            if (this.canvas.width != width || this.canvas.height != height) {
                this.canvas.width = width;
                this.canvas.height = height;
            }
            this.gl.viewport(0, 0, width, height);
        }
        render() {
            const gl = this.gl;
            this.instances.shake();
            this.instances.upload();
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform2f(this.u_resolution, this.canvas.width, this.canvas.height);
            gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.instances.count);
        }
    }
    exports.WglProgram = WglProgram;
    // pos(2), size(2), uvrect(4), rotation(1) tint(4)
    WglProgram.fpi = OSF.destination.size +
        OSF.source.size +
        OSF.color.size +
        OSF.rotation.size;
    class TextureAtlas {
        constructor(gl, img) {
            var _a, _b;
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            this.texture = tex;
            this.width = (_a = img === null || img === void 0 ? void 0 : img.width) !== null && _a !== void 0 ? _a : 0;
            this.height = (_b = img === null || img === void 0 ? void 0 : img.height) !== null && _b !== void 0 ? _b : 0;
        }
        getSlice(x, y, w, h) {
            const u0 = x / this.width;
            const v0 = y / this.height;
            const u1 = (x + w) / this.width;
            const v1 = (y + h) / this.height;
            return [u0, v0, u1, v1];
        }
    }
    exports.TextureAtlas = TextureAtlas;
    class InstanceBuffer {
        static initial() {
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
        }
        constructor(gl, floats_per_instance, initialCapacity = 256) {
            this.gl = gl;
            this.floats_per_instance = floats_per_instance;
            this.count = 0;
            this.id_indexes = 0;
            // indexes: Map<number, number> = new Map();
            this.new_indexes = {};
            this.deleted = new Set();
            this.gl = gl;
            this.floats_per_instance = floats_per_instance;
            this.capacity = initialCapacity;
            this.data = new Float32Array(this.capacity * this.floats_per_instance);
            this.buffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.data.byteLength, gl.DYNAMIC_DRAW);
        }
        ensureCapacity(min) {
            if (min <= this.capacity) {
                return;
            }
            // grow by 1.5×
            let new_capacity = this.capacity;
            while (new_capacity < min) {
                new_capacity = Math.floor(new_capacity * 1.5);
            }
            const new_data = new Float32Array(Math.max(new_capacity * this.floats_per_instance, this.data.length));
            new_data.set(this.data);
            this.data = new_data;
            this.capacity = new_capacity;
            // reallocate GPU buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.data.byteLength, this.gl.DYNAMIC_DRAW);
        }
        reset() {
            this.data = new Float32Array(this.capacity * this.floats_per_instance);
            this.capacity = 256;
            this.count = 0;
        }
        shake() {
            if (this.deleted.size == 0) {
                return;
            }
            const ordered = [];
            const deleted = Array.from(this.deleted.values());
            this.deleted.clear();
            for (const [id, index] of Object.entries(this.new_indexes).map((e) => [
                Number(e[0]),
                e[1],
            ])) {
                if (deleted.includes(id)) {
                    // this.indexes.delete(id);
                    delete this.new_indexes[id];
                    continue;
                }
                ordered.push([id, this.getSelection(index)]);
            }
            this.reset();
            this.ensureCapacity(ordered.length + 1);
            let index = 0;
            for (const [id, slice] of ordered) {
                const offset = index * this.floats_per_instance;
                this.data.set(slice, offset);
                // this.indexes.set(id, index);
                this.new_indexes[id] = index;
                index++;
            }
            this.count = index;
            this.upload();
        }
        toScreen() { }
        fromScreen() { }
        getSelection(index) {
            var _a;
            const offset = index * this.floats_per_instance;
            const list = InstanceBuffer.initial();
            for (let i = 0; i < this.floats_per_instance; i++) {
                list[i] = (_a = this.data[offset + i]) !== null && _a !== void 0 ? _a : 0;
            }
            return list;
        }
        updateSelection(index, data) {
            var _a;
            const selection = (_a = data.selection) !== null && _a !== void 0 ? _a : this.getSelection(index);
            if (data.source != undefined) {
                selection.splice(OSF.source.start, OSF.source.size, ...data.source.slice(0, OSF.source.size));
            }
            if (data.destination != undefined) {
                selection.splice(OSF.destination.start, OSF.destination.size, ...data.destination.slice(0, OSF.destination.size));
            }
            if (data.rotation != undefined) {
                selection.splice(OSF.rotation.start, OSF.rotation.size, data.rotation);
            }
            if (data.color != undefined) {
                selection.splice(OSF.color.start, OSF.color.size, ...data.color.slice(0, OSF.color.size));
            }
            this.setSelection(index, selection);
        }
        setSelection(index, array) {
            const offset = index * this.floats_per_instance;
            this.data.set(array, offset);
            return true;
        }
        addInstance(array = InstanceBuffer.initial()) {
            const id = this.id_indexes++;
            const count_index = this.count;
            const offset = this.count * this.floats_per_instance;
            this.new_indexes[id] = count_index;
            this.ensureCapacity(this.count + 1);
            this.data.set(array, offset);
            this.count++;
            return id;
        }
        getIndex(input) {
            var _a, _b;
            if (typeof input == "number") {
                return (_a = this.new_indexes[input]) !== null && _a !== void 0 ? _a : 0;
            }
            else {
                return (_b = this.new_indexes[input.id]) !== null && _b !== void 0 ? _b : 0;
            }
        }
        getValue(index, data) {
            const selection = this.getSelection(index);
            switch (data) {
                case "source":
                    return selection.slice(OSF.source.start, OSF.source.start + OSF.source.size);
                case "destination":
                    return selection.slice(OSF.destination.start, OSF.destination.start + OSF.destination.size);
                case "rotation":
                    return selection[OSF.rotation.start];
                // .slice(
                // 	OSF.rotation.start,
                // 	OSF.rotation.start + OSF.rotation.size
                // );
                case "color":
                    return selection.slice(OSF.color.start, OSF.color.start + OSF.color.size);
            }
        }
        upload() {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.data.subarray(0, this.count * this.floats_per_instance));
        }
        createSprite(options) {
            const id = this.addInstance(InstanceBuffer.initial());
            const sprite = new WGLSprite(id);
            if (options != undefined) {
                const index = this.getIndex(id);
                this.updateSelection(index, options);
            }
            return sprite;
        }
    }
    exports.InstanceBuffer = InstanceBuffer;
    class WGLSprite {
        constructor(id) {
            this.id = id;
        }
        getValues(reference) {
            return reference.getSelection(reference.getIndex(this));
        }
        get(data, reference) {
            return reference.getValue(reference.getIndex(this), data);
        }
    }
    exports.WGLSprite = WGLSprite;
});
