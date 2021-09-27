import { NESPPUMap, PPUReg } from "../memory-map"
import { BIT, CartridgeResolvedData, Mirroring, UINT16, UINT8 } from "../public.def"
import { REG_Address, REG_Controller, REG_Data, REG_Mask, REG_OAMAddress, REG_OAMData, REG_OAMDMA, REG_Scroll, REG_Status } from "./registers"

/**
 * Two communication channels exist between CPU and PPU:
 * - CPU is driving communication through IO registers
 * - PPU sends an interrupt signal to CPU upon entering V-BLANK period
 * 
 * PPU renders 262 scanlines per frame.
 * (0 - 240 are visible scanlines, the rest are so-called vertical overscan)
 * Each scanline lasts for 341 PPU clock cycles, with each clock cycle producing on pixel.
 * (the first 256 pixels are visible, the rest is horizontal overscan)
 * NES screen resolution is 320*240, thus scanlines 241 - 262 are not visible.
 * 
 * Upon entering the 241st scanline, PPU triggers VBlank NMI on the CPU.
 * PPU makes no memory accesses during 241 - 262 scanlines, so PPU memory can be freely accessed by the program.
 * The majority of games play it safe and update the screen state only during this period,
 * essentially preparing the view state for the next frame.
 * 
 * https://bugzmanov.github.io/nes_ebook/chapter_6_1.html
 */

const { CHR_ROM_START, CHR_ROM_END,
    VRAM_START, VRAM_END,
    PALETTES_START, PALETTES_END } = NESPPUMap.ADDR_SPACE

export class PPU {
    CHRROM: Uint8Array
    mirroring: Mirroring
    paletteTable: number[] = Array(32).fill(0)
    VRAM: number[] = Array(2048).fill(0)
    OAMData: number[] = Array(64 * 4).fill(0)

    internalBuf: UINT8 = 0

    regController = new REG_Controller()
    regMask = new REG_Mask()
    regStatus = new REG_Status()
    regOAMAddress = new REG_OAMAddress()
    regOAMData = new REG_OAMData()
    regScroll = new REG_Scroll()
    regAddress = new REG_Address()
    regData = new REG_Data()
    regOAMDMA = new REG_OAMDMA()

    constructor (rom: CartridgeResolvedData) {
        this.CHRROM = rom.CHRROM
        this.mirroring = rom.screenMirroring
    }

    // read/write to CPU
    // all behavior is when CPU reads or writes
    get write () {
        const self = this
        return {
            [PPUReg.Controller] (data: UINT8 | BIT, i: number = -1) {
                if (i === -1) {
                    self.regController.set(data)
                } else {
                    self.regController.updateBit(i, data)
                }
            },
            [PPUReg.Mask] (data: UINT8 | BIT, i: number = -1) {
                self.regMask.set(data)
            },
            [PPUReg.OAM_Address] (data: UINT8) {
                self.regOAMAddress.set(data)
                self.regOAMData.set(self.OAMRead(data))
            },
            [PPUReg.OAM_Data] (data: UINT8) {
                self.regOAMData.set(data)
                self.OAMWrite(self.regOAMAddress.get(), data)
                self.regOAMAddress.inc()
            },
            [PPUReg.Scroll] (data: UINT8) {
                self.regScroll.updateByte(data)
            },
            [PPUReg.Address] (data: UINT8) {
                self.regAddress.updateByte(data)
            },
            [PPUReg.Data] (data: UINT8) {
                self.regData.set(data)
                self.memWrite(self.regAddress.get(), data)
                self.regAddress.inc(self.regController.vramAddrInc())
            },
            OAM_DMA (data: UINT8, page: UINT8[]) {
                self.regOAMDMA.set(data)
                if (page.length !== 0) {
                    self.writePagetoOAM(page)
                }
            }
        }
    }

    get read () {
        const self = this
        return {
            [PPUReg.Status] () {
                self.regAddress.reset()
                return self.regStatus.get()
            },
            [PPUReg.OAM_Data] () {
                return self.regOAMData.get()
            },
            [PPUReg.Data] () {
                const addr = self.regAddress.get()
                const data = self.memRead(addr)
                self.regData.set(data)
                // read or write access to 0x2007 increments the 0x2006
                // the increment size is determined by the state of the Control register
                self.regAddress.inc(self.regController.vramAddrInc())
                return self.regData.get()
            },
        }
    }

    private writePagetoOAM (page: UINT8[]) {
        this.OAMData = page
    }

    private OAMRead (addr: UINT8): UINT8 {
        return this.OAMData[addr]
    }

    private OAMWrite (addr: UINT8, data: UINT8) {
        this.OAMData[addr] = data
    }

    private VRAMRead (addr: UINT16): UINT8 {
        return this.VRAM[addr]
    }

    private VRAMWrite (addr: UINT16, data: UINT8) {
        this.VRAM[addr] = data
    }

    private memRead (addr: UINT16) {
        addr %= 0x4000
        const res = this.internalBuf
        switch (true) {
            case addr >= CHR_ROM_START && addr <= CHR_ROM_END:
                this.internalBuf = this.CHRROM[addr]
                return res
            case addr >= VRAM_START && addr <= VRAM_END:
                this.internalBuf = this.VRAMRead(this.mirroringAddr(addr - VRAM_START))
                return res
            case addr >= PALETTES_START && addr <= PALETTES_END:
                return this.paletteTable[addr - PALETTES_START]
            default:
                throw new Error('invalid PPU memRead.')
        }
    }

    private memWrite (addr: UINT16, data: UINT8) {
        addr %= 0x4000
        switch (true) {
            case addr >= VRAM_START && addr <= VRAM_END:
                return this.VRAMWrite(addr, data)
            case addr >= PALETTES_START && addr <=PALETTES_END:
                this.paletteTable[addr - PALETTES_START] = data
                return
            default:
                throw new Error('invalid PPU memWrite.')
        }
    }

    private mirroringAddr (addr: UINT16) {
        if (this.mirroring === Mirroring.VERTICAL) {
            return addr % 0x800
        } else if (this.mirroring === Mirroring.HORIZONTAL) {
            if (addr % 0x400 === 1 || addr % 0x400 === 3) {
                return addr - 0x400
            } else {
                return addr
            }
        }
        console.warn(`VRAM addr: ${addr}`)
    }
}
