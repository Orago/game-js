import { type Entity, Component, System } from '@orago/ecs';
export declare class Renderable extends Component {
    callback: () => void;
    constructor(callback: () => void);
}
export declare class RenderingSystem extends System {
    componentsRequired: Set<Function>;
    dirtyComponents: Set<Function>;
    update(entities: Set<Entity>): void;
}
