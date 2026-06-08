import { Emitter, type Vector } from "@orago/lib";
import { EnginePlugin } from "../base.js";
import Engine from "../engine.js";
import { MouseButton } from "../input/symbols.js";
import { CursorButtonPressContext } from "../input/cursor.js";

function getMidpoint(points: Vector.Point[]) {
	const midpoint = {
		x: points.reduce((x, point) => x + point.x, 0) / points.length,
		y: points.reduce((y, point) => y + point.y, 0) / points.length,
	};

	return midpoint;
}

function getDistance(point1: Vector.Point, point2: Vector.Point) {
	const dx = point2.x - point1.x;
	const dy = point2.y - point1.y;

	return Math.sqrt(dx ** 2 + dy ** 2);
}

function getTotalDistance(points: Vector.Point[]) {
	let total_distance = 0;

	for (let i = 0; i < points.length - 1; i++) {
		total_distance += getDistance(points[i], points[i + 1]);
	}

	return total_distance;
}

class PCHandler {
	constructor(public parent: PanningPlugin) {}

	panTick(): void {
		if (this.parent.modes.panning && this.parent.pan.active) {
			this.panMove();
		}
	}

	panMove(): void {
		if (this.parent.engine == undefined) {
			return;
		}
		const { cursor } = this.parent.engine;
		this.parent.panStart(cursor.position);
		this.parent.translate(cursor.position);
	}
}

class MobileHandler {
	start: MobileStart = {
		points: [],
		size: 0,
	};

	last_distance?: number;

	constructor(public parent: PanningPlugin) {}

	pan(e: TouchEvent): void {
		if (this.parent.pan.active) {
			this.panMove(e);
		}
	}

	reset(): void {
		if (this.parent.pan.state != true) {
			return;
		}

		this.parent.panReset();
		this.start.points = [];
		this.start.size = 0;
		delete this.last_distance;
	}

	touchToPoints(e: TouchEvent) {
		const points: Vector.Point[] = [];

		for (let i = 0; i < e.touches.length; i++) {
			const touch = e.touches[i];

			points.push({
				x: touch.clientX,
				y: touch.clientY,
			});
		}

		return points;
	}

	panMove(e: TouchEvent): void {
		const parent = this.parent;
		const points = this.touchToPoints(e);
		const position = getMidpoint(points);

		if (parent.pan.state != true) {
			parent.pan.state = true;
			parent.pan.start = position;
		}

		if (points.length >= 2 && parent.modes.zoom == true) {
			const total = getTotalDistance(points);

			if (total != this.last_distance && this.last_distance) {
				const change = total / this.last_distance;

				parent.factorZoom(
					change * parent.options.touch_zoom_factor,
					position
				);
			}

			/* Update after */
			this.last_distance = total;
		}

		if (parent.modes.panning) {
			parent.translate(position);
		}
	}
}

interface MobileStart {
	points: Vector.Point[];
	size: number;
}

type Control = "pc" | "mobile";

interface Options {
	min?: number;
	max?: number;
	touch_zoom_factor: number;
	mouse_zoom_factor: number;
}

export class PanningPlugin extends EnginePlugin {
	public modes = {
		panning: false,
		zoom: false,
	};

	public options: Options = {
		min: undefined,
		max: undefined,
		touch_zoom_factor: 1,
		mouse_zoom_factor: 1,
	};

	public pan = {
		start: { x: 0, y: 0 },
		offset: { x: 0, y: 0 },
		change: { x: 0, y: 0 },
		state: false,
		active: false,
	};

	private PC?: PCHandler;
	private Mobile?: MobileHandler;

	events: Emitter<
		{
			"plugin:add": (engine: Engine) => void;
			"plugin:remove": (engine: Engine) => void;
		},
		true
	> = new Emitter();

	engine?: Engine;

