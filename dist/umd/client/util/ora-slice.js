(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OraSlice = void 0;
    class OraSlice {
        static lex(input) {
            const output = input.match(/(['"])(.*?)\1|\w+|(?!\\)[~!@#$%^&*{}()-_+"'\\/.;:\[\]\s]|[\uD83C-\uDBFF\uDC00-\uDFFF]+/g);
            if (output == null) {
                // throw "This is a blank file!";
                return [];
            }
            while (output.indexOf(" ") != -1) {
                output.splice(output.indexOf(" "), 1);
            }
            return output;
        }
        static chunk(lexed) {
            const chunks = [];
            let chunk = [];
            let scopeDepth = 0;
            for (const item of lexed) {
                if (item === "(")
                    scopeDepth++;
                else if (item === ")")
                    scopeDepth--;
                if (item === ";" && scopeDepth === 0) {
                    chunks.push(chunk);
                    chunk = [];
                }
                else if (!["\n", "\t", "\r"].includes(item))
                    chunk.push(item);
            }
            return chunks;
        }
        static parseVec(values) {
            const captured = [];
            if (values[0] != "(" || values[values.length - 1] != ")") {
                return captured;
            }
            for (let i = 1; i < values.length - 1; i++) {
                if (i % 2 == 0) {
                    if (values[i] != ",") {
                        return captured;
                    }
                }
                else {
                    captured.push(values[i]);
                }
            }
            return captured;
        }
        static getValues(input) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            const lexed = OraSlice.lex(input);
            const source = {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            };
            const destination = {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            };
            const index = {
                x: 0,
                y: 0,
            };
            for (const [key, ...vec] of OraSlice.chunk(lexed)) {
                switch (key) {
                    case "s": {
                        const v_s = OraSlice.parseVec(vec).map(Number);
                        source.x = (_a = v_s[0]) !== null && _a !== void 0 ? _a : 0;
                        source.y = (_b = v_s[1]) !== null && _b !== void 0 ? _b : 0;
                        source.width = (_c = v_s[2]) !== null && _c !== void 0 ? _c : 0;
                        source.height = (_d = v_s[3]) !== null && _d !== void 0 ? _d : 0;
                        break;
                    }
                    case "d": {
                        const v_d = OraSlice.parseVec(vec).map(Number);
                        destination.x = (_e = v_d[0]) !== null && _e !== void 0 ? _e : 0;
                        destination.y = (_f = v_d[1]) !== null && _f !== void 0 ? _f : 0;
                        destination.width = (_g = v_d[2]) !== null && _g !== void 0 ? _g : 0;
                        destination.height = (_h = v_d[3]) !== null && _h !== void 0 ? _h : 0;
                        break;
                    }
                    case "i": {
                        const v_i = OraSlice.parseVec(vec).map(Number);
                        index.x = (_j = v_i[0]) !== null && _j !== void 0 ? _j : 0;
                        index.y = (_k = v_i[1]) !== null && _k !== void 0 ? _k : 0;
                        if (v_i.length >= 3) {
                            index.width = (_l = v_i[2]) !== null && _l !== void 0 ? _l : 0;
                            if (v_i.length >= 4) {
                                index.height = (_m = v_i[3]) !== null && _m !== void 0 ? _m : 0;
                            }
                        }
                        break;
                    }
                }
            }
            if (index.x != 0 && index.width != 0) {
                source.x += (index.width || source.width) * index.x;
            }
            if (index.y != 0 && index.height != 0) {
                source.y += (index.height || source.height) * index.y;
            }
            return {
                source,
                destination,
            };
        }
    }
    exports.OraSlice = OraSlice;
});
