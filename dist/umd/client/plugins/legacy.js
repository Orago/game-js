var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@orago/ecs", "@orago/lib/emitter"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LegacyEntity = exports.LegacySystem = void 0;
    const ecs_1 = require("@orago/ecs");
    const emitter_1 = __importDefault(require("@orago/lib/emitter"));
    class LegacySignature extends ecs_1.Component {
    }
    const sig = new LegacySignature();
    class LegacySystem extends ecs_1.System {
        constructor(ecs, world) {
            super();
            this.world = world;
            this.components = new Set([LegacySignature]);
            this.world = world;
        }
        update(entities) {
            for (const entity of Array.from(entities).sort((a, b) => a.priority - b.priority)) {
                entity.events.emit("update").emit("render");
            }
        }
    }
    exports.LegacySystem = LegacySystem;
    class LegacyEntity extends ecs_1.Entity {
        constructor(ecs) {
            super();
            this.events = new emitter_1.default();
            this.priority = 0;
            ecs.components.add(this, sig);
        }
        ref(fn) {
            fn.bind(this)(this);
            return this;
        }
        tick() {
            this.events.emit("update");
            this.events.emit("render");
        }
    }
    exports.LegacyEntity = LegacyEntity;
});
