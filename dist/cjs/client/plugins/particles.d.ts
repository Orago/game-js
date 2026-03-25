import { Component, Entity, System } from "@orago/ecs";
import { Rectangle } from "@orago/lib/math";
import { SizedImageSource } from "../brush/render.js";
import { Engine, WGL } from "../index.js";
declare class ParticleCache {
    sprites: Set<SizedImageSource>;
    indexed_sprites: Map<SizedImageSource, Rectangle>;
    id_matches: Map<SizedImageSource, number>;
}
export declare class ParticleComponent extends Component {
    image: SizedImageSource;
    source: [x: number, y: number, w: number, h: number];
    particle_id?: number;
    constructor(image: SizedImageSource, source?: [x: number, y: number, w: number, h: number]);
}
export declare class WGLParticleSystem extends System {
    engine: Engine;
    wgl: WGL.WglProgram;
    cache: ParticleCache;
    components: Set<Function>;
    atlas?: WGL.TextureAtlas;
    constructor(engine: Engine);
    update(entities: Set<Entity>): void;
    rebuild(): void;
    addParticle(image: SizedImageSource): number | undefined;
}
export {};
