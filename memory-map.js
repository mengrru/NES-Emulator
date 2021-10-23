define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PPUReg = exports.NESPPUMap = exports.NESCPUMap = void 0;
    exports.NESCPUMap = {
        ADDR_SPACE: {
            CPU_RAM_START: 0x0,
            CPU_RAM_END: 0x1fff,
            PPU_REG_START: 0x2000,
            PPU_REG_END: 0x3fff,
            PRG_ROM_START: 0x8000,
            PRG_ROM_END: 0xffff,
        },
        IR: {
            RESET: 0xfffc,
        }
    };
    exports.NESPPUMap = {
        ADDR_SPACE: {
            CHR_ROM_START: 0x0,
            CHR_ROM_END: 0x1fff,
            VRAM_START: 0x2000,
            VRAM_END: 0x3eff,
            PALETTES_START: 0x3f00,
            PALETTES_END: 0x3fff
        },
    };
    exports.PPUReg = {
        Controller: 0x2000,
        Mask: 0x2001,
        Status: 0x2002,
        OAM_Address: 0x2003,
        OAM_Data: 0x2004,
        Scroll: 0x2005,
        Address: 0x2006,
        Data: 0x2007,
        OAM_DMA: 0x4014
    };
});
//# sourceMappingURL=memory-map.js.map