import { Component, Entity, System } from "@orago/ecs";
import { Signal } from "@orago/lib";
export declare class PositionComponent extends Component {
    x: number;
    y: number;
    constructor(x: number, y: number);
}
export declare class VelocityComponent extends Component {
    x: number;
    y: number;
    drag: number;
    gravity: {
        x: number;
        y: number;
    };
    constructor(velocity?: {
        x?: number;
        y?: number;
    });
}
export declare class BoxComponent extends Component {
    width: number;
    height: number;
    constructor(width: number, height: number);
}
export declare class PhysicsSystem extends System {
    components: Set<Function>;
    priority: number;
    constructor();
    tickEntity(entity: Entity): void;
    update(entities: Set<Entity>): void;
}
interface PositionedBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export declare class HitboxComponent extends Component {
    boxes: PositionedBox[];
    active: boolean;
    tags?: string[];
    damage?: number;
    knockback?: {
        x: number;
        y: number;
    };
    constructor(boxes: PositionedBox[], options?: {
        active?: boolean;
        tags?: string[];
        damage?: number;
        knockback?: {
            x: number;
            y: number;
        };
    });
}
export declare class HurtboxComponent extends Component {
    boxes: PositionedBox[];
    active: boolean;
    tags?: string[];
    invincible?: boolean;
    constructor(boxes: PositionedBox[], options?: {
        invincible?: boolean;
        active?: boolean;
        tags?: string[];
    });
}
export declare class HitDetectionSystem extends System {
    components: Set<Function>;
    hit: Signal<(a: Entity, B: Entity, hit: HitboxComponent) => void>;
    update(entities: Set<Entity>): void;
    validCollision(hurtbox: HurtboxComponent, hitbox: HitboxComponent): boolean;
    overlaps(a: PositionedBox, b: PositionedBox): boolean;
}
export {};
