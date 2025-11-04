var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@orago/lib", "../base.js", "../engine.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PanningPlugin = void 0;
    const lib_1 = require("@orago/lib");
    const base_js_1 = require("../base.js");
    const engine_js_1 = __importDefault(require("../engine.js"));
    function getMidpoint(points) {
        const midpoint = {
            x: points.reduce((x, point) => x + point.x, 0) / points.length,
            y: points.reduce((y, point) => y + point.y, 0) / points.length,
        };
        return midpoint;
    }
    function getDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    }
    function getTotalDistance(points) {
        let total_distance = 0;
        for (let i = 0; i < points.length - 1; i++) {
            total_distance += getDistance(points[i], points[i + 1]);
        }
        return total_distance;
    }
    class PCHandler {
        constructor(parent) {
            this.parent = parent;
        }
        panTick() {
            if (this.parent.modes.panning && this.parent.pan.active) {
                this.panMove();
            }
        }
        panMove() {
            if (this.parent.engine == undefined) {
                return;
            }
            const { cursor } = this.parent.engine;
            this.parent.panStart(cursor.position);
            this.parent.translate(cursor.position);
        }
    }
    class MobileHandler {
        constructor(parent) {
            this.start = {
                points: [],
                size: 0,
            };
            this.parent = parent;
        }
        pan(e) {
            if (this.parent.pan.active) {
                this.panMove(e);
            }
        }
        reset() {
            if (this.parent.pan.state != true) {
                return;
            }
            this.parent.panReset();
            this.start.points = [];
            this.start.size = 0;
            delete this.last_distance;
        }
        touchToPoints(e) {
            const points = [];
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                points.push({
                    x: touch.clientX,
                    y: touch.clientY,
                });
            }
            return points;
        }
        panMove(e) {
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
                    parent.factorZoom(change * parent.options.mobile_factor, position);
                }
                /* Update after */
                this.last_distance = total;
            }
            if (parent.modes.panning) {
                parent.translate(position);
            }
        }
    }
    class PanningPlugin extends base_js_1.EnginePlugin {
        constructor(
        // public engine: Engine,
        controls, focus_element) {
            super();
            this.focus_element = focus_element;
            this.modes = {
                panning: false,
                zoom: false,
            };
            this.options = {
                min: undefined,
                max: undefined,
                mobile_factor: 1,
                pc_factor: 1,
            };
            this.pan = {
                start: { x: 0, y: 0 },
                offset: { x: 0, y: 0 },
                change: { x: 0, y: 0 },
                state: false,
                active: false,
            };
            this.events = new lib_1.Emitter();
            if (controls === "all") {
                controls = ["pc", "mobile"];
            }
            const touchStart = (button) => (button == "Middle" || button == "Touch") &&
                (this.pan.active = true);
            const touchEnd = (button) => (button == "Middle" || button == "Touch") && this.interactionEnd();
            if (controls.includes("pc")) {
                this.PC = new PCHandler(this);
                const mouseMove = () => { var _a; return (_a = this.PC) === null || _a === void 0 ? void 0 : _a.panTick(); };
                const bound = this.handleWheel.bind(this);
                const mouseOut = () => this.interactionEnd();
                this.events
                    .on("plugin:add", (engine) => {
                    var _a;
                    const cursor = engine.cursor;
                    const wheel_element = (_a = this.focus_element) !== null && _a !== void 0 ? _a : engine.dom.element;
                    wheel_element.addEventListener("wheel", bound);
                    cursor.element.addEventListener("mousemove", mouseMove);
                    cursor.element.addEventListener("mouseout", mouseOut);
                    cursor.events.on("button-down", touchStart);
                    cursor.events.on("button-up", touchEnd);
                })
                    .on("plugin:remove", (engine) => {
                    var _a;
                    const cursor = engine.cursor;
                    const wheel_element = (_a = this.focus_element) !== null && _a !== void 0 ? _a : engine.dom.element;
                    wheel_element.removeEventListener("wheel", bound);
                    cursor.element.removeEventListener("mousemove", mouseMove);
                    cursor.element.removeEventListener("mouseout", mouseOut);
                    cursor.events.off("button-down", touchStart);
                    cursor.events.off("button-up", touchEnd);
                });
            }
            if (controls.includes("mobile")) {
                this.Mobile = new MobileHandler(this);
                const touchMove = (e) => { var _a; return (_a = this.Mobile) === null || _a === void 0 ? void 0 : _a.pan(e); };
                this.events
                    .on("plugin:add", (engine) => {
                    const cursor = engine.cursor;
                    cursor.element.addEventListener("touchmove", touchMove);
                    cursor.element.addEventListener("touchstart", touchStart);
                    cursor.element.addEventListener("touchend", touchEnd);
                })
                    .on("plugin:remove", (engine) => {
                    const cursor = engine.cursor;
                    cursor.element.removeEventListener("touchmove", touchMove);
                    cursor.element.removeEventListener("touchstart", touchStart);
                    cursor.element.removeEventListener("touchend", touchEnd);
                });
            }
        }
        onAdd(engine) {
            if (this.engine != undefined && engine != this.engine) {
                this.events.emit("plugin:remove", this.engine);
            }
            this.engine = engine;
            this.events.emit("plugin:add", engine);
        }
        onRemove(engine) {
            this.events.emit("plugin:remove", engine);
            delete this.engine;
        }
        interactionEnd() {
            var _a;
            if (this.pan.active) {
                (_a = this.Mobile) === null || _a === void 0 ? void 0 : _a.reset();
                this.panReset();
            }
            this.pan.active = false;
        }
        toggleModes(status, modes) {
            for (const mode of modes) {
                this.modes[mode] = status;
            }
            return this;
        }
        panStart(pos) {
            if (this.modes.panning != true || this.pan.state == true) {
                return;
            }
            this.pan.state = true;
            this.pan.start = pos;
        }
        panReset() {
            if (this.engine == undefined || this.modes.panning != true) {
                return;
            }
            const { pan } = this;
            pan.state = false;
            this.engine.camera.x = pan.offset.x += pan.change.x;
            this.engine.camera.y = pan.offset.y += pan.change.y;
            pan.change.x = 0;
            pan.change.y = 0;
        }
        translate(pos) {
            if (this.engine == undefined || this.modes.panning != true) {
                return;
            }
            this.pan.change.x = pos.x - this.pan.start.x;
            this.pan.change.y = pos.y - this.pan.start.y;
            this.engine.camera.x = this.pan.offset.x + this.pan.change.x;
            this.engine.camera.y = this.pan.offset.y + this.pan.change.y;
        }
        setZoom(value, position) {
            var _a;
            if (this.engine == undefined) {
                return;
            }
            const last = this.engine.camera.zoom;
            const zoom = value / last;
            if (this.modes.panning != true) {
                return this.setZoomTrim(value), void 0;
            }
            const offset = (_a = this.engine) === null || _a === void 0 ? void 0 : _a.camera;
            const npos = { x: position.x, y: position.y };
            if (this.options.min != null && value < this.options.min) {
                return this.setZoom(this.options.min, position);
            }
            if (this.options.max && value > this.options.max) {
                return this.setZoom(this.options.max, position);
            }
            const before = engine_js_1.default.worldToScreen(npos, { zoom: 1, offset });
            this.engine.camera.zoom = value;
            const after = engine_js_1.default.worldToScreen(npos, { zoom, offset });
            this.pan.offset.x += before.x - after.x;
            this.pan.offset.y += before.y - after.y;
            this.engine.camera.x += before.x - after.x;
            this.engine.camera.y += before.y - after.y;
        }
        factorZoom(zoom, pos) {
            if (this.engine == undefined) {
                return;
            }
            this.setZoom(this.engine.camera.zoom * zoom, pos);
        }
        handleWheel(event) {
            var _a;
            console.log("grr", (_a = this.engine) === null || _a === void 0 ? void 0 : _a.camera, this.modes);
            if (this.engine == undefined || this.modes.zoom != true) {
                return;
            }
            const zoom = Math.pow((1.1 * this.options.pc_factor), (event.deltaY < 0 ? 1 : -1));
            this.factorZoom(zoom, this.engine.cursor.position);
        }
        setZoomTrim(value) {
            if (this.engine == undefined) {
                return;
            }
            this.engine.camera.zoom = value;
            if (this.options.min) {
                this.engine.camera.zoom = Math.max(this.engine.camera.zoom, this.options.min);
            }
            if (this.options.max) {
                this.engine.camera.zoom = Math.min(this.engine.camera.zoom, this.options.max);
            }
        }
    }
    exports.PanningPlugin = PanningPlugin;
});
