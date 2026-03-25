import { Component, System } from "@orago/ecs";
import { random } from "@orago/lib/math";
import { PositionComponent } from "../../ecs/physics.js";
import { WGL } from "../index.js";
import { ImagePacker } from "../util/image-packer.js";
class ParticleCache {
    constructor() {
        this.sprites = new Set();
        this.indexed_sprites = new Map();
        this.id_matches = new Map();
    }
}
export class ParticleComponent extends Component {
    constructor(image, source = [
        0,
        0,
        image.width,
        image.height,
    ]) {
        super();
        this.image = image;
        this.source = source;
    }
}
// class ParticleEntity extends Entity {
// 	particle = new ParticleComponent();
// 	constructor (){
// 	}
// }
export class WGLParticleSystem extends System {
    constructor(engine) {
        super();
        this.engine = engine;
        this.wgl = new WGL.WglProgram();
        this.cache = new ParticleCache();
        this.components = new Set([
            PositionComponent,
            ParticleComponent,
        ]);
    }
    update(entities) {
        const instances = this.wgl.instances;
        let tracked_particles = [];
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
                let source = [0, 0, 1, 1];
                const tmp = this.cache.indexed_sprites.get(c_particle.image);
                if (this.atlas && tmp) {
                    source = this.atlas.getSlice(tmp.x, tmp.y, tmp.width, tmp.height);
                }
                instances.updateSelection(instances.getIndex(c_particle.particle_id), {
                    source,
                    destination: [
                        position.x,
                        position.y,
                        random(1, 50),
                        random(1, 100),
                    ],
                });
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
    addParticle(image) {
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
