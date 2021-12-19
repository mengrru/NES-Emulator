import {PPU} from "./index";

const Scanline = {
    Each: [0, 261],
    PreRender: 261,
    Visible: [0, 239],
    PostRender: 240,
    VerticalBlanking: [241, 260]
}

export default class PPUTiming {
    private t = Array.from(Array(262)).map(e => Array.from(Array(341)).map(e => []))
    private ppu: PPU

    constructor (ppu: PPU) {
        this.ppu = ppu

        this.init()
    }

    exec (scanline: number, cycle: number) {
        this.t[scanline][cycle].forEach(f => f())
    }

    private init () {
        this.setAction(Scanline.Each, 340, () => {
            if (this.ppu.isSprite0Hit) {
                this.ppu.regStatus.sprite0Hit = true
            }
        })
        this.setAction(240, 0, () => {
            this.ppu.frame()
        })
        this.setAction(241, 340, () => {
            this.ppu.regStatus.inVblank = true
            this.ppu.regStatus.sprite0Hit = false
            if (this.ppu.regController.hasNMI) {
                this.ppu.IR_NMI()
            }
        })
        this.setAction(261, 1, () => {
            this.ppu.regStatus.inVblank = false
            this.ppu.regStatus.sprite0Hit = false
        })
        this.setAction(Scanline.Each, 256, () => {
            if (this.ppu.renderingEnable) {
                this.ppu.v++
            }
        })
        this.setAction(Scanline.Each, 257, () => {
            if (this.ppu.renderingEnable) {
                this.ppu.v &= 0b111_1011_1110_0000
                this.ppu.v |= (this.ppu.t & 0b000_0100_0001_1111)
            }
        })
        this.setAction(Scanline.PreRender, [280, 304], () => {
            if (this.ppu.renderingEnable) {
                this.ppu.v &= 0b000_0100_0001_1111
                this.ppu.v |= (this.ppu.t & 0b111_1011_1110_0000)
            }
        })
        this.setAction(Scanline.Each, [328, 340], () => {
        })
        this.setAction(Scanline.Each, [0, 256], () => {})
    }

    private setAction (scanline: number | number[], cycle: number | number[], action: () => void) {
        if (typeof scanline === 'number' && typeof cycle === 'number') {
            this.t[scanline][cycle].push(action)
        } else if (Array.isArray(scanline) && Array.isArray(cycle)) {
            for (let i = scanline[0]; i <= scanline[1]; i++) {
                for (let j = cycle[0]; j <= cycle[1]; j++) {
                    this.t[i][j].push(action)
                }
            }
        } else if (Array.isArray(scanline)) {
            for (let i = scanline[0]; i <= scanline[1]; i++) {
                this.t[i][cycle as number].push(action)
            }
        } else if (Array.isArray(cycle)){
            for (let i = cycle[0]; i <= cycle[1]; i++) {
                this.t[scanline][i].push(action)
            }
        }
    }

}
