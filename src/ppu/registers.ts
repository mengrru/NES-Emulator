import { BIT, UINT16, UINT8 } from "../public.def"

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
}

class DoubleWriteReg {
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
    constructor () {
        super()
    }
    nametable (): UINT16 {
        const n = (this.value[1] << 1) | this.value[0]
        switch (n) {
            case 0: return 0x2000
            case 1: return 0x2400
            case 2: return 0x2800
            case 3: return 0x2c00
        }
    }
    vramAddrInc (): UINT8 {
        return this.value[2] ? 32 : 1
    }
    spriteAddr (): UINT16 {
        return this.value[3] ? 0x1000 : 0
    }
    backgroundAddr (): UINT16 {
        return this.value[4] ? 0x1000 : 0
    }
    spriteSize (): number {
        return this.value[5] ? 8 * 16 : 8 * 8
    }
    ppuSelect (): BIT {
        return this.value[6]
    }
    hasNMI (): boolean {
        return !!this.value[7]
    }
}

// 0x2001 write
export class REG_Mask extends FlagReg {
    constructor () {
        super()
    }
    greyscale (): boolean {
        return !!this.value[0]
    }
    showBgInLeftmost (): boolean {
        return !!this.value[1]
    }
    showSpritesInLeftmost (): boolean {
        return !!this.value[2]
    }
    showBg (): boolean {
        return !!this.value[3]
    }
    showSprites (): boolean {
        return !!this.value[4]
    }
    emRed (): boolean {
        return !!this.value[5]
    }
    emGreen (): boolean {
        return !!this.value[6]
    }
    emBlue (): boolean {
        return !!this.value[7]
    }
}

// 0x2002 read
export class REG_Status extends FlagReg {
    constructor () {
        super()
    }
    spriteOverflow (): boolean {
        return !!this.value[5]
    }
    sprite0Hit (): boolean {
        return !!this.value[6]
    }
    inVblank (): boolean {
        return !!this.value[7]
    }
}

// 0x2003 write
export class REG_OAMAddress extends SingleWriteReg {
    constructor () {
        super ()
    }
}

// 0x2006 write*2
export class REG_Address extends DoubleWriteReg {
    constructor () {
        super()
    }
}