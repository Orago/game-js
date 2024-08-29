"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.System = void 0;
class System {
    constructor(ecs) {
        this.priority = 1;
        this.dirtyComponents = new Set();
        this.id = System.count++;
        this.ecs = ecs;
    }
}
exports.System = System;
System.count = 0;
