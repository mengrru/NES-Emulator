import Bus from "../bus"
import { NESPPUMap, PPUReg } from "../memory-map"
import { Mirroring } from "../public.def"
import type { BYTE, BIT, UINT16, UINT8 } from "../public.def"
import { REG_Address, REG_Controller, REG_Data, REG_Mask, REG_OAMAddress, REG_OAMData, REG_OAMDMA, REG_Scroll, REG_Status } from "./registers"
import Colors from './colors'
import type {RGB, Tile} from "./ppu.def"
import PPUTiming from "./timing"

/**
* Graphics data
* 8 * 8 pixel image could use up to 4 colors.
* (background tile can have 4 colors, a sprite tile can have 3 colors)
* 8 * 8 * 2 = 128 bits = 16 bytes to codify a single tile
*/

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

type PPUAddr = UINT16
type VRAMAddr = UINT16
type OAMAddr = UINT8
type ScreenX = number
type ScreenY = number
type NametableX = number
type NametableY = number
type DoubleScreenX = number
type DoubleScreenY = number

interface VRAMDataWrapper {
    data: number,
    attrIndex: number,
    paletteIndexPosi: number
}

const { CHR_ROM_START, CHR_ROM_END,
    VRAM_START, VRAM_END,
    PALETTES_START, PALETTES_END } = NESPPUMap.ADDR_SPACE

export class PPU {
    bus: Bus

    mirroring: Mirroring
    CHRROM: Uint8Array
    paletteTable: number[] = Array(32).fill(0)
    VRAM: number[] = Array(2048).fill(0)
    OAMData: number[] = Array(64 * 4).fill(0)

    _clockCycle: number = 0
    scanline: number = 0

    internalBuf: UINT8 = 0
    v: UINT16 = 0
    t: UINT16 = 0
    x: UINT8 = 0
    w: UINT8 = 0

    regController = new REG_Controller(this)
    regMask = new REG_Mask()
    regStatus = new REG_Status()
    regOAMAddress = new REG_OAMAddress()
    regOAMData = new REG_OAMData()
    regScroll = new REG_Scroll()
    regAddress = new REG_Address()
    regData = new REG_Data()
    regOAMDMA = new REG_OAMDMA()

    timing = new PPUTiming(this)

    VRAMMap: VRAMDataWrapper[] = genVRAMMap()

    constructor (bus: Bus) {
        this.CHRROM = bus.rom.CHRROM
        this.mirroring = bus.rom.screenMirroring
        this.bus = bus
    }

    get clockCycle () {
        return this._clockCycle
    }

