// load program code into memory starting at 0x8000 address.
// Program ROM: 0x8000 - 0xffff
// instruction stream start somewhere in this space (not necessarily at 0x8000)
export const NESMap = {
    ADDR_SPACE: {
        PRG_ROM_START: 0x8000,
        PRG_ROM_END: 0xffff,
    },
    SPEC_ADDR: {
        RESET_PC_STORED_IN: 0xfffc,
    }
}
