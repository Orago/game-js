import { Emitter, type Vector } from "@orago/lib";
import { EnginePlugin } from "../base.js";
import Engine from "../engine.js";
type Control = "pc" | "mobile";
interface Options {
    min?: number;
    max?: number;
    mobile_factor: number;
    pc_factor: number;
}
export declare class PanningPlugin extends EnginePlugin {
    focus_element?: HTMLElement | undefined;
    modes: {
        panning: boolean;
        zoom: boolean;
    };
    options: Options;
    pan: {
        start: {
            x: number;
            y: number;
        };
        offset: {
            x: number;
            y: number;
        };
        change: {
            x: number;
            y: number;
        };
        state: boolean;
        active: boolean;
    };
    private PC?;
    private Mobile?;
    events: Emitter<{
        "plugin:add": (engine: Engine) => void;
        "plugin:remove": (engine: Engine) => void;
    }, true>;
    engine?: Engine;
    constructor(controls: Control[] | "all", focus_element?: HTMLElement | undefined);
    onAdd(engine: Engine): void;
    onRemove(engine: Engine): void;
    private interactionEnd;
    toggleModes(status: boolean, modes: (keyof typeof this.modes)[]): this;
    panStart(pos: Vector.Point): void;
    panReset(): void;
    translate(pos: Vector.Point): void;
    setZoom(value: number, position: Vector.Point): void;
    factorZoom(zoom: number, pos: Vector.Point): void;
    private handleWheel;
    setZoomTrim(value: number): void;
}
export {};