    set clockCycle (value) {
        if (value > this._clockCycle) {
            const old = this._clockCycle
            for (let i = 0; i < value - old; i++) {
                this._clockCycle++
                this.tick()
            }
        } else {
            this._clockCycle = value
        }
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
                self.t &= 0b111_0011_1111_1111
                self.t |= (data & 0b11) << 10
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
                if (self.w === 0) {
                    self.t &= 0b111_1111_1110_0000
                    self.t |= (data & 0b1111_1000) >> 3
                    self.x = data & 0b0000_0111
                    self.w = 1
                } else {
                    self.t &= 0b000_1100_0001_1111
                    self.t |= (data & 0b1100_0000) << 2
                    self.t |= (data & 0b0011_1000) << 2
                    self.t |= (data & 0b111) << 12
                    self.w = 0
                }
            },
            [PPUReg.Address] (data: UINT8) {
                self.regAddress.updateByte(data)
                if (self.w === 0) {
                    self.t &= 0b000_0000_1111_1111
                    self.t |= (data & 0b11_1111) << 8
                    self.w = 1
                } else {
                    self.t &= 0b111_1111_0000_0000
                    self.t |= data
                    self.v = self.t
                    self.w = 0
                }
            },
            [PPUReg.Data] (data: UINT8) {
                self.regData.set(data)
                self.memWrite(self.regAddress.get(), data)
                self.regAddress.inc(self.regController.vramAddrInc)
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
            [PPUReg.Mask] () {
                return self.regMask.get()
            },
            [PPUReg.Scroll] () {
                // after reading PPUSTATUS to reset the address latch
                self.regScroll.reset()
                return self.regScroll.get()
            },
            [PPUReg.Controller] () {
                return self.regController.get()
            },
            [PPUReg.OAM_Address] () {
                return self.regOAMAddress.get()
            },
            [PPUReg.Address] () {
                return self.regAddress.value[1]
            },
            [PPUReg.Status] () {
                self.w = 0
                self.regScroll.reset()
                self.regAddress.reset()
                return self.regStatus.get()
            },
            [PPUReg.OAM_Data] () {
               // return self.regOAMData.get()
               return self.OAMRead(self.regOAMAddress.get())
            },
            [PPUReg.Data] () {
                const addr = self.regAddress.get()
                const data = self.memRead(addr)
                self.regData.set(data)
                // read or write access to 0x2007 increments the 0x2006
                // the increment size is determined by the state of the Control register
                // but in practice this operate will lead to wrong render result.
                // self.regAddress.inc(self.regController.vramAddrInc)
                return self.regData.get()
            },
        }
    }

    /**
     * the PPU renders 262 scan lines per frame
     * each scanline lasts for 341 PPU clock cycles
     * upon entering scanline 241, PPU triggers NMI interrupt
     * PPU clock cycles are 3 times faster than CPU clock cycles
     */
    private tick () {
        if (this._clockCycle === 341) {

            this._clockCycle = 0
            this.scanline++

            if (this.scanline === 262) {
                this.scanline = 0
            }
        }

        this.timing.exec(this.scanline, this._clockCycle)
    }

    get isSprite0Hit (): boolean {
        const x = this.OAMData[3]
        const y = this.OAMData[0]
        return (this.scanline === y) && (x <= this._clockCycle) && this.regMask.showSprites
    }

    get renderingEnable (): boolean {
        return this.regMask.showBg || this.regMask.showSprites
    }

    IR_NMI () {
        /**
         * in addition to scanline position,
         * PPU would immidiately trigger NMI if both of these
         * conditions are met:
         * 1. PPU is VBLANK state
         * 2. "Generate NMI" bit in the controll Register is update from 0 to 1
         */
        this.bus.cpu.IR_NMI()
    }

    private writePagetoOAM (page: UINT8[]) {
        this.OAMData = page
    }

    private OAMRead (addr: OAMAddr): UINT8 {
        return this.OAMData[addr]
    }

    private OAMWrite (addr: OAMAddr, data: UINT8) {
        this.OAMData[addr] = data
    }

    private VRAMRead (addr: PPUAddr): UINT8 {
        const realAddr = mirroringAddr(addr - VRAM_START, this.mirroring)
        return this.VRAM[realAddr]
    }

    private VRAMWrite (addr: PPUAddr, data: UINT8) {
        const realAddr = mirroringAddr(addr - VRAM_START, this.mirroring)
        this.VRAM[realAddr] = data

        const VRAMAddr = addr - VRAM_START
        if (VRAMAddr < 0x3c0) {
            const i = VRAMAddr
            this.VRAMMap[i + Math.floor(i / 32) * 32].data = data
        } else if (VRAMAddr >= 0x400 && VRAMAddr < 0x7c0) {
            const i = VRAMAddr - 0x400
            this.VRAMMap[i + (Math.floor(i / 32) + 1) * 32].data = data
        } else if (VRAMAddr >= 0x800 && VRAMAddr < 0xbc0) {
            const i = VRAMAddr - 64 * 2
            this.VRAMMap[i + Math.floor((i - 0x800) / 32) * 32].data = data
        } else if (VRAMAddr >= 0xc00 && VRAMAddr < 0xfc0) {
            const i = VRAMAddr - 0x400 - 64 * 2
            this.VRAMMap[i + (Math.floor((i - 0x800) / 32) + 1) * 32].data = data
        }
    }

    private memRead (addr: PPUAddr) {
        addr %= 0x4000
        const res = this.internalBuf
        switch (true) {
            case addr >= CHR_ROM_START && addr <= CHR_ROM_END:
                this.internalBuf = this.CHRROM[addr]
                return res
            case addr >= VRAM_START && addr <= VRAM_END:
                this.internalBuf = this.VRAMRead(addr)
                return res
            case addr >= PALETTES_START && addr <= PALETTES_END:
                return this.paletteTable[addr - PALETTES_START]
            default:
                console.warn('invalid PPU memRead.' + addr.toString(16))
        }
    }

    private memWrite (addr: PPUAddr, data: UINT8) {
        addr %= 0x4000
        if (addr < 0x2000) {
            addr += 0x2000
        }
        switch (true) {
            case addr >= VRAM_START && addr <= VRAM_END:
                return this.VRAMWrite(addr, data)
            case addr >= PALETTES_START && addr <=PALETTES_END:
                this.paletteTable[addr - PALETTES_START] = data
                return
            default:
                console.warn('invalid PPU memWrite.' + addr.toString(16))
        }
    }

    frame (){
        this.renderBackground()
        this.renderSprites()
        this.bus.screen.render()
    }

    /*
    private getPixelFromScrollCoord (X: DoubleScreenX, Y: DoubleScreenY) {
        const CHRBank = this.regController.backgroundAddr
        const tileX = Math.floor(X / 8), tileY = Math.floor(Y / 8)
        const tileLeftTopX = X % 8, tileLeftTopY = Y % 8
        const tileStartAddr = this.VRAMMap[tileY * 64 + tileX] * 16 + CHRBank

        const nametableStartAddr = this.regController.nametable
        const startVRAMAddr = mirroringAddr(nametableStartAddr - VRAM_START, this.mirroring)
        const attributeTable = this.VRAM.slice(
            startVRAMAddr, startVRAMAddr + 1024
        ).slice(-64)

        const tile = (combineToATile(
            this.CHRROM.slice(tileStartAddr, tileStartAddr + 8),
            this.CHRROM.slice(tileStartAddr + 8, tileStartAddr + 16),
            getBgPalette(this.paletteTable, paletteIndex)
        ))
    }
    */

    private renderBackground () {
        const nametableStartAddr = this.regController.nametable
        const CHRBank = this.regController.backgroundAddr

        const startVRAMAddr = mirroringAddr(nametableStartAddr - VRAM_START, this.mirroring)
        const attributeTable = this.VRAM.slice(
            startVRAMAddr, startVRAMAddr + 1024
        ).slice(-64)
        const LEN = 32 * 30
        const scale = this.bus.screen.scale
        const res = []
        for (let i = nametableStartAddr, j = 0; i < nametableStartAddr + LEN; i++, j++) {
            // const realPPUAddr = scrollAddr(this.mirroring, nametableStartAddr, i, this.regScroll.x, this.regScroll.y)
            const tileStartAddr = (this.VRAMRead(i) || 0) * 16 + CHRBank
            const paletteIndex = getPaletteIndex(j % 32, Math.floor(j / 32), attributeTable)
            const tile = (combineToATile(
                this.CHRROM.slice(tileStartAddr, tileStartAddr + 8),
                this.CHRROM.slice(tileStartAddr + 8, tileStartAddr + 16),
                getBgPalette(this.paletteTable, paletteIndex)
            ))
            this.bus.screen.drawATile(tile, j % 32 * scale * 8, Math.floor(j / 32) * scale * 8)
        }
    }

    private renderSprites () {
        const oam = this.OAMData
        const scale = this.bus.screen.scale
        for (let i = oam.length - 4; i >= 0; i-=4) {
            const x = oam[i + 3]
            const y = oam[i]
            const index = oam[i + 1]
            const attr = oam[i + 2]

            const priority = attr >> 5 & 1
            if (priority) {
                continue
            }
            const flipH = (attr >> 6 & 1) ? true : false
            const flipV = (attr >> 7 & 1) ? true : false
            const palette = getSpritePalette(this.paletteTable, attr & 0b11)

            const CHRBank = this.regController.spriteAddr
            const tileStartAddr = CHRBank + index * 16

            const tile = combineToATile(
                this.CHRROM.slice(tileStartAddr, tileStartAddr + 8),
                this.CHRROM.slice(tileStartAddr + 8, tileStartAddr + 16),
                palette, flipV, flipH, true
            )

            this.bus.screen.drawATile(tile, x * scale, y * scale)
        }
    }

    tiles_test (): Tile[] {
        const len = this.CHRROM.length
        const output = []
        for (let i = 0; i < len; i += 16) {
            output.push(combineToATile(
                this.CHRROM.slice(i, i + 8),
                this.CHRROM.slice(i + 8, i + 16)
            ))
        }
        return output
    }
}

