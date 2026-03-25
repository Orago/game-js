"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CursorButton = void 0;
const lib_1 = require("@orago/lib");
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
var CursorButton;
(function (CursorButton) {
    CursorButton[CursorButton["LEFT"] = 0] = "LEFT";
    CursorButton[CursorButton["MIDDLE"] = 1] = "MIDDLE";
    CursorButton[CursorButton["RIGHT"] = 2] = "RIGHT";
    CursorButton[CursorButton["BACK"] = 3] = "BACK";
    CursorButton[CursorButton["FORWARD"] = 4] = "FORWARD";
    CursorButton[CursorButton["TOUCH"] = 10] = "TOUCH";
})(CursorButton || (exports.CursorButton = CursorButton = {}));
const cursorActionDict = {
    [CursorButton.LEFT]: "Left",
    [CursorButton.MIDDLE]: "Middle",
    [CursorButton.RIGHT]: "Right",
    [CursorButton.BACK]: "Back",
    [CursorButton.FORWARD]: "Forward",
    [CursorButton.TOUCH]: "Touch",
};
const reverseCursorActionDict = Object.fromEntries(Object.entries(cursorActionDict).map((e) => [e[1], Number(e[0])]));
class Cursor {
    static Button = CursorButton;
    // private static actionDict = cursorActionDict;
    // private static reverseActionDict = reverseCursorActionDict;
    static buttonToAction(value) {
        return cursorActionDict[value];
    }
    static getButtonID(event) {
        return isTouch(event)
            ? CursorButton.TOUCH
            : event.button;
    }
    // private static actionToButtonID(value: MouseButton) {
    // 	return reverseCursorActionDict[value];
    // }
    element;
    events = new lib_1.Emitter();
    // state management
    position = { x: 0, y: 0 };
    start_position = { x: 0, y: 0 };
    end_position = { x: 0, y: 0 };
    buttons = new Set();
    mouse_down = false;
    touching = false;
    start_time = 0;
    // systems management
    alive = false;
    bound_events = new Set();
    // private _mobile_mode?: 0 | 2;
    constructor(element = document.body) {
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
    toggleButton(button_int, down) {
        const button = Cursor.buttonToAction(button_int);
        if (down == true) {
            this.buttons.add(button_int);
            this.events.emit("button-down", button);
        }
        else {
            this.buttons.delete(button_int);
            this.events.emit("button-up", button);
        }
        this.events.emit("button-change", button, true);
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
        const button_id = Cursor.getButtonID(event);
        this.start_time = performance.now();
        this.position = this.getPosition(event.clientX, event.clientY);
        this.start_position = this.getPosition(event.clientX, event.clientY);
        this.mouse_down = true;
        this.toggleButton(button_id, true);
        this.events.emit("touch");
    }
    onEnd(event) {
        const button_id = Cursor.getButtonID(event);
        this.end_position = this.getPosition(event.clientX, event.clientY);
        this.mouse_down = false;
        this.toggleButton(button_id, false);
        this.events.emit("release");
    }
    on = {
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
}
exports.default = Cursor;
//# sourceMappingURL=cursor.js.map