import { KeyboardAction } from "./symbols.js";
import Emitter from "@orago/lib/emitter";
import { VNode } from "@orago/dom";
type KeyboardEvents = {
    keydown: (char: KeyboardAction) => void;
    keyup: (char: KeyboardAction) => void;
};
type KeyboardUnionMode = "both" | "split" | "joint";
declare class VNodeEventGroup {
    private node;
    map: Map<string, Function>;
    constructor(node: VNode);
    on(event: string, callback: Function): this;
    off(event: string, callback?: Function): this;
    clear(): this;
}
export default class Keyboard {
    private static formatKeycode;
    object: VNode;
    readonly events: Emitter<KeyboardEvents, true>;
    pressed: Partial<Record<KeyboardAction, boolean>>;
    alive: boolean;
    union: KeyboardUnionMode;
    event_group?: VNodeEventGroup;
    constructor(element?: HTMLElement);
    attatch(node: VNode): void;
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
