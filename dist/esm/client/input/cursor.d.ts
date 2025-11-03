import type { Point } from "@orago/lib/vector";
import Emitter from "@orago/lib/emitter";
import { MouseButton } from "./symbols";
type CursorInput = Touch | MouseEvent;
type CursorCalled = (event: Touch | MouseEvent, cursor: Cursor) => void;
export type CursorEvents = {
    "button-down": (which: MouseButton, event: Touch | MouseEvent, cursor: Cursor) => void;
    "button-up": (which: MouseButton, event: Touch | MouseEvent, cursor: Cursor) => void;
    move: (x: number, y: number) => void;
    start: (event: Touch | MouseEvent) => void;
    end: (event: Touch | MouseEvent) => void;
    touch: CursorCalled;
    release: CursorCalled;
};
type CursorButtonInt = 0 | 1 | 2 | 3 | 4 | 10;
export default class Cursor {
    private static buttonToAction;
    object: HTMLElement;
    events: Emitter<CursorEvents, true>;
    position: Point;
    start: Point;
    end: Point;
    buttons: Set<CursorButtonInt>;
    mouse_down: boolean;
    touching: boolean;
    start_time: number;
    private bound_events;
    constructor(object?: HTMLElement);
    reconnect(object: HTMLElement): void;
    hasButton(which: MouseButton): boolean;
    init(): void;
    dispose(): void;
    setPosition(x: number, y: number): void;
    getPosition(x: number, y: number): Point;
    onStart(event: CursorInput): void;
    onEnd(event: CursorInput): void;
    on: Record<string, (evt: Event) => any>;
}
export {};
