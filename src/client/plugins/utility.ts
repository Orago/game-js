import { EnginePlugin } from "../base.js";
import type { Shapes } from "../../index.js";
import type Engine from "../engine.js";

export class EngineClampPlugin extends EnginePlugin {
	constructor(public rectangle: Shapes.RectangleLike) {
		super();
		this.rectangle = rectangle;
	}

	onUpdate(engine: Engine): void {
		this.clamp(engine);
	}

	clamp(engine: Engine) {
		const half_w = engine.brush.width / engine.camera.zoom / 2;
		const half_h = engine.brush.height / engine.camera.zoom / 2;
		const camera = engine.camera;

		camera.x = Math.min(
			Math.max(camera.x, half_w),
			this.rectangle.width - half_w
		);

		camera.y = Math.min(
			Math.max(camera.y, half_h),
			this.rectangle.height - half_h
		);
	}
}
