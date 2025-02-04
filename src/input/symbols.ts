export type AlphabeticChar = | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z";

type AlphabeticKeyChar = `Key${Uppercase<AlphabeticChar>}`;

type Numbers = | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type NumericKeyDigit = `Digit${Numbers}`;

export type ArrowKey =
	| "ArrowUp"
	| "ArrowDown"
	| "ArrowLeft"
	| "ArrowRight"
	;

export type SidedAction =
	| "ShiftLeft"
	| "ShiftRight"
	| "BracketLeft"
	| "BracketRight"
	| "ControlLeft"
	| "ControlRight"
	| "AltLeft"
	| "AltRight"
	;

export type SideActionJoint =
	| "Shift"
	| "Bracket"
	| "Control"
	| "Alt"

export type KeyboardAction =
	| AlphabeticKeyChar
	| NumericKeyDigit
	| ArrowKey
	| SidedAction
	| SideActionJoint
	| "Space"
	| "Backspace"
	| "Tab"
	| "Enter"
	| "Backquote"
	| "Minus"
	| "Equal"
	| "Slash"
	| "Backslash"
	| "Quote"
	| "Semicolon"
	| "Comma"
	| "Period"
	| "Slash"
	| "Meta"
	| "Delete"
	| "Insert"
	| "Escape"
	| "CapsLock"
	;

export type MouseButton =
	| "Left"
	| "Right"
	| "Touch"
	| "Middle"
	| "Forward"
	| "Back"
	;


export type GamepadAction =
	| "Left-Axis-X"
	| "Left-Axis-Y"
	| "Right-Axis-X"
	| "Right-Axis-Y"


	| "Left-Axis-Up"
	| "Left-Axis-Down"
	| "Left-Axis-Left"
	| "Left-Axis-Right"

	| "Right-Axis-Up"
	| "Right-Axis-Down"
	| "Right-Axis-Left"
	| "Right-Axis-Right"

	| "Button-1"
	| "Button-2"
	| "Button-3"
	| "Button-4"
	| "Pad-Up"
	| "Pad-Down"
	| "Pad-Left"
	| "Pad-Right"
	| "Left-Trigger"
	| "Right-Trigger"
	| "Left-Shoulder"
	| "Right-Shoulder"
	| "Left-Stick"
	| "Right-Stick"
	| "Menu"
	| "View"
	| "Home"
	;