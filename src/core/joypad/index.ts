import type {UINT8} from "../public.def"

export enum Btn {
    A        = 0b00000001,
    B        = 0b00000010,
    Select   = 0b00000100,
    Start    = 0b00001000,
    Up       = 0b00010000,
    Down     = 0b00100000,
    Left     = 0b01000000,
    Right    = 0b10000000,
}
export default class JoyPad {
    strobe: boolean = false
    btn: Btn = Btn.A
    curReportedBtn: number = 0

    constructor () {
        //this.initUI()
    }

    write (data: UINT8) {
        this.strobe = (data & 1) === 1
        if (this.strobe) {
            this.curReportedBtn = 0
        }
    }
    read (): UINT8 {
        // after 8 bits are read, all subsequent bits will report 1
        // on a standard NES controller.
        if (this.curReportedBtn > 7) {
            return 1
        }
        const res = (this.btn & (1 << this.curReportedBtn)) >> this.curReportedBtn
        if (!this.strobe && this.curReportedBtn <= 7) {
            this.curReportedBtn += 1
        }
        return res
    }
    setBtn (btn: Btn) {
        this.btn = btn
    }
    initUI () {
        document.onkeydown = (event) => {
            switch (event.code.toLowerCase()) {
                case 'keya':
                    this.setBtn(Btn.Left)
                    break
                case 'keyd':
                    this.setBtn(Btn.Right)
                    break
                case 'keys':
                    this.setBtn(Btn.Down)
                    break
                case 'keyw':
                    this.setBtn(Btn.Up)
                    break
                case 'keyj':
                    this.setBtn(Btn.A)
                    break
                case 'keyk':
                    this.setBtn(Btn.B)
                    break
                case 'enter':
                    this.setBtn(Btn.Select)
                    break
                case 'space':
                    this.setBtn(Btn.Start)
                    break
            }
        }
    }
}
