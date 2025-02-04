/**
 *  WebGL-2D.js - HTML5 Canvas2D API in a WebGL context
 *
 *  Created by Corban Brook <corbanbrook@gmail.com> on 2011-03-02.
 *  Amended to by Bobby Richter <secretrobotron@gmail.com> on 2011-03-03
 *  CubicVR.js by Charles Cliffe <cj@cubicproductions.com> on 2011-03-03
 *
 */
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
type GL2DCanvas = HTMLCanvasElement & ({
    gl2d: WebGLCanvas;
    $getContext: HTMLCanvasElement["getContext"];
});
interface WGLOptions {
    force?: boolean;
}
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
export declare class WebGLCanvas {
    static affect(canvas: HTMLCanvasElement, options?: WGLOptions): any;
    static instances: WebGLCanvas[];
    canvas: GL2DCanvas;
    options: WGLOptions;
    gl: WebGLRenderingContext;
    fs: WebGLShader;
    vs: WebGLShader;
    shaderProgram: any;
    transform: Transform;
    shaderPool: any[];
    maxTextureSize: any;
    constructor(canvas: HTMLCanvasElement, options?: WGLOptions);
    getFragmentShaderSource(sMask: any): string;
    getVertexShaderSource(stackDepth: number, sMask: any): string;
    initShaders(transformStackDepth?: number, sMask?: any): any;
    initBuffers(): void;
    postInit(): void;
    initCanvas2DAPI(): void;
}
export {};
