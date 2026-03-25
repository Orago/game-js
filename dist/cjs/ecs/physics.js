"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HitDetectionSystem = exports.HurtboxComponent = exports.HitboxComponent = exports.PhysicsSystem = exports.BoxComponent = exports.VelocityComponent = exports.PositionComponent = void 0;
const ecs_1 = require("@orago/ecs");
const lib_1 = require("@orago/lib");
class PositionComponent extends ecs_1.Component {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.x = x;
        this.y = y;
    }
    set(x, y) {
        this.x = x;
        this.y = y;
    }
    from(options) {
        if (options.x != undefined) {
            this.x = options.x;
        }
        if (options.y != undefined) {
            this.y = options.y;
        }
    }
}
exports.PositionComponent = PositionComponent;
class VelocityComponent extends ecs_1.Component {
    constructor(velocity) {
        var _a, _b;
        super();
        this.drag = {
            x: 0,
            y: 0,
        };
        this.gravity = {
            x: 0,
            y: 0,
        };
        this.x = (_a = velocity === null || velocity === void 0 ? void 0 : velocity.x) !== null && _a !== void 0 ? _a : 0;
        this.y = (_b = velocity === null || velocity === void 0 ? void 0 : velocity.y) !== null && _b !== void 0 ? _b : 0;
    }
}
exports.VelocityComponent = VelocityComponent;
class BoxComponent extends ecs_1.Component {
    constructor(width, height) {
        super();
        this.width = width;
        this.height = height;
    }
}
exports.BoxComponent = BoxComponent;
class PhysicsSystem extends ecs_1.System {
    constructor() {
        super();
        this.components = new Set([PositionComponent, VelocityComponent]);
        this.priority = 100;
        this.gravity = {
            x: 0,
            y: 0,
        };
    }
    tickEntity(entity) {
        const position = entity.components.get(PositionComponent);
        const velocity = entity.components.get(VelocityComponent);
        velocity.x += velocity.gravity.x + this.gravity.x;
        velocity.y += velocity.gravity.y + this.gravity.y;
        position.x += velocity.x;
        position.y += velocity.y;
        velocity.x *= velocity.drag.x;
        velocity.y *= velocity.drag.y;
    }
    update(entities) {
        for (const entity of entities) {
            this.tickEntity(entity);
        }
    }
}
exports.PhysicsSystem = PhysicsSystem;
class HitboxComponent extends ecs_1.Component {
    constructor(boxes, options) {
        super();
        this.boxes = boxes;
        this.active = (options === null || options === void 0 ? void 0 : options.active) != false;
        if ((options === null || options === void 0 ? void 0 : options.knockback) != undefined) {
            this.knockback = options.knockback;
        }
        if ((options === null || options === void 0 ? void 0 : options.tags) != undefined) {
            this.tags = options.tags;
        }
        if ((options === null || options === void 0 ? void 0 : options.damage) != undefined) {
            this.damage = options.damage;
        }
    }
}
exports.HitboxComponent = HitboxComponent;
class HurtboxComponent extends ecs_1.Component {
    constructor(boxes, options) {
        super();
        this.boxes = boxes;
        this.active = (options === null || options === void 0 ? void 0 : options.active) != false;
        if ((options === null || options === void 0 ? void 0 : options.tags) != undefined) {
            this.tags = options.tags;
        }
        if ((options === null || options === void 0 ? void 0 : options.invincible) != undefined) {
            this.invincible = options.invincible;
        }
    }
}
exports.HurtboxComponent = HurtboxComponent;
class HitDetectionSystem extends ecs_1.System {
    constructor() {
        super(...arguments);
        this.components = new Set([PositionComponent]);
        this.hit = new lib_1.Signal();
    }
    update(entities) {
        const hitboxes = [];
        const hurtboxes = [];
        for (const entity of entities) {
            const pos = entity.components.get(PositionComponent);
            const hit = entity.components.get(HitboxComponent);
            const hurt = entity.components.get(HurtboxComponent);
            if (hit)
                hitboxes.push({ entity, hit, pos });
            if (hurt)
                hurtboxes.push({ entity, hurt, pos });
        }
        for (const { entity: a, hit, pos: posA } of hitboxes) {
            for (const { entity: b, hurt, pos: posB } of hurtboxes) {
                if (a === b || hurt.invincible || !hit.active)
                    continue;
                for (const hb of hit.boxes) {
                    const hitbox = {
                        x: posA.x + hb.x,
                        y: posA.y + hb.y,
                        width: hb.width,
                        height: hb.height,
                    };
                    for (const hb2 of hurt.boxes) {
                        const hurtbox = {
                            x: posB.x + hb2.x,
                            y: posB.y + hb2.y,
                            width: hb2.width,
                            height: hb2.height,
                        };
                        if (this.overlaps(hitbox, hurtbox)) {
                            // Handle damage, effects, callbacks, etc.
                            this.hit.emit(a, b, hit);
                        }
                    }
                }
            }
        }
    }
    validCollision(hurtbox, hitbox) {
        if (!hitbox.active || hurtbox.invincible || hurtbox.active === false) {
            return false;
        }
        const hit_tags = hitbox.tags;
        const hurt_tags = hurtbox.tags;
        if (hurt_tags != undefined && hit_tags == undefined) {
            return false;
        }
        if (!hit_tags && !hurt_tags) {
            return true;
        }
        if (!hit_tags || !hurt_tags) {
            return true;
        }
        return hit_tags.some((tag) => hurt_tags.includes(tag));
    }
    overlaps(a, b) {
        return (a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y);
    }
}
exports.HitDetectionSystem = HitDetectionSystem;
