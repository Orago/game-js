
let shaderMask = {
	texture: 1,
	crop: 2,
	path: 4
};
function normalizeToNDC(x: number, y: number, canvasWidth: number, canvasHeight: number) {
	return {
		x: (x / canvasWidth) * 2 - 1,
		y: (y / canvasHeight) * -2 + 1,
	};
}
function getFragmentShaderSource(sMask: number) {
	return `
			#ifdef GL_ES
			precision highp float;
			#endif

			#define hasTexture ${((sMask & shaderMask.texture) ? "1" : "0")}
			#define hasCrop ${((sMask & shaderMask.crop) ? "1" : "0")}

			varying vec4 vColor;

			#if hasTexture
			varying vec2 vTextureCoord;
			uniform sampler2D uSampler;
			#if hasCrop
			uniform vec4 uCropSource;
			#endif
			#endif

			void main(void) {
				#if hasTexture
				#if hasCrop
				gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.x * uCropSource.z, vTextureCoord.y * uCropSource.w) + uCropSource.xy);
				#else
				gl_FragColor = texture2D(uSampler, vTextureCoord);
				#endif
				#else
				gl_FragColor = vColor;
				#endif
			}
		`
}

function getVertexShaderSource(stackDepth: number, sMask: number) {
	stackDepth = stackDepth || 1;

	return `
		#define hasTexture (${((sMask & shaderMask.texture) ? "1" : "0")})
		attribute vec4 aVertexPosition;

		#if hasTexture
		varying vec2 vTextureCoord;
		#endif

		uniform vec4 uColor;
		uniform mat3 uTransforms[${stackDepth}];

		varying vec4 vColor;

		// Projection matrix for normalized coordinates, assuming NDC inputs
		const mat4 pMatrix = mat4(1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0);

		mat3 crunchStack(void) {
		  mat3 result = uTransforms[0];
		  for (int i = 1; i < ${stackDepth}; ++i) {
		    result = uTransforms[i] * result;
		  }
		  return result;
		}

		void main(void) {
		  vec3 position = crunchStack() * vec3(aVertexPosition.x, aVertexPosition.y, 1.0);
		  gl_Position = pMatrix * vec4(position, 1.0);
		  vColor = uColor;
		#if hasTexture
		  vTextureCoord = aVertexPosition.zw;
		#endif
		}
	`;
};

/**
 *  WebGL-2D.js - HTML5 Canvas2D API in a WebGL context
 *
 *  Created by Corban Brook <corbanbrook@gmail.com> on 2011-03-02.
 *  Amended to by Bobby Richter <secretrobotron@gmail.com> on 2011-03-03
 *  CubicVR.js by Charles Cliffe <cj@cubicproductions.com> on 2011-03-03
 *
 */

/*
 *  Copyright (c) 2011 Corban Brook
 *
 *  Permission is hereby granted, free of charge, to any person obtaining
 *  a copy of this software and associated documentation files (the
 *  "Software"), to deal in the Software without restriction, including
 *  without limitation the rights to use, copy, modify, merge, publish,
 *  distribute, sublicense, and/or sell copies of the Software, and to
 *  permit persons to whom the Software is furnished to do so, subject to
 *  the following conditions:
 *
 *  The above copyright notice and this permission notice shall be
 *  included in all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 *  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 *  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 *  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 *  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * Usage:
 *
 *    var cvs = document.getElementById("myCanvas");
 *
 *    WebGL2D.enable(cvs); // adds "webgl-2d" to cvs
 *
 *    cvs.getContext("webgl-2d");
 *
 */



type Vector3 = [number, number, number];
type Mat3 = [
	number, number, number,
	number, number, number,
	number, number, number,
];

type Image33 = HTMLImageElement | HTMLCanvasElement;

type GL2DCanvas = HTMLCanvasElement & ({
	gl2d: WebGLImageRenderer,
	$getContext: HTMLCanvasElement["getContext"],
});

interface WGLOptions {
	force?: boolean;
}

// Vector & Matrix libraries from CubicVR.js
function isPOT(value: number) {
	return value > 0 && ((value - 1) & value) === 0;
}


