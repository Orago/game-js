(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./plugins/utility.js", "./base.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnginePlugin = exports.EngineClampPlugin = void 0;
    var utility_js_1 = require("./plugins/utility.js");
    Object.defineProperty(exports, "EngineClampPlugin", { enumerable: true, get: function () { return utility_js_1.EngineClampPlugin; } });
    var base_js_1 = require("./base.js");
    Object.defineProperty(exports, "EnginePlugin", { enumerable: true, get: function () { return base_js_1.EnginePlugin; } });
});
