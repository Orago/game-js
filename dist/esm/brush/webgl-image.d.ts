declare let shaderMask: {
    texture: number;
    crop: number;
    path: number;
};
declare function normalizeToNDC(x: number, y: number, canvasWidth: number, canvasHeight: number): {
    x: number;
    y: number;
};
declare function getFragmentShaderSource(sMask: number): string;
declare function getVertexShaderSource(stackDepth: number, sMask: number): string;
/**
 *  WebGL-2D.js - HTML5 Canvas2D API in a WebGL context
 *
 *  Created by Corban Brook <corbanbrook@gmail.com> on 2011-03-02.
 *  Amended to by Bobby Richter <secretrobotron@gmail.com> on 2011-03-03
 *  CubicVR.js by Charles Cliffe <cj@cubicproductions.com> on 2011-03-03
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
type Image33 = HTMLImageElement | HTMLCanvasElement;
type GL2DCanvas = HTMLCanvasElement & ({
    gl2d: WebGLImageRenderer;
    $getContext: HTMLCanvasElement["getContext"];
});
interface WGLOptions {
    force?: boolean;
}
declare function isPOT(value: number): boolean;
declare function IsImageOk(img: HTMLImageElement): boolean;
declare let mat3: {
    identity: Mat3;
    multiply(m1: Mat3, m2: Mat3): void;
    vec2_multiply(m1: Mat3, m2: Mat3): Mat3;
    transpose(m: Mat3): number[];
};
declare class Transform {
    static STACK_DEPTH_LIMIT: number;
    m_stack: any[];
    m_cache: any[];
    c_stack: number;
    valid: number;
    result: null;
    translateMatrix: Mat3;
    scaleMatrix: Mat3;
    rotateMatrix: Mat3;
    constructor(mat?: Mat3);
    clearStack(init_mat?: Mat3): void;
    setIdentity(): void;
    getIdentity(): Mat3;
    getResult(): any;
    pushMatrix(): void;
    popMatrix(): void;
    translate(x: number, y: number): void;
    scale(x: number, y: number): void;
    rotate(ang: number): void;
}
declare let rectVertexPositionBuffer: any;
declare let rectVerts: Float32Array<ArrayBuffer>;
declare class WebGLImageRenderer {
    static affect(canvas: HTMLCanvasElement, options?: WGLOptions): any;
    static instances: WebGLImageRenderer[];
    canvas: GL2DCanvas;
    options: WGLOptions;
    gl: WebGLRenderingContext;
    fs: WebGLShader;
    vs: WebGLShader;
    shaderProgram: any;
    transform: Transform;
    shaderPool: any[];
    maxTextureSize: any;
    $getContext: HTMLCanvasElement["getContext"];
    drawImage: (image: Image33, a?: number, b?: number, c?: number, d?: number, e?: number, f?: number, g?: number, h?: number) => void;
    clearRect: (x: number, y: number, width?: number, height?: number) => void;
    constructor(canvas: HTMLCanvasElement, options?: WGLOptions);
    createContext(): WebGLRenderingContext;
    initShaders(transformStackDepth?: number, sMask?: any): any;
    initBuffers(): void;
    postInit(): void;
    initCanvas2DAPI(): void;
}