function IsImageOk(img: HTMLImageElement) {
	// During the onload event, IE correctly identifies any images that
	// weren’t downloaded as not complete. Others should too. Gecko-based
	// browsers act like NS4 in that they report this incorrectly.
	if (!img.complete) {
		return false;
	}

	// However, they do have two very useful properties: naturalWidth and
	// naturalHeight. These give the true size of the image. If it failed
	// to load, either of these should be zero.
	if (img.naturalWidth === 0) {
		return false;
	}

	// No other way of checking: assume it’s ok.
	return true;
}

let mat3 = {
	identity: [1.0, 0.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 0.0, 1.0] as Mat3,

	multiply(m1: Mat3, m2: Mat3) {
		var m10 = m1[0], m11 = m1[1], m12 = m1[2], m13 = m1[3], m14 = m1[4], m15 = m1[5], m16 = m1[6], m17 = m1[7], m18 = m1[8],
			m20 = m2[0], m21 = m2[1], m22 = m2[2], m23 = m2[3], m24 = m2[4], m25 = m2[5], m26 = m2[6], m27 = m2[7], m28 = m2[8];

		m2[0] = m20 * m10 + m23 * m11 + m26 * m12;
		m2[1] = m21 * m10 + m24 * m11 + m27 * m12;
		m2[2] = m22 * m10 + m25 * m11 + m28 * m12;
		m2[3] = m20 * m13 + m23 * m14 + m26 * m15;
		m2[4] = m21 * m13 + m24 * m14 + m27 * m15;
		m2[5] = m22 * m13 + m25 * m14 + m28 * m15;
		m2[6] = m20 * m16 + m23 * m17 + m26 * m18;
		m2[7] = m21 * m16 + m24 * m17 + m27 * m18;
		m2[8] = m22 * m16 + m25 * m17 + m28 * m18;
	},

	vec2_multiply(m1: Mat3, m2: Mat3): Mat3 {
		var mOut: number[] = [];
		mOut[0] = m2[0] * m1[0] + m2[3] * m1[1] + m2[6];
		mOut[1] = m2[1] * m1[0] + m2[4] * m1[1] + m2[7];
		return mOut as Mat3;
	},

	transpose(m: Mat3) {
		return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
	}
}; //mat3

// Transform library from CubicVR.js

class Transform {
	static STACK_DEPTH_LIMIT = 16;
	m_stack: any[] = [];
	m_cache: any[] = [];
	c_stack: number = 0;
	valid: number = 0;
	result = null;

	translateMatrix = Transform.prototype.getIdentity();
	scaleMatrix = Transform.prototype.getIdentity();
	rotateMatrix = Transform.prototype.getIdentity();

	constructor(mat?: Mat3) {
		this.clearStack(mat);
	}

	clearStack(init_mat?: Mat3) {
		this.m_stack = [];
		this.m_cache = [];
		this.c_stack = 0;
		this.valid = 0;
		this.result = null;

		for (var i = 0; i < Transform.STACK_DEPTH_LIMIT; i++) {
			this.m_stack[i] = this.getIdentity();
		}

		if (init_mat !== undefined) {
			this.m_stack[0] = init_mat;
		} else {
			this.setIdentity();
		}
	}

	setIdentity() {
		this.m_stack[this.c_stack] = this.getIdentity();
		if (this.valid === this.c_stack && this.c_stack) {
			this.valid--;
		}
	};

	getIdentity(): Mat3 {
		return [1.0, 0.0, 0.0,
			0.0, 1.0, 0.0,
			0.0, 0.0, 1.0];
	};

	getResult() {
		if (!this.c_stack) {
			return this.m_stack[0];
		}

		let m: Mat3 | void = mat3.identity;

		if (this.valid > this.c_stack - 1) { this.valid = this.c_stack - 1; }

		for (var i = this.valid; i < this.c_stack + 1; i++) {
			m = mat3.multiply(this.m_stack[i], m as Mat3);
			this.m_cache[i] = m;
		}

		this.valid = this.c_stack - 1;

		this.result = this.m_cache[this.c_stack];

		return this.result;
	};


	pushMatrix() {
		this.c_stack++;
		this.m_stack[this.c_stack] = this.getIdentity();
	};

	popMatrix() {
		if (this.c_stack === 0) { return; }
		this.c_stack--;
	};


