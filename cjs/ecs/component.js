"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Component = void 0;
class Component {
    constructor() {
        /**
         * Overridden by ECS once it tracks this Component.
         */
        this.signal = () => { };
    }
    /**
     * If a Component wants to support dirty Component optimization, it
     * manages its own bookkeeping of whether its state has changed,
     * and calls `dirty()` on itself when it has.
     */
    dirty() {
        this.signal();
    }
}
exports.Component = Component;
