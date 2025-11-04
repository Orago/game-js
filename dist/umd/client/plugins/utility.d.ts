import { EnginePlugin } from "../base.js";
import type { Shapes } from "../../index.js";
import type Engine from "../engine.js";
export declare class EngineClampPlugin extends EnginePlugin {
    rectangle: Shapes.RectangleLike;
    constructor(rectangle: Shapes.RectangleLike);
    onUpdate(engine: Engine): void;
    clamp(engine: Engine): void;
}
