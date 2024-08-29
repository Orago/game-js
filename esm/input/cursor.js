import Emitter from '@orago/lib/emitter';
const holdTime = 500;
function isTouchEvent(input) {
    const __TouchEvent = typeof TouchEvent != 'undefined' ? TouchEvent : window.TouchEvent;
    return typeof input === 'object' && input instanceof __TouchEvent;
}
function isTouch(input) {
    const __Touch = typeof Touch != 'undefined' ? Touch : window.Touch;
    return typeof input === 'object' && input instanceof __Touch;
}
export default class Cursor {
    constructor(object = document.body) {
        this.events = new Emitter();
        this.pos = { x: 0, y: 0 };
        this.start = { x: 0, y: 0 };
        this.end = { x: 0, y: 0 };
        this.down = false;
        this.button = -1;
        this.startTime = 0;
        this.on = {
            click: (e) => e.preventDefault(),
            contextmenu: (e) => e.preventDefault(),
            mousemove: (e) => e instanceof MouseEvent &&
                this.events.emit('move', e.clientX, e.clientY),
            touchmove: (e) => isTouchEvent(e) &&
                this.events.emit('move', e.touches[0].clientX, e.touches[0].clientY),
            mouseup: (e) => this.events.emit('end', e),
            touchend: (e) => isTouchEvent(e) &&
                this.events.emit('end', e.changedTouches[0]),
            mousedown: (e) => this.events.emit('start', e),
            touchstart: (e) => isTouchEvent(e) &&
                this.events.emit('start', e.touches[0]),
        };
        this.object = object;
        for (const [method, func] of Object.entries(this.on))
            object.addEventListener(method, func.bind(this));
        this.reInit();
    }
    reInit() {
        this.events.all.clear();
        this
            .events
            .on('move', (x, y) => this.setPos(x, y))
            .on('start', (e) => this.onStart(e))
            .on('end', (e) => this.onEnd(e));
    }
    setPos(x, y) {
        this.pos = this.getPos(x, y);
    }
    getPos(x, y) {
        const { object } = this;
        const b = object.getBoundingClientRect();
        return {
            x: Math.floor(((x - b.left) / (b.right - b.left)) * b.width),
            y: Math.floor(((y - b.top) / (b.bottom - b.top)) * b.height)
        };
    }
    onStart(event) {
        this.startTime = performance.now();
        setTimeout(() => {
            if (isTouch(event)) {
                if (this.down == true)
                    this.events.emit('context');
                else
                    this.events.emit('click', event, this);
            }
        }, holdTime);
        if (isTouch(event) != true) {
            switch (event.button) {
                case 0:
                    this.events.emit('click', event, this);
                    break;
                case 1:
                    this.events.emit('middle', event, this);
                    break;
                case 2:
                    this.events.emit('context', event, this);
                    break;
            }
            this.button = event.button;
        }
        this.pos = this.getPos(event.clientX, event.clientY);
        this.start = this.getPos(event.clientX, event.clientY);
        this.down = true;
        this.events.emit('touch', event, this);
    }
    onEnd(event) {
        if (isTouch(event) != true) {
            switch (event.button) {
                case 0:
                    this.events.emit('click-release', event, this);
                    break;
                case 1:
                    this.events.emit('middle-release', event, this);
                    break;
                case 2:
                    this.events.emit('context-release', event, this);
                    break;
            }
        }
        this.end = this.getPos(event.clientX, event.clientY);
        this.down = false;
        this.events.emit('release', event, this);
    }
}
