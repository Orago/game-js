var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@orago/ecs", "./base.js", "./brush/brush.js", "./brush/color-image.js", "./brush/etch.js", "./brush/render.js", "./engine.js", "./input/cursor.js", "./input/gamepad.js", "./input/input-map.js", "./input/keyboard.js", "./input/symbols.js", "./util/meow-texture.js", "./util/meow-texture.js", "./plugins/index.js", "./plugins/legacy.js", "./plugins/particles.js", "./repeater.js", "./sprites-old.js", "./util/image-packer.js", "./wgl/program.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WGL = exports.ImagePacker = exports.Spritesheet = exports.Sprites = exports.Ticker = exports.WGLParticleSystem = exports.LegacySystem = exports.LegacyEntity = exports.EcsRenderer = exports.TextureHandler = exports.SpriteUtility = exports.SpriteStore = exports.SpriteRef = exports.MeowTexture = exports.Texture = exports.Action = exports.Keyboard = exports.InputMapHandler = exports.InputMap = exports.Gamepads = exports.Cursor = exports.Engine = exports.CanvasRender = exports.EtchUtility = exports.EtchStack = exports.Etch = exports.ColorImage = exports.ChainableCanvas = exports.BrushCanvas = exports.PluginManager = exports.ObjectManager = exports.EnginePlugin = exports.EngineObject = exports.Ecs = void 0;
    exports.Ecs = __importStar(require("@orago/ecs"));
    var base_js_1 = require("./base.js");
    Object.defineProperty(exports, "EngineObject", { enumerable: true, get: function () { return base_js_1.EngineObject; } });
    Object.defineProperty(exports, "EnginePlugin", { enumerable: true, get: function () { return base_js_1.EnginePlugin; } });
    Object.defineProperty(exports, "ObjectManager", { enumerable: true, get: function () { return base_js_1.ObjectManager; } });
    Object.defineProperty(exports, "PluginManager", { enumerable: true, get: function () { return base_js_1.PluginManager; } });
    var brush_js_1 = require("./brush/brush.js");
    Object.defineProperty(exports, "BrushCanvas", { enumerable: true, get: function () { return __importDefault(brush_js_1).default; } });
    Object.defineProperty(exports, "ChainableCanvas", { enumerable: true, get: function () { return brush_js_1.ChainableCanvas; } });
    exports.ColorImage = __importStar(require("./brush/color-image.js"));
    var etch_js_1 = require("./brush/etch.js");
    Object.defineProperty(exports, "Etch", { enumerable: true, get: function () { return etch_js_1.Etch; } });
    Object.defineProperty(exports, "EtchStack", { enumerable: true, get: function () { return etch_js_1.EtchStack; } });
    Object.defineProperty(exports, "EtchUtility", { enumerable: true, get: function () { return etch_js_1.EtchUtility; } });
    var render_js_1 = require("./brush/render.js");
    Object.defineProperty(exports, "CanvasRender", { enumerable: true, get: function () { return render_js_1.CanvasRender; } });
    var engine_js_1 = require("./engine.js");
    Object.defineProperty(exports, "Engine", { enumerable: true, get: function () { return __importDefault(engine_js_1).default; } });
    var cursor_js_1 = require("./input/cursor.js");
    Object.defineProperty(exports, "Cursor", { enumerable: true, get: function () { return __importDefault(cursor_js_1).default; } });
    var gamepad_js_1 = require("./input/gamepad.js");
    Object.defineProperty(exports, "Gamepads", { enumerable: true, get: function () { return gamepad_js_1.Gamepads; } });
    var input_map_js_1 = require("./input/input-map.js");
    Object.defineProperty(exports, "InputMap", { enumerable: true, get: function () { return input_map_js_1.InputMap; } });
    Object.defineProperty(exports, "InputMapHandler", { enumerable: true, get: function () { return input_map_js_1.InputMapHandler; } });
    var keyboard_js_1 = require("./input/keyboard.js");
    Object.defineProperty(exports, "Keyboard", { enumerable: true, get: function () { return __importDefault(keyboard_js_1).default; } });
    exports.Action = __importStar(require("./input/symbols.js"));
    exports.Texture = __importStar(require("./util/meow-texture.js"));
    var meow_texture_js_1 = require("./util/meow-texture.js");
    Object.defineProperty(exports, "MeowTexture", { enumerable: true, get: function () { return meow_texture_js_1.MeowTexture; } });
    Object.defineProperty(exports, "SpriteRef", { enumerable: true, get: function () { return meow_texture_js_1.SpriteRef; } });
    Object.defineProperty(exports, "SpriteStore", { enumerable: true, get: function () { return meow_texture_js_1.SpriteStore; } });
    Object.defineProperty(exports, "SpriteUtility", { enumerable: true, get: function () { return meow_texture_js_1.SpriteUtility; } });
    Object.defineProperty(exports, "TextureHandler", { enumerable: true, get: function () { return meow_texture_js_1.TextureHandler; } });
    var index_js_1 = require("./plugins/index.js");
    Object.defineProperty(exports, "EcsRenderer", { enumerable: true, get: function () { return index_js_1.EcsRenderer; } });
    var legacy_js_1 = require("./plugins/legacy.js");
    Object.defineProperty(exports, "LegacyEntity", { enumerable: true, get: function () { return legacy_js_1.LegacyEntity; } });
    Object.defineProperty(exports, "LegacySystem", { enumerable: true, get: function () { return legacy_js_1.LegacySystem; } });
    var particles_js_1 = require("./plugins/particles.js");
    Object.defineProperty(exports, "WGLParticleSystem", { enumerable: true, get: function () { return particles_js_1.WGLParticleSystem; } });
    var repeater_js_1 = require("./repeater.js");
    Object.defineProperty(exports, "Ticker", { enumerable: true, get: function () { return __importDefault(repeater_js_1).default; } });
    var sprites_old_js_1 = require("./sprites-old.js");
    Object.defineProperty(exports, "Sprites", { enumerable: true, get: function () { return __importDefault(sprites_old_js_1).default; } });
    Object.defineProperty(exports, "Spritesheet", { enumerable: true, get: function () { return sprites_old_js_1.Spritesheet; } });
    var image_packer_js_1 = require("./util/image-packer.js");
    Object.defineProperty(exports, "ImagePacker", { enumerable: true, get: function () { return image_packer_js_1.ImagePacker; } });
    exports.WGL = __importStar(require("./wgl/program.js"));
});
//# sourceMappingURL=index.js.map