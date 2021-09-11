import { MemoryMap } from "../public.def";

export const TestGameMap: MemoryMap = {
    ADDR_SPACE: {
        PRG_ROM_START: 0x0600,
        PRG_ROM_END: 0xffff,
    },
    SPEC_ADDR: {
        RESET_PC_STORED_IN: 0xfffc,
    }
}
