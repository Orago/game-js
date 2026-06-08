(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectManager = exports.EngineObject = exports.PluginManager = exports.EnginePlugin = void 0;
    class EnginePlugin {
        constructor() { }
    }
    exports.EnginePlugin = EnginePlugin;
    class PluginManager {
        constructor(engine) {
            this.engine = engine;
            this.list = new Set();
            /** Handling order */
            this.ordered_list = [];
            /** Shouldn't be accessed outside of engine */
            this.temp0 = {
                render: [],
                update: [],
            };
            this.engine = engine;
        }
        /**
         * Rebuilds the plugin list
         */
        changed() {
            this.ordered_list = Array.from(this.list.values()).sort((a, b) => { var _a, _b; return ((_a = a.order) !== null && _a !== void 0 ? _a : 0) - ((_b = b.order) !== null && _b !== void 0 ? _b : 0); });
        }
        add(...plugins) {
            var _a;
            for (const plugin of plugins) {
                if (this.list.has(plugin)) {
                    continue;
                }
                (_a = plugin.onAdd) === null || _a === void 0 ? void 0 : _a.call(plugin, this.engine);
                this.list.add(plugin);
                this.changed();
            }
        }
        remove(plugin) {
            var _a;
            if (this.list.has(plugin) != true) {
                return;
            }
            (_a = plugin.onRemove) === null || _a === void 0 ? void 0 : _a.call(plugin, this.engine);
            this.list.delete(plugin);
            this.changed();
        }
        clear() {
            for (const value of this.list) {
                this.remove(value);
            }
        }
    }
    exports.PluginManager = PluginManager;
    class EngineObject {
        constructor() { }
    }
    exports.EngineObject = EngineObject;
    class ObjectManager {
        constructor(engine) {
            this.engine = engine;
            this.list = new Set();
            /** Handling order */
            this.ordered_list = [];
            /** Shouldn't be accessed outside of engine */
            this.temp0 = {
                render: [],
                update: [],
            };
            this.engine = engine;
        }
        changed() {
            this.ordered_list = Array.from(this.list.values()).sort((a, b) => { var _a, _b; return ((_a = a.order) !== null && _a !== void 0 ? _a : 0) - ((_b = b.order) !== null && _b !== void 0 ? _b : 0); });
        }
        add(value) {
            var _a;
            if (this.list.has(value)) {
                return;
            }
            (_a = value.onAdd) === null || _a === void 0 ? void 0 : _a.call(value, this.engine);
            this.list.add(value);
            this.changed();
        }
        remove(value) {
            var _a;
            if (this.list.has(value) != true) {
                return;
            }
            (_a = value.onRemove) === null || _a === void 0 ? void 0 : _a.call(value, this.engine);
            this.list.delete(value);
            this.changed();
        }
        clear() {
            for (const value of this.list) {
                this.remove(value);
            }
        }
    }
    exports.ObjectManager = ObjectManager;
});
