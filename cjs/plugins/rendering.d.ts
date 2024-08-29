import type { Entity } from '../ecs/entity.js';
import { Component } from '../ecs/component.js';
import { System } from '../ecs/system.js';
export declare class Renderable extends Component {
    callback: () => void;
    constructor(callback: () => void);
}
export declare class RenderingSystem extends System {
    componentsRequired: Set<Function>;
    dirtyComponents: Set<Function>;
    update(entities: Set<Entity>): void;
}