function getBgPalette (paletteTable: number[], paletteIndex: number): number[] {
    return paletteTable.slice(paletteIndex * 4, paletteIndex * 4 + 4)
}

function getSpritePalette (paletteTable: number[], paletteIndex: number): number[] {
    const N = 4 * 4
    return paletteTable.slice(N + paletteIndex * 4, N + paletteIndex * 4 + 4)
}

function getPaletteIndex (x: number, y: number, attributeTable: number[]): number {
    const attributeIndex = Math.floor(x / 4) + Math.floor(y / 4) * (32 / 4)
    const attribute = attributeTable[attributeIndex]
    switch ((Math.floor(x % 4 / 2) << 1) + Math.floor(y % 4 / 2)) {
        case 0b00: return attribute & 0b11
        case 0b10: return (attribute >> 2) & 0b11
        case 0b01: return (attribute >> 4) & 0b11
        case 0b11: return (attribute >> 6) & 0b11
    }
}

function computedAttributeIndex (x: number, y: number) {
    return Math.floor(x / 4) + Math.floor(y / 4) * (32 / 4)
}

function computedPaletteIndexPosi (x: number, y: number) {
    switch ((Math.floor(x % 4 / 2) << 1) + Math.floor(y % 4 / 2)) {
        case 0b00: return 0
        case 0b10: return 1
        case 0b01: return 2
        case 0b11: return 3
    }
}