	translate(x: number, y: number) {
		this.translateMatrix[6] = x;
		this.translateMatrix[7] = y;

		mat3.multiply(this.translateMatrix, this.m_stack[this.c_stack]);

		/*
		if (this.valid === this.c_stack && this.c_stack) {
			this.valid--;
		}
		*/
	};


	scale(x: number, y: number) {
		this.scaleMatrix[0] = x;
		this.scaleMatrix[4] = y;

		mat3.multiply(this.scaleMatrix, this.m_stack[this.c_stack]);

		/*
		if (this.valid === this.c_stack && this.c_stack) {
			this.valid--;
		}
		*/
	};


	rotate(ang: number) {
		var sAng, cAng;

		sAng = Math.sin(-ang);
		cAng = Math.cos(-ang);

		this.rotateMatrix[0] = cAng;
		this.rotateMatrix[3] = sAng;
		this.rotateMatrix[1] = -sAng;
		this.rotateMatrix[4] = cAng;

		mat3.multiply(this.rotateMatrix, this.m_stack[this.c_stack]);

		/*
		if (this.valid === this.c_stack && this.c_stack) {
			this.valid--;
		}
		*/
	};
}



// Shader Pool BitMasks, i.e. sMask = (shaderMask.texture+shaderMask.stroke)

let rectVertexPositionBuffer: any;

// 2D Vertices and Texture UV coords
let rectVerts = new Float32Array([
	0, 0, 0, 0,
	0, 1, 0, 1,
	1, 1, 1, 1,
	1, 0, 1, 0
]);

class WebGLImageRenderer {
	static affect(canvas: HTMLCanvasElement, options?: WGLOptions) {
		return (canvas as any)?.gl2d || new WebGLImageRenderer(canvas, options);
	};
	static instances: WebGLImageRenderer[] = [];
	// static enable(canvas: HTMLCanvasElement, options: WGLOptions) {
	// 	return (canvas as any)?.gl2d || new WebGLCanvas(canvas, options);
	// }

	canvas: GL2DCanvas;
	options: WGLOptions;
	gl: WebGLRenderingContext = void 0 as any;
	fs: WebGLShader = void 0 as any;
	vs: WebGLShader = void 0 as any;
	shaderProgram = void 0 as any;
	transform = new Transform();
	shaderPool: any[] = [];
	maxTextureSize = void 0 as any;
	$getContext: HTMLCanvasElement["getContext"];

	drawImage: (
		image: Image33,
		a?: number, b?: number, c?: number, d?: number, e?: number, f?: number, g?: number, h?: number
	) => void = () => void 0;

	clearRect: (x: number, y: number, width?: number, height?: number) => void = () => void 0;

	constructor(canvas: HTMLCanvasElement, options?: WGLOptions) {
		this.canvas = canvas as GL2DCanvas;
		this.options = options || {};
		this.transform = new Transform();

		// Save a reference to the WebGL2D instance on the canvas object
		// @ts-ignore
		canvas.gl2d = this;

		// Store getContext function for later use
		this.$getContext = canvas.getContext.bind(canvas);

		this.createContext();
		this.postInit();
	}

	createContext() {
		if (this.gl)
			return this.gl;

		let gl = this.gl = (this.canvas.getContext)("experimental-webgl") as WebGLRenderingContext;
		this.initShaders();
		this.initBuffers();

		// Append Canvas2D API features to the WebGL context
		this.initCanvas2DAPI();

		gl.viewport(0, 0, this.canvas.width, this.canvas.height);

		// Default white background
		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT); // | gl.DEPTH_BUFFER_BIT);

		// Disables writing to dest-alpha
		// gl.colorMask(true, true, true, false);

		// Depth options
		//gl.enable(gl.DEPTH_TEST);
		//gl.depthFunc(gl.LEQUAL);

		// Blending options
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

