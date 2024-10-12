"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyEntity = exports.LegacySystem = void 0;
const emitter_1 = __importDefault(require("@orago/lib/emitter"));
const ecs_1 = require("@orago/ecs");
class LegacySignature extends ecs_1.Component {
}
;
const sig = new LegacySignature();
class LegacySystem extends ecs_1.System {
    constructor(ecs, world) {
        super(ecs);
        this.world = world;
        this.componentsRequired = new Set([LegacySignature]);
        this.world = world;
    }
    update(entities) {
        for (const entity of Array.from(entities).sort((a, b) => a.priority - b.priority)) {
            entity.events.emit('update');
            entity.events.emit('render');
        }
    }
}
exports.LegacySystem = LegacySystem;
class LegacyEntity extends ecs_1.Entity {
    constructor(ecs) {
        super(ecs);
        this.events = new emitter_1.default();
        this.priority = 0;
        this.addComponent(sig);
    }
    ref(fn) {
        fn.bind(this)(this);
        return this;
    }
    tick() {
        this.events.emit('update');
        this.events.emit('render');
    }
}
exports.LegacyEntity = LegacyEntity;
