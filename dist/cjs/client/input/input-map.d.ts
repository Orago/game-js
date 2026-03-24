import Cursor, { type CursorEvents } from "./cursor.js";
import type Keyboard from "./keyboard.js";
import type { GamepadAction, KeyboardAction, MouseButton } from "./symbols.js";
import type { KeyboardEvents } from "./keyboard.js";
interface InputMapData {
    keyboard?: KeyboardAction[];
    cursor?: MouseButton[];
    gamepad?: GamepadAction[];
    gamepad_deadzone?: number;
    /** Dangerous */
    simulated?: boolean;
}
export declare enum InputSource {
    KEYBOARD = 1,
    CURSOR = 2,
    GAMEPAD = 4
}
interface ActionState {
    sources: number;
    simulated?: boolean;
}
type MappedKeys = Record<string, InputMapData>;
type Evt<K, Strict extends boolean> = Strict extends true ? keyof K | "*" : keyof K | "*" | (string & {});
export declare class InputMap<T extends MappedKeys & {} = {}, Strict extends boolean = false> {
    current_maps: Map<Evt<T, Strict>, InputMapData>;
    current_states: Record<Evt<T, Strict>, ActionState>;
    active: boolean;
    private onceing;
    /**
     * This should only be modified by the engine itself
     */
    check_hook?: Function;
    /**
     *
     * @param input
     * @param parent - unused
     */
    constructor(input?: T);
    hasSource<K extends Evt<T, Strict>>(name: K, source: InputSource): boolean;
    addSource<K extends Evt<T, Strict>>(name: K, source: InputSource): void;
    removeSource<K extends Evt<T, Strict>>(name: K, source: InputSource): void;
    isPressed<K extends Evt<T, Strict>>(name: K): boolean;
    once<K extends Evt<T, Strict>>(name: K): boolean;
}
export declare class InputMapHandler<MP extends InputMap> {
    input_map: MP;
    keyboard?: Keyboard;
    cursor?: Cursor;
    hooks: {
        keyboard?: KeyboardEvents["key-change"];
        cursor?: CursorEvents["button-change"];
        gamepad_poll?: number;
    };
    allowed_gamepads: number[];
    constructor(input_map: MP);
    tick(): void;
    tickKeyboard(keyboard: Keyboard): void;
    setKeyboard(keyboard: Keyboard): this;
    removeKeyboard(): void;
    tickCursor(cursor: Cursor): void;
    setCursor(cursor: Cursor): this;
    removeCursor(): void;
    updateGamepads(): void;
    enableGamepads(poll_interval: number): void;
    removeGamepads(): void;
}
export {};
