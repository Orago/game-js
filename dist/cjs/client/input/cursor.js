"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const emitter_1 = __importDefault(require("@orago/lib/emitter"));
function isTouchEvent(input) {
    const __TouchEvent = typeof TouchEvent != "undefined" ? TouchEvent : window.TouchEvent;
    if (!__TouchEvent) {
        return false;
    }
    else {
        return typeof input === "object" && input instanceof __TouchEvent;
    }
}
function isTouch(input) {
    const __Touch = typeof Touch != "undefined" ? Touch : window.Touch;
    if (!__Touch) {
        return false;
    }
    else {
        return typeof input === "object" && input instanceof __Touch;
    }
}
const cursorActionDict = {
    0: "Left",
    1: "Middle",
    2: "Right",
    3: "Back",
    4: "Forward",
    10: "Touch",
};
const reverseCursorActionDict = Object.fromEntries(Object.entries(cursorActionDict).map((e) => [e[1], Number(e[0])]));
class Cursor {
    // private static actionDict = cursorActionDict;
    // private static reverseActionDict = reverseCursorActionDict;
    static buttonToAction(value) {
        return cursorActionDict[value];
    }
    // private _mobile_mode?: 0 | 2;
    constructor(element = document.body) {
        this.events = new emitter_1.default();
        // state management
        this.position = { x: 0, y: 0 };
        this.start = { x: 0, y: 0 };
        this.end = { x: 0, y: 0 };
        this.buttons = new Set();
        this.mouse_down = false;
        this.touching = false;
        this.start_time = 0;
        // systems management
        this.alive = false;
        this.bound_events = new Set();
        this.on = {
            click: (e) => e.preventDefault(),
            contextmenu: (e) => e.preventDefault(),
            mousemove: (e) => e instanceof MouseEvent &&
                this.events.emit("move", e.clientX, e.clientY),
            touchmove: (e) => isTouchEvent(e) &&
                this.events.emit("move", e.touches[0].clientX, e.touches[0].clientY),
            mouseup: (e) => this.events.emit("end", e),
            touchend: (e) => (e.preventDefault(),
                isTouchEvent(e) && this.events.emit("end", e.changedTouches[0])),
            mousedown: (e) => this.events.emit("start", e),
            touchstart: (e) => isTouchEvent(e) && this.events.emit("start", e.touches[0]),
        };
        this.element = element;
        this.reset();
    }
    reconnect(element) {
        this.element = element;
        this.reset();
    }
    hasButton(which) {
        return this.buttons.has(reverseCursorActionDict[which]);
    }
    init() {
        if (this.alive !== false) {
            return this;
        }
        this.alive = true;
        this.reset();
        return this;
    }
    reset() {
        this.dispose();
        for (const [method, func] of Object.entries(this.on)) {
            const fn = func.bind(this);
            this.bound_events.add([this.element, method, fn]);
            this.element.addEventListener(method, fn);
        }
        this.events
            .on("move", (x, y) => this.setPosition(x, y))
            .on("start", (e) => this.onStart(e))
            .on("end", (e) => this.onEnd(e));
        return this;
    }
    dispose() {
        this.events.all.clear();
        this.alive = false;
        for (const bound_event of this.bound_events) {
            const [element, method, fn] = bound_event;
            element.removeEventListener(method, fn);
            this.bound_events.delete(bound_event);
        }
    }
    setPosition(x, y) {
        this.position = this.getPosition(x, y);
    }
    getPosition(x, y) {
        const b = this.element.getBoundingClientRect();
        return {
            x: Math.floor(((x - b.left) / (b.right - b.left)) * b.width),
            y: Math.floor(((y - b.top) / (b.bottom - b.top)) * b.height),
        };
    }
    onStart(event) {
        this.start_time = performance.now();
        const is_touch = isTouch(event);
        const button = is_touch
            ? "Touch"
            : Cursor.buttonToAction(event.button);
        this.events.emit("button-down", button, event, this);
        this.events.emit("button-change", button, true, event);
        if (is_touch) {
            this.buttons.add(10);
        }
        else {
            this.buttons.add(event.button);
        }
        this.position = this.getPosition(event.clientX, event.clientY);
        this.start = this.getPosition(event.clientX, event.clientY);
        this.mouse_down = true;
        this.events.emit("touch", event, this);
    }
    onEnd(event) {
        const is_touch = isTouch(event);
        const button = is_touch
            ? "Touch"
            : Cursor.buttonToAction(event.button);
        this.events.emit("button-up", button, event, this);
        this.events.emit("button-change", button, false, event);
        if (is_touch) {
            this.buttons.delete(10);
        }
        else {
            this.buttons.delete(event.button);
        }
        this.end = this.getPosition(event.clientX, event.clientY);
        this.mouse_down = false;
        this.events.emit("release", event, this);
    }
}
exports.default = Cursor;