	constructor(
		// public engine: Engine,
		options: {
			controls?: Control[] | "all";
			focus?: HTMLElement;
			modes: (keyof PanningPlugin["modes"])[];
		}
	) {
		super();

		let controls: Control[] =
			options.controls == "all" || options.controls == undefined
				? ["pc", "mobile"]
				: options.controls;

		for (const mode of options.modes) {
			this.modes[mode] = true;
		}

		const touchStart = (c: CursorButtonPressContext) => {
			if (c.which == "Middle" || c.which == "Touch") {
				this.pan.active = true;
				c.preventDefault();
			}
		};

		const touchEnd = (c: CursorButtonPressContext) => {
			if (c.which == "Middle" || c.which == "Touch") {
				this.interactionEnd();
				c.preventDefault();
			}
		};

		if (controls.includes("pc")) {
			this.PC = new PCHandler(this);

			const mouseMove = () => this.PC?.panTick();
			const bound = this.handleWheel.bind(this);
			const mouseOut = () => this.interactionEnd();
			this.events
				.on("plugin:add", (engine) => {
					const cursor = engine.cursor;
					const wheel_element = options.focus ?? engine.dom.element;
					wheel_element.addEventListener("wheel", bound);
					cursor.element.addEventListener("mousemove", mouseMove);
					cursor.element.addEventListener("mouseout", mouseOut);

					cursor.events.on("button-down", touchStart);
					cursor.events.on("button-up", touchEnd);
				})
				.on("plugin:remove", (engine) => {
					const cursor = engine.cursor;
					const wheel_element = options.focus ?? engine.dom.element;
					wheel_element.removeEventListener("wheel", bound);
					cursor.element.removeEventListener("mousemove", mouseMove);
					cursor.element.removeEventListener("mouseout", mouseOut);
					cursor.events.off("button-down", touchStart);
					cursor.events.off("button-up", touchEnd);
				});
		}

		if (controls.includes("mobile")) {
			this.Mobile = new MobileHandler(this);

			const touchMove = (e: TouchEvent) => this.Mobile?.pan(e);

			this.events
				.on("plugin:add", (engine) => {
					const cursor = engine.cursor;
					cursor.element.addEventListener("touchmove", touchMove);
					// cursor.element.addEventListener("touchstart", touchStart);
					// cursor.element.addEventListener("touchend", touchEnd);
				})
				.on("plugin:remove", (engine) => {
					const cursor = engine.cursor;
					cursor.element.removeEventListener("touchmove", touchMove);
					// cursor.element.removeEventListener(
					// 	"touchstart",
					// 	touchStart
					// );
					// cursor.element.removeEventListener("touchend", touchEnd);
				});
		}
	}

	onAdd(engine: Engine): void {
		if (this.engine != undefined && engine != this.engine) {
			this.events.emit("plugin:remove", this.engine);
		}
		this.engine = engine;
		this.events.emit("plugin:add", engine);
	}

	onRemove(engine: Engine): void {
		this.events.emit("plugin:remove", engine);
		delete this.engine;
	}

	private interactionEnd() {
		if (this.pan.active) {
			this.Mobile?.reset();
			this.panReset();
		}

		this.pan.active = false;
	}

	public toggleModes(status: boolean, modes: (keyof typeof this.modes)[]) {
		for (const mode of modes) {
			this.modes[mode] = status;
		}

		return this;
	}

	public panStart(pos: Vector.Point) {
		if (this.modes.panning != true || this.pan.state == true) {
			return;
		}

		this.pan.state = true;
		this.pan.start = pos;
	}

	public panReset() {
		if (this.engine == undefined || this.modes.panning != true) {
			return;
		}
		const { pan } = this;

		pan.state = false;
		this.engine.camera.x = pan.offset.x -= pan.change.x;
		this.engine.camera.y = pan.offset.y -= pan.change.y;
		pan.change.x = 0;
		pan.change.y = 0;
	}

	public translate(pos: Vector.Point) {
		if (this.engine == undefined || this.modes.panning != true) {
			return;
		}
		const camera = this.engine.camera;
		const pan = this.pan;

		pan.change.x = (pos.x - pan.start.x) / camera.zoom;
		pan.change.y = (pos.y - pan.start.y) / camera.zoom;
		camera.x = pan.offset.x - pan.change.x;
		camera.y = pan.offset.y - pan.change.y;
	}

	public setZoom(value: number, position: Vector.Point): void {
		if (this.engine == undefined) {
			return;
		} else if (this.modes.panning != true) {
			return this.setZoomTrim(value), void 0;
		}
		const camera = this.engine.camera;

		if (this.options.min != null && value < this.options.min) {
			return this.setZoom(this.options.min, position);
		} else if (this.options.max && value > this.options.max) {
			return this.setZoom(this.options.max, position);
		}

		const before = Engine.screenToWorld(position, camera);
		camera.zoom = value;

		const after = Engine.screenToWorld(position, camera);

		this.pan.offset.x += before.x - after.x;
		this.pan.offset.y += before.y - after.y;
		camera.x += before.x - after.x;
		camera.y += before.y - after.y;
	}

	public factorZoom(zoom: number, pos: Vector.Point): void {
		if (this.engine == undefined) {
			return;
		}
		this.setZoom(this.engine.camera.zoom * zoom, pos);
	}

	private handleWheel(event: WheelEvent): void {
		if (this.engine == undefined || this.modes.zoom != true) {
			return;
		}

		const zoom =
			(1.1 * this.options.mouse_zoom_factor) **
			(event.deltaY < 0 ? 1 : -1);

		this.factorZoom(zoom, this.engine.cursor.position);
	}

	setZoomTrim(value: number): void {
		if (this.engine == undefined) {
			return;
		}
		this.engine.camera.zoom = value;

		if (this.options.min) {
			this.engine.camera.zoom = Math.max(
				this.engine.camera.zoom,
				this.options.min
			);
		}

		if (this.options.max) {
			this.engine.camera.zoom = Math.min(
				this.engine.camera.zoom,
				this.options.max
			);
		}
	}
}
