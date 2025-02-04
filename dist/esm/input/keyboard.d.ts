import { KeyboardAction } from "./symbols.js";
import Emitter from "@orago/lib/emitter";
import { ProxyNode } from "@orago/dom";
type KeyboardEvents = {
    keydown: (char: KeyboardAction) => void;
    keyup: (char: KeyboardAction) => void;
};
type KeyboardUnionMode = "both" | "split" | "joint";
export default class Keyboard {
    private static formatKeycode;
    object: ProxyNode;
    readonly events: Emitter<KeyboardEvents, true>;
    pressed: Partial<Record<KeyboardAction, boolean>>;
    alive: boolean;
    union: KeyboardUnionMode;
    constructor(element?: Element);
    attatch(proxyNode: ProxyNode): void;
    init(): void;
    get stop(): () => void;
    dispose(): void;
    simulateKeyDown(keycode: KeyboardAction): void;
    simulateKeyUp(keycode: KeyboardAction): void;
    anyPressed(...args: KeyboardAction[]): boolean;
    isPressed: (key: KeyboardAction) => boolean;
    intPressed: (key: KeyboardAction) => 0 | 1;
    mapInt(...keys: KeyboardAction[]): Record<string, number>;
    applyKeys(keys: Partial<Record<KeyboardAction, boolean>>): void;
}
export {};
