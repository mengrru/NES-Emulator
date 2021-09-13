// load program code into memory starting at 0x8000 address.
// Program ROM: 0x8000 - 0xffff

import { MemoryMap } from "./public.def";

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
