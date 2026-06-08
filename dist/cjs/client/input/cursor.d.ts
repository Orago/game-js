import type { Point } from "@orago/lib";
import { Emitter } from "@orago/lib";
import type { MouseButton } from "./symbols.js";
type CursorInput = Touch | MouseEvent;
type CursorCalled = () => void;
export interface CursorButtonPressContext {
    which: MouseButton;
    preventDefault: () => void;
}
export interface CursorButtonChangeContext {
    which: MouseButton;
    state: boolean;
    preventDefault: () => void;
}
export type CursorEvents = {
    "button-down": (c: CursorButtonPressContext) => void;
    "button-up": (c: CursorButtonPressContext) => void;
    "button-change": (c: CursorButtonChangeContext) => void;
    move: (x: number, y: number) => void;
    start: (event: Touch | MouseEvent) => void;
    end: (event: Touch | MouseEvent) => void;
    touch: CursorCalled;
    release: CursorCalled;
};
export declare enum CursorButton {
    LEFT = 0,
    MIDDLE = 1,
    RIGHT = 2,
    BACK = 3,
    FORWARD = 4,
    TOUCH = 10
}
export default class Cursor {
    static Button: typeof CursorButton;
    static buttonToAction(value: CursorButton): MouseButton;
    static getButtonID(event: CursorInput): CursorButton;
    element: HTMLElement;
    events: Emitter<CursorEvents, true>;
    position: Point;
    start_position: Point;
    end_position: Point;
    buttons: Set<CursorButton>;
    mouse_down: boolean;
    touching: boolean;
    start_time: number;
    alive: boolean;
    private bound_events;
    constructor(element?: HTMLElement);
    reconnect(element: HTMLElement): void;
    hasButton(which: MouseButton): boolean;
    init(): this;
    toggleButton(button_int: CursorButton, down: boolean, event: CursorInput): void;
    reset(): this;
    dispose(): void;
    setPosition(x: number, y: number): void;
    getPosition(x: number, y: number): Point;
    onStart(event: CursorInput): void;
    onEnd(event: CursorInput): void;
    on: Record<string, (evt: Event) => any>;
}
export {};
