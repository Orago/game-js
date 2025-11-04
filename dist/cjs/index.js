"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bound = exports.Rect = exports.Box = exports.Shapes = exports.Collision = exports.BoxUtil = exports.Ecs = exports.MeowtrixCss = exports.Meowtrix = void 0;
var meowtrix_js_1 = require("./util/meowtrix.js");
Object.defineProperty(exports, "Meowtrix", { enumerable: true, get: function () { return meowtrix_js_1.Meowtrix; } });
Object.defineProperty(exports, "MeowtrixCss", { enumerable: true, get: function () { return meowtrix_js_1.MeowtrixCss; } });
exports.Ecs = __importStar(require("@orago/ecs"));
exports.BoxUtil = __importStar(require("./util/boxes.js"));
var collision_js_1 = require("./util/collision.js");
Object.defineProperty(exports, "Collision", { enumerable: true, get: function () { return collision_js_1.Collision; } });
exports.Shapes = __importStar(require("./util/shapes.js"));
var shapes_js_1 = require("./util/shapes.js");
Object.defineProperty(exports, "Box", { enumerable: true, get: function () { return shapes_js_1.Box; } });
Object.defineProperty(exports, "Rect", { enumerable: true, get: function () { return shapes_js_1.Rect; } });
Object.defineProperty(exports, "Bound", { enumerable: true, get: function () { return shapes_js_1.Bound; } });
