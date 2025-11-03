import { GamepadAction } from "./symbols";
type Gamepad = GamepadEvent["gamepad"];
export declare class Gamepads {
    static mappedButtons: Record<GamepadAction, number>;
    static allowed(): boolean;
    static getAll(): (Gamepad | null)[];
    static getActive(): Gamepad[];
    static TestAction(gamepads: Gamepad[], action: GamepadAction, minimum?: number): boolean;
    static TestButton(gamepads: Gamepad[], index: number, minimum?: number): boolean;
}
export {};
