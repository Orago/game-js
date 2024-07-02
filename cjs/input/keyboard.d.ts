import Emitter from '@orago/lib/emitter';
import { ProxyNode } from '@orago/dom';
export default class Keyboard {
    object: ProxyNode;
    alive: boolean;
    pressed: {
        [key: string]: boolean;
    };
    events: Emitter;
    constructor(element?: HTMLElement);
    init(): void;
    get stop(): () => void;
    dispose(): void;
    simulateKeyDown(keyIn: string): void;
    simulateKeyUp(key: string): void;
    anyPressed(...args: string[]): boolean;
    isPressed: (key: string) => boolean;
    intPressed: (key: string) => 0 | 1;
    mapInt(...keys: string[]): {
        [key: string]: number;
    };
    applyKeys(keys: {
        [key: string]: boolean;
    }): void;
}
