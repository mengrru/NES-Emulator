define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Mirroring = exports.CHR_ROM_PAGE_SIZE = exports.PRG_ROM_PAGE_SIZE = exports.NESFileSymbol = void 0;
    exports.NESFileSymbol = [0x4e, 0x45, 0x53, 0x1a];
    exports.PRG_ROM_PAGE_SIZE = 16 * 1024;
    exports.CHR_ROM_PAGE_SIZE = 8 * 1024;
    var Mirroring;
    (function (Mirroring) {
        Mirroring[Mirroring["VERTICAL"] = 0] = "VERTICAL";
        Mirroring[Mirroring["HORIZONTAL"] = 1] = "HORIZONTAL";
        Mirroring[Mirroring["FOUR_SCREEN"] = 2] = "FOUR_SCREEN";
    })(Mirroring = exports.Mirroring || (exports.Mirroring = {}));
});
//# sourceMappingURL=public.def.js.map