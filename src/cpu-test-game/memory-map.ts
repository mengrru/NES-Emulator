import { MemoryMap } from "../public.def";

export const TestGameMap: MemoryMap = {
    ADDR_SPACE: {
        PRG_ROM_START: 0x0600,
        PRG_ROM_END: 0xffff,
    },
    IR: {
        RESET: 0xfffc,
    }
}
