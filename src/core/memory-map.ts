// load program code into memory starting at 0x8000 address.
// Program ROM: 0x8000 - 0xffff

import type { MemoryMap } from "./public.def";

// instruction stream start somewhere in this space (not necessarily at 0x8000)
export const NESCPUMap: MemoryMap = {
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
}

export const NESPPUMap = {
    ADDR_SPACE: {
        CHR_ROM_START: 0x0,
        CHR_ROM_END: 0x1fff,

        VRAM_START: 0x2000,
        VRAM_END: 0x3eff,

        PALETTES_START: 0x3f00,
        PALETTES_END: 0x3fff
    },
}

export const PPUReg = {
    Controller: 0x2000,
    Mask: 0x2001,
    // report PPU status
    Status: 0x2002, // read-only
    // OAM: Object Attribute Memory
    // the space responsible for sprites
    OAM_Address: 0x2003,
    OAM_Data: 0x2004,
    Scroll: 0x2005,
    Address: 0x2006,
    Data: 0x2007,
    // Direct Memory Access
    // for fast copying of 256 bytes from CPU RAM to OAM
    OAM_DMA: 0x4014
}
