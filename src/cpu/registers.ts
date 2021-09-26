import { PS } from "./cpu"

export const setFlag = {
    C: function (PS: PS, value: boolean) {
        PS.C = value ? 1 : 0
    },
    Z: function (PS: PS, value: number) {
        PS.Z = value === 0 ? 1 : 0
    },
    I:  function (PS: PS, value: number) {
        PS.I = value
    },
    D:  function (PS: PS, value: number) {
        PS.D = value
    },
    // 2-bits
    // bit5, bit4
    B:  function (PS: PS, action: string) {
        const bit4 = (function (a: string) {
            switch (a) {
                case 'PHP':
                case 'BRK':
                    return 1
                case 'IRQ':
                case 'NMI':
                case 'PLP':
                    return 0
            }
            return 0
        })(action)
        const bit5 = 1
        PS.B = (bit5 << 1) | bit4
    },
    V:  function (PS: PS, m: number, n: number, r: number) {
        // ?
        // overflow occurs if
        // (m ^ r) & (n ^ r) & 0x80 is nonzero
        // const res = !!((m ^ r) & (n ^ r) & 0x80)
        // reference to https://github.com/skilldrick/easy6502/blob/gh-pages/simulator/assembler.js
        const res = !!((m ^ n) & 0x80)
        PS.V = res ? 1 : 0
    },
    N:  function (PS: PS, value: number) {
        PS.N = (value & 128) >> 7
    },
}

export function Registers (PS: PS) {
    return {
        PC: 0x0000,
        // between 0x0100 and 0x01ff
        SP: 0xff,
        A: 0x00,
        X: 0x00,
        Y: 0x00,
        get PS () {
            return PS.C & 1 |
                (PS.Z << 1) & 2 |
                (PS.I << 2) & 4 |
                (PS.D << 3) & 8 |
                (PS.B << 4) & (16 + 32) |
                (PS.V << 6) & 64 |
                (PS.N << 7) & 128
        },
        set PS (v) {
            PS.C = v & 1
            PS.Z = (v & 2) >> 1
            PS.I = (v & 4) >> 2
            PS.D = (v & 8) >> 3
            PS.B = (v & (16 + 32)) >> 4
            PS.V = (v & 64) >> 6
            PS.N = (v & 128) >> 7
        }
    }
}

export function ProcessorStatus () {
    return {
        C: 0,
        Z: 0,
        I: 0,
        D: 0,
        // ?
        B: 0b11,
        V: 0,
        N: 0
    }
}