function genVRAMMap (): VRAMDataWrapper[] {
    const LEN = 32 * 30 * 4
    const res = Array(LEN)
    for (let VRAMAddr = 0; VRAMAddr < LEN; VRAMAddr++) {
        let x, y, mappedIndex
        if (VRAMAddr < 0x3c0) {
            const i = VRAMAddr
            mappedIndex = i + Math.floor(i / 32) * 32
            x = VRAMAddr % 32
            y = Math.floor(VRAMAddr / 32)
        } else if (VRAMAddr >= 0x400 && VRAMAddr < 0x7c0) {
            const i = VRAMAddr - 0x400
            mappedIndex = i + (Math.floor(i / 32) + 1) * 32
            x = i % 32
            y = Math.floor(i / 32)
        } else if (VRAMAddr >= 0x800 && VRAMAddr < 0xbc0) {
            const i = VRAMAddr - 64 * 2
            mappedIndex = i + Math.floor((i - 0x800) / 32) * 32
            x = (VRAMAddr - 0x800) % 32
            y = Math.floor((VRAMAddr - 0x800) / 32)
        } else if (VRAMAddr >= 0xc00 && VRAMAddr < 0xfc0) {
            const i = VRAMAddr - 0x400 - 64 * 2
            mappedIndex = i + (Math.floor((i - 0x800) / 32) + 1) * 32
            x = (VRAMAddr - 0xc00) % 32
            y = Math.floor((VRAMAddr - 0xc00) / 32)
        }
        res[mappedIndex] = {
            data: 0,
            attrIndex: computedAttributeIndex(x, y),
            paletteIndexPosi: computedPaletteIndexPosi(x, y)
        }
    }
    return res
}

function scrollAddr (mirroring: Mirroring, nametableStartAddr: PPUAddr, addr: PPUAddr, x: number, y: number): PPUAddr {
    if (mirroring === Mirroring.HORIZONTAL) {
        const haddr = addr + Math.floor(x / 8) * 32
        if (haddr - nametableStartAddr < (0x400 - 64)) {
            return haddr
        }
        switch (nametableStartAddr) {
            case 0x2000:
                return haddr + 0x800 + 64
            case 0x2400:
                return haddr + 0x800 + 64
            case 0x2800:
                return haddr - 0x800 + 64
            case 0x2c00:
                return haddr - 0x1000 + 64
        }
    }
    if (mirroring === Mirroring.VERTICAL) {
        const vaddr = addr + Math.floor(x / 8) * 30
        if (vaddr < 0x3000) {
            return vaddr
        }
        return vaddr - 0x1000
    }
}

function mirroringAddr (addr: VRAMAddr, mirroring: Mirroring): VRAMAddr {
    if (mirroring === Mirroring.VERTICAL) {
        return addr % 0x800
    } else if (mirroring === Mirroring.HORIZONTAL) {
        if (Math.floor(addr / 0x400) === 1) {
            return addr - 0x400
        } else if (Math.floor(addr / 0x400) === 2) {
            return addr - 0x400
        } else if (Math.floor(addr / 0x400) === 3) {
            return addr - 0x800
        } else {
            return addr
        }
    }
    console.warn(`VRAM addr: ${addr}`)
}

function combineToATile (low: Uint8Array, high: Uint8Array, palette?: number[], v: boolean = false, h: boolean = false, isSprite: boolean = false): Tile {
    if (!palette) {
        palette = [0x23, 0x27, 0x30]
    }
    const res = []
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const a = v ? 7 - i : i, b = h ? 7 - j : j
            if (res[a] === undefined) {
                res[a] = []
            }
            const code = (ByteN(high[i], j) << 1) | ByteN(low[i], j)
            if (isSprite) {
                res[a][b] = code === 0 ? [0, 0, 0, 0] : Colors[palette[code]]
            } else {
                res[a][b] = Colors[palette[code]]
            }
        }
    }
    return res
}

function ByteN (x: BYTE, n: number): number {
    return ((x >> n) & 1)
}

function drawPixelFromVRAM (addr: VRAMAddr, map: RGB[]) {}