		return gl;
	}




	// Initialize fragment and vertex shaders
	initShaders(transformStackDepth?: number, sMask?: any) {
		let gl = this.gl;

		transformStackDepth = transformStackDepth || 1;
		sMask = sMask || 0;
		let storedShader: any = this.shaderPool[transformStackDepth];

		if (!storedShader) { storedShader = this.shaderPool[transformStackDepth] = []; }
		storedShader = storedShader[sMask];

		if (storedShader) {
			gl.useProgram(storedShader);
			this.shaderProgram = storedShader;
			return storedShader;
		} else {
			console.log(gl)
			let fs = this.fs = (gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader);
			gl.shaderSource(this.fs, getFragmentShaderSource(sMask));
			gl.compileShader(this.fs);

			if (!gl.getShaderParameter(this.fs, gl.COMPILE_STATUS)) {
				throw "fragment shader error: " + gl.getShaderInfoLog(this.fs);
			}

			var vs = this.vs = (gl.createShader(gl.VERTEX_SHADER) as WebGLShader);
			gl.shaderSource(this.vs, getVertexShaderSource(transformStackDepth, sMask));
			gl.compileShader(this.vs);

			if (!gl.getShaderParameter(this.vs, gl.COMPILE_STATUS)) {
				throw "vertex shader error: " + gl.getShaderInfoLog(this.vs);
			}


			let shaderProgram = this.shaderProgram = gl.createProgram() as WebGLProgram;
			// @ts-ignore
			shaderProgram.stackDepth = transformStackDepth;
			gl.attachShader(shaderProgram, fs);
			gl.attachShader(shaderProgram, vs);
			gl.linkProgram(shaderProgram);

			if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
				throw "Could not initialise shaders.";
			}

			gl.useProgram(shaderProgram);
			// @ts-ignore
			shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
			// @ts-ignore
			gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
			// @ts-ignore
			shaderProgram.uColor = gl.getUniformLocation(shaderProgram, "uColor");

			// @ts-ignore
			shaderProgram.uSampler = gl.getUniformLocation(shaderProgram, "uSampler");
			// @ts-ignore
			shaderProgram.uCropSource = gl.getUniformLocation(shaderProgram, "uCropSource");

			// @ts-ignore
			shaderProgram.uTransforms = [];
			for (let i = 0; i < transformStackDepth; ++i) {
				// @ts-ignore
				shaderProgram.uTransforms[i] = gl.getUniformLocation(shaderProgram, "uTransforms[" + i + "]");
			} //for
			this.shaderPool[transformStackDepth][sMask] = shaderProgram;
			return shaderProgram;
		} //if
	};

	initBuffers() {
		let gl = this.gl;

		rectVertexPositionBuffer = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, rectVerts, gl.STATIC_DRAW);
	}

	postInit() {
		WebGLImageRenderer.instances.push(this);
	}

	initCanvas2DAPI() {
		let gl2d = this,
			gl = this.gl;

		let ctx = gl as any as CanvasRenderingContext2D;


		// Rendering Canvas for text fonts

		// Maintain drawing state params during gl.save and gl.restore. see saveDrawState() and restoreDrawState()


		// WebGL requires colors as a vector while Canvas2D sets colors as an rgba string
		// These getters and setters store the original rgba string as well as convert to a vector

		// WebGL already has a lineWidth() function but Canvas2D requires a lineWidth property
		// Store the original lineWidth() function for later use
		// @ts-ignore
		gl.$lineWidth = gl.lineWidth;

		let tempCanvas = document.createElement("canvas");
		let tempCtx: CanvasRenderingContext2D = tempCanvas.getContext("2d") as any;

		ctx.getImageData = function getImageData(x: number, y: number, width: number, height: number) {
			var data = tempCtx.createImageData(width, height);
			var buffer = new Uint8Array(width * height * 4);
			gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
			var w = width * 4, h = height;
			for (var i = 0, maxI = h / 2; i < maxI; ++i) {
				for (var j = 0, maxJ = w; j < maxJ; ++j) {
					var index1 = i * w + j;
					var index2 = (h - i - 1) * w + j;
					data.data[index1] = buffer[index2];
					data.data[index2] = buffer[index1];
				} //for
			} //for

			return data;
		};

		ctx.putImageData = function putImageData(imageData: any, x: number, y: number) {
			ctx.drawImage(imageData, x, y);
		};

		function sendTransformStack(sp: any) {
			let stack = gl2d.transform.m_stack;
			for (let i = 0, maxI = gl2d.transform.c_stack + 1; i < maxI; ++i) {
				gl.uniformMatrix3fv(sp.uTransforms[i], false, stack[maxI - 1 - i]);
			} //for
		}

		let imageCache: any[] = [],
			textureCache: any[] = [];

		class Texture {
			obj: any;
			index: any;

			constructor(image: HTMLImageElement | HTMLCanvasElement) {
				this.obj = gl.createTexture();
				this.index = textureCache.push(this);

				imageCache.push(image);

				// we may wish to consider tiling large images like this instead of scaling and
				// adjust appropriately (flip to next texture source and tile offset) when drawing
				if (image.width > gl2d.maxTextureSize || image.height > gl2d.maxTextureSize) {
					var canvas = document.createElement("canvas");

					canvas.width = (image.width > gl2d.maxTextureSize) ? gl2d.maxTextureSize : image.width;
					canvas.height = (image.height > gl2d.maxTextureSize) ? gl2d.maxTextureSize : image.height;

					let ctx: CanvasRenderingContext2D = canvas.getContext("2d") as any;

					ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);

					image = canvas;
				}

				gl.bindTexture(gl.TEXTURE_2D, this.obj);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

				// Enable Mip mapping on power-of-2 textures
				if (isPOT(image.width) && isPOT(image.height)) {
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
					gl.generateMipmap(gl.TEXTURE_2D);
				} else {
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				}

				// Unbind texture
				gl.bindTexture(gl.TEXTURE_2D, null);
			}
		} function transformAndScale(x: number, y: number, width: number, height: number) {
			const pos = normalizeToNDC(x, y, gl.canvas.width, gl.canvas.height);
			const size = normalizeToNDC(x + width, y + height, gl.canvas.width, gl.canvas.height);
			gl2d.transform.translate(pos.x, pos.y);
			gl2d.transform.scale(size.x - pos.x, size.y - pos.y);
			// console.log(width, height);
			// getMathDim(gl2d.transform.m_stack[gl2d.transform.c_stack]);
		}
		this.drawImage = function drawImage(
			image: Image33,
			a?: number, b?: number, c?: number, d?: number, e?: number, f?: number, g?: number, h?: number
		) {
			if ((image as any).getContext2D == null && IsImageOk(image as HTMLImageElement) != true)
				return;

			var transform = gl2d.transform;

			transform.pushMatrix();

			var sMask = shaderMask.texture;
			var doCrop = false;

			//drawImage(image, dx, dy)
			if (arguments.length === 3) {
				transformAndScale(a ?? 0, b ?? 0, image.width, image.height);
				// transform.translate(a ?? 0, b ?? 0);
				// transform.scale(image.width, image.height);
			}

			//drawImage(image, dx, dy, dw, dh)
			else if (arguments.length === 5) {
				transformAndScale(a ?? 0, b ?? 0, c ?? 0, d ?? 0);
				// transform.translate(a ?? 0, b ?? 0);
				// transform.scale(c ?? 0, d ?? 0);
			}

			//drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
			else if (arguments.length === 9) {
				// transform.translate(e ?? 0, f ?? 0);
				// transform.scale(g ?? 0, h ?? 0);
				transformAndScale(e ?? 0, f ?? 0, g ?? 0, h ?? 0);
				sMask = sMask | shaderMask.crop;
				doCrop = true;
			}

			var shaderProgram = gl2d.initShaders(transform.c_stack, sMask);

			var texture, cacheIndex = imageCache.indexOf(image);

			if (cacheIndex !== -1) {
				texture = textureCache[cacheIndex];
			} else {
				texture = new Texture(image);
			}

			if (doCrop) {
				gl.uniform4f(shaderProgram.uCropSource, (a ?? 0) / image.width, (b ?? 0) / image.height, (c ?? 0) / image.width, (d ?? 0) / image.height);
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);

			gl.bindTexture(gl.TEXTURE_2D, texture.obj);
			gl.activeTexture(gl.TEXTURE0);

			gl.uniform1i(shaderProgram.uSampler, 0);

			sendTransformStack(shaderProgram);
			gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

			transform.popMatrix();
		};

		this.clearRect = function (x: number, y: number, width: number = gl.canvas.width, height: number = gl.canvas.height) {
			gl.enable(gl.SCISSOR_TEST);
			// set the scissor rectangle.
			gl.scissor(x, y, width, height);

			// clear.
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			// turn off the scissor test so you can render like normal again.
			gl.disable(gl.SCISSOR_TEST);
		}
	}
}