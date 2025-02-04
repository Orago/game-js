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
        define(["require", "exports", "@orago/ecs", "./brush/boxes.js", "./brush/brush.js", "./brush/colorImage.js", "./collision.js", "./engine.js", "./input/cursor.js", "./input/gamepad.js", "./input/inputmap.js", "./input/keyboard.js", "./plugins/legacy.js", "./repeater.js", "./shapes.js", "./sprites.js", "./input/symbols.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Action = exports.Spritesheet = exports.Sprites = exports.Shapes = exports.Repeater = exports.LegacySystem = exports.LegacyEntity = exports.Keyboard = exports.InputMap = exports.Gamepads = exports.Cursor = exports.Engine = exports.Collision = exports.ColorImage = exports.ChainableCanvas = exports.BrushCanvas = exports.BoxUtil = exports.ECS = void 0;
    exports.ECS = __importStar(require("@orago/ecs"));
    exports.BoxUtil = __importStar(require("./brush/boxes.js"));
    var brush_js_1 = require("./brush/brush.js");
    Object.defineProperty(exports, "BrushCanvas", { enumerable: true, get: function () { return __importDefault(brush_js_1).default; } });
    Object.defineProperty(exports, "ChainableCanvas", { enumerable: true, get: function () { return brush_js_1.ChainableCanvas; } });
    exports.ColorImage = __importStar(require("./brush/colorImage.js"));
    var collision_js_1 = require("./collision.js");
    Object.defineProperty(exports, "Collision", { enumerable: true, get: function () { return collision_js_1.Collision; } });
    var engine_js_1 = require("./engine.js");
    Object.defineProperty(exports, "Engine", { enumerable: true, get: function () { return __importDefault(engine_js_1).default; } });
    var cursor_js_1 = require("./input/cursor.js");
    Object.defineProperty(exports, "Cursor", { enumerable: true, get: function () { return __importDefault(cursor_js_1).default; } });
    var gamepad_js_1 = require("./input/gamepad.js");
    Object.defineProperty(exports, "Gamepads", { enumerable: true, get: function () { return gamepad_js_1.Gamepads; } });
    var inputmap_js_1 = require("./input/inputmap.js");
    Object.defineProperty(exports, "InputMap", { enumerable: true, get: function () { return inputmap_js_1.InputMap; } });
    var keyboard_js_1 = require("./input/keyboard.js");
    Object.defineProperty(exports, "Keyboard", { enumerable: true, get: function () { return __importDefault(keyboard_js_1).default; } });
    var legacy_js_1 = require("./plugins/legacy.js");
    Object.defineProperty(exports, "LegacyEntity", { enumerable: true, get: function () { return legacy_js_1.LegacyEntity; } });
    Object.defineProperty(exports, "LegacySystem", { enumerable: true, get: function () { return legacy_js_1.LegacySystem; } });
    var repeater_js_1 = require("./repeater.js");
    Object.defineProperty(exports, "Repeater", { enumerable: true, get: function () { return __importDefault(repeater_js_1).default; } });
    exports.Shapes = __importStar(require("./shapes.js"));
    var sprites_js_1 = require("./sprites.js");
    Object.defineProperty(exports, "Sprites", { enumerable: true, get: function () { return __importDefault(sprites_js_1).default; } });
    Object.defineProperty(exports, "Spritesheet", { enumerable: true, get: function () { return sprites_js_1.Spritesheet; } });
    exports.Action = __importStar(require("./input/symbols.js"));
});
