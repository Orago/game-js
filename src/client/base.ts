import type Engine from "./engine.js";

export class EnginePlugin {
	order?: number;

	constructor() {}

	onAdd?(engine: Engine): void;
	onRemove?(engine: Engine): void;
	onRender?(engine: Engine): void;
	onUpdate?(engine: Engine): void;
}