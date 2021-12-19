import { PPU } from "."
import type { BIT, UINT16, UINT8 } from "../public.def"

class FlagReg {
    value: BIT[] = Array(8).fill(0)
    constructor () {}
    set (data: UINT8) {
        this.value = data.toString(2).split('').reverse().map(e => parseInt(e))
    }
    get (): UINT8 {
        return parseInt(this.value.reverse().map(e => e.toString()).join(''), 2)
    }
    updateBit (i: number, data: number) {
        this.value[i] = data
    }
}

class SingleWriteReg {
    value: UINT8 = 0
    constructor () {}
    set (data: UINT8) {
        this.value = data
    }
    get (): UINT8 {
        return this.value
    }
    inc (n = 1) {
        let sum = this.value + n
        this.value = sum & 0xff
    }
}

class DoubleWriteReg {
    // [high, low]
    value: UINT8[] = [0, 0]
    sethi: boolean = true
    constructor () {}
    set (data: UINT16) {
        this.value[0] = data >> 8
        this.value[1] = data & 0xff
    }
    get (): UINT16 {
        return (this.value[0] << 8) | this.value[1]
    }
    updateByte (data: UINT8) {
        if (this.sethi) {
            this.value[0] = data
        } else {
            this.value[1] = data
        }
        this.sethi = !this.sethi
    }
    inc (n: UINT8) {
        let sum = this.value[1] + n
        this.value[1] = sum & 0xff
        if (sum > this.value[1]) {
            this.value[0] = (this.value[0] + 1) & 0xff
        }
    }
    reset () {
        this.sethi = true
    }
}


// 0x2000 write
export class REG_Controller extends FlagReg {
    ppu: PPU
    constructor (ppu: PPU) {
        super()
        this.ppu = ppu
    }
    get nametable (): UINT16 {
        const n = (this.value[1] << 1) | this.value[0]
        switch (n) {
            case 0: return 0x2000
            case 1: return 0x2400
            case 2: return 0x2800
            case 3: return 0x2c00
        }
    }
    get vramAddrInc (): UINT8 {
        return this.value[2] ? 32 : 1
    }
    set vramAddrInc (v: UINT8) {
        this.value[2] = v === 32 ? 1 : 0
    }
    get spriteAddr (): UINT16 {
        return this.value[3] ? 0x1000 : 0
    }
    set spriteAddr (v: UINT16) {
        this.value[3] = v === 0x1000 ? 1 : 0
    }
    get backgroundAddr (): UINT16 {
        return this.value[4] ? 0x1000 : 0
    }
    set backgroundAddr (v: UINT16) {
        this.value[4] = v === 0x1000 ? 1 : 0
    }
    get spriteSize (): number {
        return this.value[5] ? 8 * 16 : 8 * 8
    }
    set spriteSize (v: number) {
        this.value[5] = v === 8 * 16 ? 1 : 0
    }
    get ppuSelect (): BIT {
        return this.value[6]
    }
    set ppuSelect (v: BIT) {
        this.value[6] = v
    }
    get hasNMI (): boolean {
        return !!this.value[7]
    }
    set hasNMI (v: boolean) {
        const before = this.value[7]
        this.value[7] = +v
        if (!before && v && this.ppu.regStatus.inVblank) {
            this.ppu.IR_NMI()
        }
    }
}

// 0x2001 write
export class REG_Mask extends FlagReg {
    constructor () {
        super()
    }
    get greyscale (): boolean {
        return !!this.value[0]
    }
    get showBgInLeftmost (): boolean {
        return !!this.value[1]
    }
    get showSpritesInLeftmost (): boolean {
        return !!this.value[2]
    }
    get showBg (): boolean {
        return !!this.value[3]
    }
    get showSprites (): boolean {
        return !!this.value[4]
    }
    get emRed (): boolean {
        return !!this.value[5]
    }
    get emGreen (): boolean {
        return !!this.value[6]
    }
    get emBlue (): boolean {
        return !!this.value[7]
    }
}

// 0x2002 read
export class REG_Status extends FlagReg {
    constructor () {
        super()
    }
    get spriteOverflow (): boolean {
        return !!this.value[5]
    }
    set spriteOverflow (v: boolean) {
        this.value[5] = +v
    }
    get sprite0Hit (): boolean {
        return !!this.value[6]
    }
    set sprite0Hit (v: boolean) {
        this.value[6] = +v
    }
    get inVblank (): boolean {
        return !!this.value[7]
    }
    set inVblank (v: boolean) {
        this.value[7] = +v
    } 
}

// 0x2003 write
export class REG_OAMAddress extends SingleWriteReg {
    constructor () {
        super ()
    }
}

// 0x2004 read/write
export class REG_OAMData extends SingleWriteReg {
    constructor () {
        super()
    }
}

// 0x2005 write*2
export class REG_Scroll extends DoubleWriteReg {
    constructor () {
        super()
    }
    get x (): number {
        return this.value[0]
    }
    get y (): number {
        return this.value[1]
    }
}

// 0x2006 write*2
export class REG_Address extends DoubleWriteReg {
    constructor () {
        super()
    }
}

// 0x2007 read/write
export class REG_Data extends SingleWriteReg {
    constructor () {
        super()
    }
}

// 0x4014 write
export class REG_OAMDMA extends SingleWriteReg {
    constructor () {
        super()
    }
}
