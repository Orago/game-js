import { Engine, WGL } from "../index.js";
import { TRenderableImage } from "../brush/render.js";
import { TBox } from "../../util/potpack.js";
import { Component, Entity, System } from "@orago/ecs";
declare class ParticleCache {
    sprites: Set<TRenderableImage>;
    indexed_sprites: Map<TRenderableImage, TBox>;
    id_matches: Map<TRenderableImage, number>;
}
export declare class ParticleComponent extends Component {
    image: TRenderableImage;
    source: [x: number, y: number, w: number, h: number];
    particle_id?: number;
    constructor(image: TRenderableImage, source?: [x: number, y: number, w: number, h: number]);
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
    addParticle(image: TRenderableImage): number | undefined;
}
export {};
