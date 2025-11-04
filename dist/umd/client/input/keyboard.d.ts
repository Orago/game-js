import Emitter from "@orago/lib/emitter";
import { KeyboardAction } from "./symbols.js";
export type KeyboardEvents = {
    "key-change": (key: KeyboardAction, state: boolean) => void;
    keydown: (char: KeyboardAction) => void;
    keyup: (char: KeyboardAction) => void;
};
type KeyboardUnionMode = "both" | "split" | "joint";
export default class Keyboard {
    static formatKeycode(value: string): KeyboardAction;
    element: HTMLElement;
    readonly events: Emitter<KeyboardEvents, true>;
    pressed: Partial<Record<KeyboardAction, boolean>>;
    union: KeyboardUnionMode;
    alive: boolean;
    private bound_events;
    constructor(element?: HTMLElement);
    private changeKeyState;
    init(): this;
    reset(): void;
    dispose(): void;
    /**
     * @deprecated
     */
    get stop(): () => void;
    simulateKeyDown(keycode: KeyboardAction): void;
    simulateKeyUp(keycode: KeyboardAction): void;
    anyPressed(...args: KeyboardAction[]): boolean;
    isPressed: (key: KeyboardAction) => boolean;
    intPressed: (key: KeyboardAction) => 0 | 1;
    mapInt(...keys: KeyboardAction[]): Record<string, number>;
    applyKeys(keys: Partial<Record<KeyboardAction, boolean>>): void;
    on: Record<string, (evt: Event) => any>;
}
export {};
