import Emitter from '@orago/lib/emitter';
import type { Point } from '@orago/lib/vector';
type cursorInput = Touch | MouseEvent;
export default class Cursor {
    object: HTMLElement;
    events: Emitter;
    pos: Point;
    start: Point;
    end: Point;
    down: boolean;
    button: number;
    startTime: number;
    constructor(object?: HTMLElement);
    reInit(): void;
    setPos(x: number, y: number): void;
    getPos(x: number, y: number): Point;
    onStart(event: cursorInput): void;
    onEnd(event: cursorInput): void;
    on: Record<string, (evt: Event) => any>;
}
export {};
