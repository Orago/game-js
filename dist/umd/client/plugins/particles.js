(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@orago/ecs", "@orago/lib/math", "../../ecs/physics.js", "../index.js", "../util/image-packer.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WGLParticleSystem = exports.ParticleComponent = void 0;
    const ecs_1 = require("@orago/ecs");
    const math_1 = require("@orago/lib/math");
    const physics_js_1 = require("../../ecs/physics.js");
    const index_js_1 = require("../index.js");
    const image_packer_js_1 = require("../util/image-packer.js");
    class ParticleCache {
        sprites = new Set();
        indexed_sprites = new Map();
        id_matches = new Map();
    }
    class ParticleComponent extends ecs_1.Component {
        image;
        source;
        particle_id;
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
    exports.ParticleComponent = ParticleComponent;
    // class ParticleEntity extends Entity {
    // 	particle = new ParticleComponent();
    // 	constructor (){
    // 	}
    // }
    class WGLParticleSystem extends ecs_1.System {
        engine;
        wgl = new index_js_1.WGL.WglProgram();
        cache = new ParticleCache();
        components = new Set([
            physics_js_1.PositionComponent,
            ParticleComponent,
        ]);
        atlas;
        constructor(engine) {
            super();
            this.engine = engine;
        }
        update(entities) {
            const instances = this.wgl.instances;
            let tracked_particles = [];
            for (const entity of entities) {
                const c_particle = entity.components.get(ParticleComponent);
                const position = entity.components.get(physics_js_1.PositionComponent);
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
                            (0, math_1.random)(1, 50),
                            (0, math_1.random)(1, 100),
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
            const packed = image_packer_js_1.ImagePacker.createPack(boxes, 1);
            this.atlas = new index_js_1.WGL.TextureAtlas(this.wgl.gl, packed.canvas);
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
    exports.WGLParticleSystem = WGLParticleSystem;
});
//# sourceMappingURL=particles.js.map