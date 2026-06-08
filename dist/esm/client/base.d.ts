import type Engine from "./engine.js";
export declare class EnginePlugin {
    order?: number;
    constructor();
    onAdd?(engine: Engine): void;
    onRemove?(engine: Engine): void;
    onRender?(engine: Engine): void;
    onUpdate?(engine: Engine): void;
}
export declare class PluginManager {
    private engine;
    list: Set<EnginePlugin>;
    /** Handling order */
    ordered_list: EnginePlugin[];
    /** Shouldn't be accessed outside of engine */
    temp0: {
        render: EnginePlugin[];
        update: EnginePlugin[];
    };
    constructor(engine: Engine);
    /**
     * Rebuilds the plugin list
     */
    changed(): void;
    add(...plugins: EnginePlugin[]): void;
    remove(plugin: EnginePlugin): void;
    clear(): void;
}
export declare class EngineObject {
    order?: number;
    constructor();
    onAdd?(engine: Engine): void;
    onRemove?(engine: Engine): void;
    onRender?(engine: Engine): void;
    onUpdate?(engine: Engine): void;
}
export declare class ObjectManager {
    private engine;
    list: Set<EngineObject>;
    /** Handling order */
    ordered_list: EngineObject[];
    /** Shouldn't be accessed outside of engine */
    temp0: {
        render: EngineObject[];
        update: EngineObject[];
    };
    constructor(engine: Engine);
    changed(): void;
    add(value: EngineObject): void;
    remove(value: EngineObject): void;
    clear(): void;
}
