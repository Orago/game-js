export class EnginePlugin {
    order;
    constructor() { }
}
export class PluginManager {
    engine;
    list = new Set();
    /** Handling order */
    ordered_list = [];
    /** Shouldn't be accessed outside of engine */
    temp0 = {
        render: [],
        update: [],
    };
    constructor(engine) {
        this.engine = engine;
        this.engine = engine;
    }
    /**
     * Rebuilds the plugin list
     */
    changed() {
        this.ordered_list = Array.from(this.list.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    add(plugin) {
        if (this.list.has(plugin)) {
            return;
        }
        plugin.onAdd?.(this.engine);
        this.list.add(plugin);
        this.changed();
    }
    remove(plugin) {
        if (this.list.has(plugin) != true) {
            return;
        }
        plugin.onRemove?.(this.engine);
        this.list.delete(plugin);
        this.changed();
    }
    clear() {
        for (const value of this.list) {
            this.remove(value);
        }
    }
}
export class EngineObject {
    order;
    constructor() { }
}
export class ObjectManager {
    engine;
    list = new Set();
    /** Handling order */
    ordered_list = [];
    /** Shouldn't be accessed outside of engine */
    temp0 = {
        render: [],
        update: [],
    };
    constructor(engine) {
        this.engine = engine;
        this.engine = engine;
    }
    changed() {
        this.ordered_list = Array.from(this.list.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    add(value) {
        if (this.list.has(value)) {
            return;
        }
        value.onAdd?.(this.engine);
        this.list.add(value);
        this.changed();
    }
    remove(value) {
        if (this.list.has(value) != true) {
            return;
        }
        value.onRemove?.(this.engine);
        this.list.delete(value);
        this.changed();
    }
    clear() {
        for (const value of this.list) {
            this.remove(value);
        }
    }
}
//# sourceMappingURL=base.js.map