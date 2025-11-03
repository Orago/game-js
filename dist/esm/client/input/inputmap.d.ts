import type Cursor from "./cursor.js";
import type Keyboard from "./keyboard.js";
import type { GamepadAction, KeyboardAction, MouseButton } from "./symbols.js";
interface InputMapData {
    keyboard?: KeyboardAction[];
    cursor?: MouseButton[];
    gamepad?: GamepadAction[];
    gamepad_deadzone?: number;
    /** Dangerous */
    simulated?: boolean;
}
type MappedKeys = Record<string, InputMapData>;
type Evt<K, Strict extends boolean> = Strict extends true ? keyof K | "*" : keyof K | "*" | (string & {});
export declare class InputMap<T extends MappedKeys & {} = {}, Strict extends boolean = false> {
    current_maps: Map<Evt<T, Strict>, InputMapData>;
    keyboard?: Keyboard;
    cursor?: Cursor;
    allowed_gamepads?: number[];
    active: boolean;
    private onceing;
    /**
     *
     * @param input
     * @param parent - unused
     */
    constructor(input?: T, parent?: HTMLElement);
    setKeyboard(keyboard: Keyboard): this;
    setCursor(cursor: Cursor): this;
    isPressed<K extends Evt<T, Strict>>(name: K): boolean;
    once<K extends Evt<T, Strict>>(name: K): boolean;
}
export {};
