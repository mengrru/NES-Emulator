import Cartridge from "../cartridges";
import { ADDR, BYTE, CartridgeResolvedData, MemoryMap, PRG_ROM_PAGE_SIZE, UINT8 } from "../public.def";
import { NESCPUMap, PPUReg } from '../memory-map'
import { PPU } from "../ppu";

/**
 * cpu gets access to memory using three buses:
 * address bus carries the address of a required location
 * control bus notifies if it's a read or write access
 * data bus carries the byte of data being read or written
 * 
 * CPU RAM has only 2 KiB of ram space,
 * and only 11 bits is enough for addressing RAM space.
 * CPU has [0x0000, 0x2000) addressing space reserved for RAM space(13 bits),
 * so the 2highest bits have no effect when accessing RAM.
 */
const CPU_ADDRESS_MASK = 0b00000111_11111111
const PPU_REGISTER_MASK = 0b00100000_00000111

const { CPU_RAM_START, CPU_RAM_END,
    PRG_ROM_START, PRG_ROM_END,
    PPU_REG_START, PPU_REG_END } = NESCPUMap.ADDR_SPACE

// for addr mirroring
function Addr (addr: ADDR) {
    switch (true) {
        case addr >= CPU_RAM_START && addr <= CPU_RAM_END :
            return addr & CPU_ADDRESS_MASK
        case addr >= PPU_REG_START && addr <= PPU_REG_END:
            return addr & PPU_REGISTER_MASK
        default:
            return addr
    }
}
function Max (addr: ADDR) {
    switch (true) {
        case addr <= CPU_RAM_END:
            return CPU_ADDRESS_MASK // 0x07ff
        case addr <= PPU_REG_END:
            return PPU_REGISTER_MASK // 0x2007
        case addr >= PRG_ROM_START:
            return PRG_ROM_END
        default:
            console.warn('不在范围内的地址' + addr)
            return 0x7fff
    }
}

export default class Bus {
    PRGROMLen: number
    private rom: CartridgeResolvedData
    private memory: number[]
    private ppu: PPU

    constructor (rom: CartridgeResolvedData) {
        this.memory = Array(0xffff + 1).fill(0)
        this.rom = rom
        this.ppu = new PPU(rom)
        this.PRGROMLen = rom.PRGROM.length
    }
    memWrite8 (addr: number, value: number) {
        addr = Addr(addr)
        switch (addr) {
            case PPUReg.Controller:
            case PPUReg.Mask:
            case PPUReg.OAM_Address:
            case PPUReg.OAM_Data:
            case PPUReg.Scroll:
            case PPUReg.Address:
            case PPUReg.Data:
                this.ppu.write[addr](value)
                return
            case PPUReg.OAM_DMA:
                this.ppu.write.OAM_DMA(value, this.readPage(value))
                return
        }
        if (addr >= PRG_ROM_START && addr <= PRG_ROM_END) {
            console.warn(`invalid write addr ${addr}`)
            return
        } else if (addr >= PPU_REG_START && addr <= PPU_REG_END) {
            console.warn(`address ${addr} is read-only.`)
            return
        }
        this.memory[Addr(addr)] = value
    }
    memRead8 (addr: number): UINT8 {
        addr = Addr(addr)
        switch (true) {
            case addr === PPUReg.Data:
            case addr === PPUReg.OAM_Data:
            case addr === PPUReg.Status:
                return this.ppu.read[addr]()
            case addr >= PRG_ROM_START && addr <= PRG_ROM_END:
                return this.readPRGROM(addr - 0x8000)
            case addr >= PPU_REG_START && addr <= PPU_REG_END:
                throw new Error(`address ${addr} is write-only.`)
            default:
                return this.memory[addr]
        }
    }
    memWrite16 (addr: number, value: number) {
        addr = Addr(addr)
        this.memory[addr] = value & 0xff
        if (addr <= Max(addr)) {
            this.memory[addr + 1] = value >> 8
        }
    }
    memRead16 (addr: number) {
        addr = Addr(addr)
        switch (addr) {
            case NESCPUMap.IR.RESET:
                return this.rom.PRGROM.length === 0x4000 ? 0xc000 : 0x8000
        }
        if (addr + 1 <= Max(addr)) {
            return (this.memRead8(addr + 1) << 8) | this.memRead8(addr)
        } else {
            return this.memRead8(addr)
        }
    }
    private readPage (hiAddr: UINT8): UINT8[] {
        switch (true) {
            case hiAddr >= 0 && hiAddr <= 0x1f:
                return this.memory.slice(hiAddr << 8, (hiAddr + 1) << 8)
            // other ram or rom todo.
            default:
                console.warn(`invalid read page addr ${hiAddr}`)
                return []
        }
    }
    private readPRGROM (addr: number) {
        return this.rom.PRGROM[addr % this.rom.PRGROM.length]
    }
}