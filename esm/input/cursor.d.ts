import Emitter from '@orago/lib/emitter';
import { Vector2 } from '@orago/vector';
type cursorInput = Touch | MouseEvent;
export default class cursor {
    events: Emitter;
    object: HTMLElement;
    pos: Vector2;
    down: boolean;
    button: number;
    context: {};
    release: {};
    click: {};
    start: {
        x: number;
        y: number;
    };
    end: {
        x: number;
        y: number;
    };
    startTime: number;
    constructor(object?: HTMLElement);
    reInit(): void;
    getPos(x: number, y: number): Vector2;
    onStart(e: cursorInput): void;
    onEnd(e: cursorInput): void;
    on: {
        [key: string]: (evt: Event) => any;
    };
}
export {};
