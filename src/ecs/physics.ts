import { Component, Entity, System } from "@orago/ecs";
import { Signal, Point } from "@orago/lib";

export class PositionComponent extends Component {
	constructor(public x: number, public y: number) {
		super();
		this.x = x;
		this.y = y;
	}

	set(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	from(options: { x?: number; y?: number }) {
		if (options.x != undefined) {
			this.x = options.x;
		}
		if (options.y != undefined) {
			this.y = options.y;
		}
	}
}

export class VelocityComponent extends Component {
	public x: number;
	public y: number;

	public drag: {
		x: number;
		y: number;
	} = {
		x: 0,
		y: 0,
	};

	public gravity: {
		x: number;
		y: number;
	} = {
		x: 0,
		y: 0,
	};

	constructor(velocity?: { x?: number; y?: number }) {
		super();
		this.x = velocity?.x ?? 0;
		this.y = velocity?.y ?? 0;
	}
}

export class BoxComponent extends Component {
	constructor(public width: number, public height: number) {
		super();
	}
}

export class PhysicsSystem extends System {
	components = new Set<Function>([PositionComponent, VelocityComponent]);
	priority: number = 100;

	gravity: Point = {
		x: 0,
		y: 0,
	};

	constructor() {
		super();
	}

	tickEntity(entity: Entity) {
		const position = entity.components.get(PositionComponent);
		const velocity = entity.components.get(VelocityComponent);

		velocity.x += velocity.gravity.x + this.gravity.x;
		velocity.y += velocity.gravity.y + this.gravity.y;

		position.x += velocity.x;
		position.y += velocity.y;

		velocity.x *= velocity.drag.x;
		velocity.y *= velocity.drag.y;
	}

	update(entities: Set<Entity>): void {
		for (const entity of entities) {
			this.tickEntity(entity);
		}
	}
}

interface PositionedBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

export class HitboxComponent extends Component {
	public active: boolean;
	public tags?: string[];
	public damage?: number;
	public knockback?: { x: number; y: number };

	constructor(
		public boxes: PositionedBox[],
		options?: {
			active?: boolean;
			tags?: string[];
			damage?: number;
			knockback?: { x: number; y: number };
		}
	) {
		super();
		this.active = options?.active != false;

		if (options?.knockback != undefined) {
			this.knockback = options.knockback;
		}

		if (options?.tags != undefined) {
			this.tags = options.tags;
		}

		if (options?.damage != undefined) {
			this.damage = options.damage;
		}
	}
}

export class HurtboxComponent extends Component {
	public active: boolean;
	public tags?: string[];
	public invincible?: boolean;

	constructor(
		public boxes: PositionedBox[],
		options?: {
			invincible?: boolean;
			active?: boolean;
			tags?: string[];
		}
	) {
		super();
		this.active = options?.active != false;

		if (options?.tags != undefined) {
			this.tags = options.tags;
		}

		if (options?.invincible != undefined) {
			this.invincible = options.invincible;
		}
	}
}

export class HitDetectionSystem extends System {
	components: Set<Function> = new Set([PositionComponent]);
	hit: Signal<(a: Entity, B: Entity, hit: HitboxComponent) => void> =
		new Signal();

	update(entities: Set<Entity>) {
		const hitboxes = [];
		const hurtboxes = [];

		for (const entity of entities) {
			const pos = entity.components.get(PositionComponent);
			const hit = entity.components.get(HitboxComponent);
			const hurt = entity.components.get(HurtboxComponent);

			if (hit) hitboxes.push({ entity, hit, pos });
			if (hurt) hurtboxes.push({ entity, hurt, pos });
		}

		for (const { entity: a, hit, pos: posA } of hitboxes) {
			for (const { entity: b, hurt, pos: posB } of hurtboxes) {
				if (a === b || hurt.invincible || !hit.active) continue;

				for (const hb of hit.boxes) {
					const hitbox: PositionedBox = {
						x: posA.x + hb.x,
						y: posA.y + hb.y,
						width: hb.width,
						height: hb.height,
					};

					for (const hb2 of hurt.boxes) {
						const hurtbox: PositionedBox = {
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

	validCollision(
		hurtbox: HurtboxComponent,
		hitbox: HitboxComponent
	): boolean {
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

	overlaps(a: PositionedBox, b: PositionedBox) {
		return (
			a.x < b.x + b.width &&
			a.x + a.width > b.x &&
			a.y < b.y + b.height &&
			a.y + a.height > b.y
		);
	}
}
