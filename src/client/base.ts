import type Engine from "./engine.js";

export class EnginePlugin {
	order?: number;

	constructor() {}

	onAdd?(engine: Engine): void;
	onRemove?(engine: Engine): void;
	onRender?(engine: Engine): void;
	onUpdate?(engine: Engine): void;
}

export class PluginManager {
	list: Set<EnginePlugin> = new Set();
	/** Handling order */
	ordered_list: EnginePlugin[] = [];
	/** Shouldn't be accessed outside of engine */

	temp0: {
		render: EnginePlugin[];
		update: EnginePlugin[];
	} = {
		render: [],
		update: [],
	};

	constructor(private engine: Engine) {
		this.engine = engine;
	}

	/**
	 * Rebuilds the plugin list
	 */
	public changed() {
		this.ordered_list = Array.from(this.list.values()).sort(
			(a, b) => (a.order ?? 0) - (b.order ?? 0)
		);
	}

	add(...plugins: EnginePlugin[]): void {
		for (const plugin of plugins) {
			if (this.list.has(plugin)) {
				continue;
			}
			plugin.onAdd?.(this.engine);
			this.list.add(plugin);
			this.changed();
		}
	}

	remove(plugin: EnginePlugin): void {
		if (this.list.has(plugin) != true) {
			return;
		}
		plugin.onRemove?.(this.engine);
		this.list.delete(plugin);
		this.changed();
	}

	clear(): void {
		for (const value of this.list) {
			this.remove(value);
		}
	}
}

export class EngineObject {
	order?: number;

	constructor() {}

	onAdd?(engine: Engine): void;
	onRemove?(engine: Engine): void;
	onRender?(engine: Engine): void;
	onUpdate?(engine: Engine): void;
}

export class ObjectManager {
	list: Set<EngineObject> = new Set();
	/** Handling order */
	ordered_list: EngineObject[] = [];
	/** Shouldn't be accessed outside of engine */

	temp0: {
		render: EngineObject[];
		update: EngineObject[];
	} = {
		render: [],
		update: [],
	};

	constructor(private engine: Engine) {
		this.engine = engine;
	}

	public changed() {
		this.ordered_list = Array.from(this.list.values()).sort(
			(a, b) => (a.order ?? 0) - (b.order ?? 0)
		);
	}

	add(value: EngineObject): void {
		if (this.list.has(value)) {
			return;
		}
		value.onAdd?.(this.engine);
		this.list.add(value);
		this.changed();
	}

	remove(value: EngineObject): void {
		if (this.list.has(value) != true) {
			return;
		}
		value.onRemove?.(this.engine);
		this.list.delete(value);
		this.changed();
	}

	clear(): void {
		for (const value of this.list) {
			this.remove(value);
		}
	}
}
