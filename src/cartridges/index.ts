/**
 * upon insertion into the console,
 * PRG ROM gets connected to CPU,
 * and CHR ROM gets connected to PPU.
 * on a hardware level, CPU wasn't able to access CHR ROM directly,
 * and PPU wasn't able to access RPG ROM
 * 
 * mappers to provide access to extended ROM memory:
 * both CHR ROM and PRG ROM
 * extra RAM to save and restore a game state
 * 
 * NES header 16 bytes
 * PRG ROM (size depends on byte 4 in header)
 * CHR ROM (size depends on byte 5 in header)
 * 
 * byte 0 - 3: string "NES^Z" used to recognize
 * byte 4    : number of 16kB ROM banks (PRG ROM)
 * byte 5    : number of 8kB VROM banks (CHR ROM)
 * byte 6    : control byte 1
 * byte 7    : control byte 2
 * byte 8 - 9: size of PRG RAM in 8KB units
 * byte 10~  : reserved, must be zeros
 * 
 */

import { 
    CartridgeResolvedData,
    CHR_ROM_PAGE_SIZE,
    Mirroring,
    NESFileSymbol,
    PRG_ROM_PAGE_SIZE
} from "../public.def"

/**
 * input: rom binary
 * output: CartridgeResolvedData
 */

export default class Cartridge {
    binary: Uint8Array
    constructor (binary: Uint8Array) {
        this.binary = binary
    }

    resolve (): CartridgeResolvedData {
        const byte0to3 = this.binary.slice(0, 4)
        const PRGROMBanks = this.binary[4]
        const CHRROMBanks = this.binary[5]
        const controlByte1 = this.binary[6]
        const controlByte2 = this.binary[7]
        const PRGRAMUnits = this.binary.slice(8, 10)

        for (let i = 0; i < byte0to3.length; i++) {
            if (NESFileSymbol[i] !== byte0to3[i]) {
                throw new Error('This file is not a .NES file.')
            }
        }

        // byte 6
        const verticalMirroring = controlByte1 & 1
        const batteryBackedRAM = (controlByte1 >> 1) & 1
        const haveTrainer = (controlByte1 >> 2) & 1
        const fourScreenVRAM = (controlByte1 >> 3) & 1
        const mapperTypeLowerBits = (controlByte1 >> 4) & 0b1111

        // byte 7
        const iNESEdition = (controlByte2 >> 2) & 0b11
        const mapperTypeUpperBits = (controlByte2 >> 4) & 0b1111

        if (iNESEdition !== 0b00) {
            throw new Error('Do not support others iNES format except iNES 1.0.')
        }

        const PRGROMSize = PRGROMBanks * PRG_ROM_PAGE_SIZE
        const CHRROMSize = CHRROMBanks * CHR_ROM_PAGE_SIZE

        let PRGROMStart = 0x10
        if (haveTrainer) {
            PRGROMStart += 512
        }
        const CHRROMStart = PRGROMStart + PRGROMSize

        console.log(`PRGROMSize:${PRGROMSize.toString(16)} CHRROMSize:${CHRROMSize.toString(16)}`)
        return {
            PRGROM: this.binary.slice(PRGROMStart, PRGROMStart + PRGROMSize),
            CHRROM: this.binary.slice(CHRROMStart, CHRROMStart + CHRROMSize),
            mapper: mapperTypeLowerBits | (mapperTypeUpperBits << 4),
            screenMirroring: (function () {
                if (fourScreenVRAM) {
                    return Mirroring.FOUR_SCREEN
                } else {
                    return verticalMirroring ? Mirroring.VERTICAL : Mirroring.HORIZONTAL
                }
            })()
        }
    }
}