export type BYTE = number
export type BYTE2 = number
export type BIT = number
export type INT8 = number
export type UINT8 = number
export type UINT16 = number
export type ADDR = number // 16bit

export const NESFileSymbol = [0x4e, 0x45, 0x53, 0x1a]
export const PRG_ROM_PAGE_SIZE = 16 * 1024
export const CHR_ROM_PAGE_SIZE = 8 * 1024
export enum Mirroring {
    VERTICAL,
    HORIZONTAL,
    FOUR_SCREEN
}

export interface CartridgeResolvedData {
    PRGROM: Uint8Array,
    CHRROM: Uint8Array,
    mapper: number,
    screenMirroring: Mirroring
}

export interface MemoryMap {
    ADDR_SPACE: {
        PRG_ROM_START: ADDR,
        PRG_ROM_END: ADDR,
        CPU_RAM_START?: ADDR,
        CPU_RAM_END?: ADDR,
        PPU_REG_START?: ADDR,
        PPU_REG_END?: ADDR,
    },
    SPEC_ADDR: any
}