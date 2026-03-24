import { Engine, WGL } from "../index.js";
import { ImagePacker, TImageBox } from "../util/image-packer.js";
import { Renderable } from "../brush/render.js";
import potpack, { BoxLike } from "../../util/potpack.js";
import { Component, Entity, System } from "@orago/ecs";
import { BoxComponent, PositionComponent } from "../../ecs/physics.js";
import { random } from "@orago/lib/math";

interface IParticleMappings extends Record<string, any> {}

class ParticleCache {
	sprites: Set<Renderable> = new Set();
	indexed_sprites: Map<Renderable, BoxLike> = new Map();
	id_matches: Map<Renderable, number> = new Map();
}

export class ParticleComponent extends Component {
	particle_id?: number;
	constructor(
		public image: Renderable,
		public source: [x: number, y: number, w: number, h: number] = [
			0,
			0,
			image.width,
			image.height,
		]
	) {
		super();
	}
}

// class ParticleEntity extends Entity {
// 	particle = new ParticleComponent();
// 	constructor (){

// 	}
// }

export class WGLParticleSystem extends System {
	public wgl = new WGL.WglProgram();
	cache = new ParticleCache();

	public components: Set<Function> = new Set([
		PositionComponent,
		ParticleComponent,
	]);

	atlas?: WGL.TextureAtlas;

	constructor(public engine: Engine) {
		super();
	}
	update(entities: Set<Entity>): void {
		const instances = this.wgl.instances;
		let tracked_particles: number[] = [];

		for (const entity of entities) {
			const c_particle = entity.components.get(ParticleComponent);
			const position = entity.components.get(PositionComponent);

			if (c_particle.particle_id == undefined) {
				const res = this.addParticle(c_particle.image);

				if (typeof res != "number") {
					continue;
				}
				c_particle.particle_id = res;
			}

			if (c_particle.particle_id != undefined) {
				tracked_particles.push(c_particle.particle_id);

				let source: [number, number, number, number] = [0, 0, 1, 1];
				const tmp = this.cache.indexed_sprites.get(c_particle.image);
				if (this.atlas && tmp) {
					source = this.atlas.getSlice(
						tmp.x,
						tmp.y,
						tmp.width,
						tmp.height
					);
				}
				instances.updateSelection(
					instances.getIndex(c_particle.particle_id),
					{
						source,
						destination: [
							position.x,
							position.y,
							random(1, 50),
							random(1, 100),
						],
					}
				);
			}
		}
		const mapped = Object.keys(this.wgl.instances.new_indexes).map(Number);

		for (const id of mapped) {
			if (tracked_particles.includes(id) != true) {
				this.wgl.instances.deleted.add(id);
			}
		}
		this.wgl.resize(this.engine.brush.width, this.engine.brush.height);
		this.wgl.render();
		this.engine.brush.image(this.wgl.canvas);
	}

	rebuild() {
		this.cache.indexed_sprites.clear();
		const boxes = Array.from(this.cache.sprites).map((e) => ({
			image: e,
			width: e.width,
			height: e.height,
		}));

		const packed = ImagePacker.createPack(boxes, 1);
		this.atlas = new WGL.TextureAtlas(this.wgl.gl, packed.canvas);
		this.wgl.setTexture(this.atlas);

		for (const value of packed.packed.boxes) {
			this.cache.indexed_sprites.set(value.image, {
				x: value.x,
				y: value.y,
				width: value.width,
				height: value.height,
			});
		}
	}

	addParticle(image: Renderable) {
		if (this.cache.indexed_sprites.has(image) != true) {
			this.cache.sprites.add(image);
			this.rebuild();
		}

		const offset = this.cache.indexed_sprites.get(image);

		if (offset == undefined) {
			return;
		}
		return this.wgl.instances.addInstance();
	}
}
