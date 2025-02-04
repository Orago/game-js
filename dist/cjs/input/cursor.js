"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const emitter_1 = __importDefault(require("@orago/lib/emitter"));
const holdTime = 500;
function isTouchEvent(input) {
    const __TouchEvent = typeof TouchEvent != "undefined" ? TouchEvent : window.TouchEvent;
    if (!__TouchEvent)
        return false;
    return typeof input === "object" && input instanceof __TouchEvent;
}
function isTouch(input) {
    const __Touch = typeof Touch != "undefined" ? Touch : window.Touch;
    if (!__Touch)
        return false;
    return typeof input === "object" && input instanceof __Touch;
}
const cursorActionDict = {
    0: "Left",
    1: "Middle",
    2: "Right",
    3: "Back",
    4: "Forward",
    10: "Touch",
};
const reverseCursorActionDict = Object.fromEntries(Object.entries(cursorActionDict).map(e => [e[1], Number(e[0])]));
class Cursor {
    static buttonToAction(value) {
        return cursorActionDict[value];
    }
    static actionToButtonID(value) {
        return reverseCursorActionDict[value];
    }
    // private _mobile_mode?: 0 | 2;
    constructor(object = document.body) {
        this.events = new emitter_1.default();
        this.position = { x: 0, y: 0 };
        this.start = { x: 0, y: 0 };
        this.end = { x: 0, y: 0 };
        this.buttons = new Set();
        this.mouse_down = false;
        this.touching = false;
        this.startTime = 0;
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
                isTouchEvent(e) &&
                    this.events.emit("end", e.changedTouches[0])),
            mousedown: (e) => this.events.emit("start", e),
            touchstart: (e) => isTouchEvent(e) &&
                this.events.emit("start", e.touches[0]),
        };
        this.object = object;
        this.init();
    }
    reconnect(object) {
        this.object = object;
        this.init();
    }
    hasButton(which) {
        return this.buttons.has(reverseCursorActionDict[which]);
    }
    init() {
        this.dispose();
        for (const [method, func] of Object.entries(this.on)) {
            const fn = func.bind(this);
            this.bound_events.add([method, fn]);
            this.object.addEventListener(method, fn);
        }
        this
            .events
            .on("move", (x, y) => this.setPosition(x, y))
            .on("start", (e) => this.onStart(e))
            .on("end", (e) => this.onEnd(e));
    }
    dispose() {
        this.events.all.clear();
        for (const bound_event of this.bound_events) {
            this.object.removeEventListener(bound_event[0], bound_event[1]);
            this.bound_events.delete(bound_event);
        }
    }
    setPosition(x, y) {
        this.position = this.getPosition(x, y);
    }
    getPosition(x, y) {
        const { object } = this;
        const b = object.getBoundingClientRect();
        return {
            x: Math.floor(((x - b.left) / (b.right - b.left)) * b.width),
            y: Math.floor(((y - b.top) / (b.bottom - b.top)) * b.height)
        };
    }
    onStart(event) {
        this.startTime = performance.now();
        if (isTouch(event)) {
            this.events.emit("button-down", "Touch", event, this);
            this.buttons.add(10);
            // setTimeout(() => {
            // 	if (this.down == true && this._mobile_mode == 0) {
            // 		this.events.emit("context", event, this);
            // 		this.events.emit("button-down", "Right", event, this);
            // 		this.buttons.add(this._mobile_mode = 2);
            // 	}
            // 	else {
            // 		this.events.emit("click", event, this);
            // 		this.events.emit("button-down", "Left", event, this);
            // 		this.buttons.add(this._mobile_mode = 0);
            // 	}
            // }, holdTime);
        }
        else {
            this.events.emit("button-down", Cursor.buttonToAction(event.button), event, this);
            this.buttons.add(event.button);
            // switch (event.button) {
            // 	case 0: this.events.emit("click", event, this); break;
            // 	case 1: this.events.emit("middle", event, this); break;
            // 	case 2: this.events.emit("context", event, this); break;
            // }
        }
        this.position = this.getPosition(event.clientX, event.clientY);
        this.start = this.getPosition(event.clientX, event.clientY);
        this.mouse_down = true;
        this.events.emit("touch", event, this);
    }
    onEnd(event) {
        if (isTouch(event)) {
            this.events.emit("button-up", "Touch", event, this);
            this.buttons.delete(10);
            // if (this._mobile_mode != undefined)
            // 	this.buttons.delete(this._mobile_mode);
            // delete this._mobile_mode;
            // 	case 0: this.events.emit("click-release", event, this); break;
            // 	case 1: this.events.emit("middle-release", event, this); break;
            // 	case 2: this.events.emit("context-release", event, this); break;
            // }
        }
        else {
            this.events.emit("button-up", Cursor.buttonToAction(event.button), event, this);
            this.buttons.delete(event.button);
        }
        this.end = this.getPosition(event.clientX, event.clientY);
        this.mouse_down = false;
        this.events.emit("release", event, this);
    }
}
Cursor.actionDict = cursorActionDict;
Cursor.reverseActionDict = reverseCursorActionDict;
exports.default = Cursor;
