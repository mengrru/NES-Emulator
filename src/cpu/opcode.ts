import { ADDRMODE } from "./cpu.d"

const e = function (name: string, opcode: number, bytes: number, cycles: number, pageCycles: number, mode: keyof ADDRMODE) {
    return {
        name, opcode, bytes, cycles, mode, pageCycles
    }
}

export default {
    0x69: e('ADC', 0x69, 2, 2, 0, 'I'),
    0x65: e('ADC', 0x65, 2, 3, 0, 'Z'),
    0x75: e('ADC', 0x75, 2, 4, 0, 'ZX'),
    0x6d: e('ADC', 0x6d, 3, 4, 0, 'A'),
    0x7d: e('ADC', 0x7d, 3, 4, 1, 'AX'),
    0x79: e('ADC', 0x79, 3, 4, 1, 'AY'),
    0x61: e('ADC', 0x61, 2, 6, 0, 'IX'),
    0x71: e('ADC', 0x71, 2, 5, 1, 'IY'),

    0x29: e('AND', 0x29, 2, 2, 0, 'I'),
    0x25: e('AND', 0x25, 2, 3, 0, 'Z'),
    0x35: e('AND', 0x35, 2, 4, 0, 'ZX'),
    0x2d: e('AND', 0x2d, 3, 4, 0, 'A'),
    0x3d: e('AND', 0x3d, 3, 4, 1, 'AX'),
    0x39: e('AND', 0x39, 3, 4, 1, 'AY'),
    0x21: e('AND', 0x21, 2, 6, 0, 'IX'),
    0x31: e('AND', 0x31, 2, 5, 1, 'IY'),

    0x0a: e('ASL', 0x0a, 1, 2, 0, 'AC'),
    0x06: e('ASL', 0x06, 2, 5, 0, 'Z'),
    0x16: e('ASL', 0x16, 2, 6, 0, 'ZX'),
    0x0e: e('ASL', 0x0e, 3, 6, 0, 'A'),
    0x1e: e('ASL', 0x1e, 3, 7, 0, 'AX'),

    0x90: e('BCC', 0x90, 2, 2, 0, 'R'),

    0xb0: e('BCS', 0xb0, 2, 2, 0, 'R'),

    0xf0: e('BEQ', 0xf0, 2, 2, 0, 'R'),

    0x24: e('BIT', 0x24, 2, 3, 0, 'Z'),
    0x2c: e('BIT', 0x2c, 3, 4, 0, 'A'),

    0x30: e('BMI', 0x30, 2, 2, 0, 'R'),

    0xd0: e('BNE', 0xd0, 2, 2, 0, 'R'),

    0x10: e('BPL', 0x10, 2, 2, 0, 'R'),

    0x00: e('BRK', 0x00, 1, 7, 0, 'IM'),

    0x50: e('BVC', 0x50, 2, 2, 0, 'R'),

    0x70: e('BVS', 0x70, 2, 2, 0, 'R'),

    0x18: e('CLC', 0x18, 1, 2, 0, 'IM'),

    0xd8: e('CLD', 0xd8, 1, 2, 0, 'IM'),

    0x58: e('CLI', 0x58, 1, 2, 0, 'IM'),

    0xb8: e('CLV', 0xb8, 1, 2, 0, 'IM'),

    0xc9: e('CMP', 0xc9, 2, 2, 0, 'I'),
    0xc5: e('CMP', 0xc5, 2, 3, 0, 'Z'),
    0xd5: e('CMP', 0xd5, 2, 4, 0, 'ZX'),
    0xcd: e('CMP', 0xcd, 3, 4, 0, 'A'),
    0xdd: e('CMP', 0xdd, 3, 4, 1, 'AX'),
    0xd9: e('CMP', 0xd9, 3, 4, 1, 'AY'),
    0xc1: e('CMP', 0xc1, 2, 6, 0, 'IX'),
    0xd1: e('CMP', 0xd1, 2, 5, 1, 'IY'),

    0xe0: e('CPX', 0xe0, 2, 2, 0, 'I'),
    0xe4: e('CPX', 0xe4, 2, 3, 0, 'Z'),
    0xec: e('CPX', 0xec, 3, 4, 0, 'A'),

    0xc0: e('CPY', 0xc0, 2, 2, 0, 'I'),
    0xc4: e('CPY', 0xc4, 2, 3, 0, 'Z'),
    0xcc: e('CPY', 0xcc, 3, 4, 0, 'A'),

    0xc6: e('DEC', 0xc6, 2, 5, 0, 'Z'),
    0xd6: e('DEC', 0xd6, 2, 6, 0, 'ZX'),
    0xce: e('DEC', 0xce, 3, 6, 0, 'A'),
    0xde: e('DEC', 0xde, 3, 7, 0, 'AX'),

    0xca: e('DEX', 0xca, 1, 2, 0, 'IM'),

    0x88: e('DEY', 0x88, 1, 2, 0, 'IM'),

    0x49: e('EOR', 0x49, 2, 2, 0, 'I'),
    0x45: e('EOR', 0x45, 2, 3, 0, 'Z'),
    0x55: e('EOR', 0x55, 2, 4, 0, 'ZX'),
    0x4d: e('EOR', 0x4d, 3, 4, 0, 'A'),
    0x5d: e('EOR', 0x5d, 3, 4, 1, 'AX'),
    0x59: e('EOR', 0x59, 3, 4, 1, 'AY'),
    0x41: e('EOR', 0x41, 2, 6, 0, 'IX'),
    0x51: e('EOR', 0x51, 2, 5, 1, 'IY'),

    0xe6: e('INC', 0xe6, 2, 5, 0, 'Z'),
    0xf6: e('INC', 0xf6, 2, 6, 0, 'ZX'),
    0xee: e('INC', 0xee, 3, 6, 0, 'A'),
    0xfe: e('INC', 0xfe, 3, 7, 0, 'AX'),

    0xe8: e('INX', 0xe8, 1, 2, 0, 'IM'),

    0xc8: e('INY', 0xc8, 1, 2, 0, 'IM'),

    0x4c: e('JMP', 0x4c, 3, 3, 0, 'A'),
    0x6c: e('JMP', 0x6c, 3, 5, 0, 'IN'),

    0x20: e('JSR', 0x20, 3, 6, 0, 'A'),

    0xa9: e('LDA', 0xa9, 2, 2, 0, 'I'),
    0xa5: e('LDA', 0xa5, 2, 3, 0, 'Z'),
    0xb5: e('LDA', 0xb5, 2, 4, 0, 'ZX'),
    0xad: e('LDA', 0xad, 3, 4, 0, 'A'),
    0xbd: e('LDA', 0xbd, 3, 4, 1, 'AX'),
    0xb9: e('LDA', 0xb9, 3, 4, 1, 'AY'),
    0xa1: e('LDA', 0xa1, 2, 6, 0, 'IX'),
    0xb1: e('LDA', 0xb1, 2, 5, 1, 'IY'),

    0xa2: e('LDX', 0xa2, 2, 2, 0, 'I'),
    0xa6: e('LDX', 0xa6, 2, 3, 0, 'Z'),
    0xb6: e('LDX', 0xb6, 2, 4, 0, 'ZY'),

    0xa0: e('LDY', 0xa0, 2, 2, 0, 'I'),
    0xa4: e('LDY', 0xa4, 2, 3, 0, 'Z'),
    0xb4: e('LDY', 0xb4, 2, 4, 0, 'ZX'),
    0xac: e('LDY', 0xac, 3, 4, 0, 'A'),
    0xbc: e('LDY', 0xbc, 3, 4, 1, 'AX'),

    0x4a: e('LSR', 0x4a, 1, 2, 0, 'AC'),
    0x46: e('LSR', 0x46, 2, 5, 0, 'Z'),
    0x56: e('LSR', 0x56, 2, 6, 0, 'ZX'),
    0x4e: e('LSR', 0x4e, 3, 6, 0, 'A'),
    0x5e: e('LSR', 0x5e, 3, 7, 0, 'AX'),

    0xea: e('NOP', 0xea, 1, 2, 0, 'IM'),

    0x09: e('ORA', 0x09, 2, 2, 0, 'I'),
    0x05: e('ORA', 0x05, 2, 3, 0, 'Z'),
    0x15: e('ORA', 0x15, 2, 4, 0, 'ZX'),
    0x0d: e('ORA', 0x0d, 3, 4, 0, 'A'),
    0x1d: e('ORA', 0x1d, 3, 4, 1, 'AX'),
    0x19: e('ORA', 0x19, 3, 4, 1, 'AY'),
    0x01: e('ORA', 0x01, 2, 6, 0, 'IX'),
    0x11: e('ORA', 0x11, 2, 5, 1, 'IY'),

    0x48: e('PHA', 0x48, 1, 3, 0, 'IM'),

    0x08: e('PHP', 0x08, 1, 3, 0, 'IM'),

    0x68: e('PLA', 0x68, 1, 4, 0, 'IM'),

    0x28: e('PLP', 0x28, 1, 4, 0, 'IM'),

    0x2a: e('ROL', 0x2a, 1, 2, 0, 'AC'),
    0x26: e('ROL', 0x26, 2, 5, 0, 'Z'),
    0x36: e('ROL', 0x36, 2, 6, 0, 'ZX'),
    0x2e: e('ROL', 0x2e, 3, 6, 0, 'A'),
    0x3e: e('ROL', 0x3e, 3, 7, 0, 'AX'),

    0x6a: e('ROR', 0x6a, 1, 2, 0, 'AC'),
    0x66: e('ROR', 0x66, 2, 5, 0, 'Z'),
    0x76: e('ROR', 0x76, 2, 6, 0, 'ZX'),
    0x6e: e('ROR', 0x6e, 3, 6, 0, 'A'),
    0x7e: e('ROR', 0x7e, 3, 7, 0, 'AX'),

    0x40: e('RTI', 0x40, 1, 6, 0, 'IM'),

    0x60: e('RTS', 0x60, 1, 6, 0, 'IM'),

    0xe9: e('SBC', 0xe9, 2, 2, 0, 'I'),
    0xe5: e('SBC', 0xe5, 2, 3, 0, 'Z'),
    0xf5: e('SBC', 0xf5, 2, 4, 0, 'ZX'),
    0xed: e('SBC', 0xed, 3, 4, 0, 'A'),
    0xfd: e('SBC', 0xfd, 3, 4, 1, 'AX'),
    0xf9: e('SBC', 0xf9, 3, 4, 1, 'AY'),
    0xe1: e('SBC', 0xe1, 2, 6, 0, 'IX'),
    0xf1: e('SBC', 0xf1, 2, 5, 1, 'IY'),

    0x38: e('SEC', 0x38, 1, 2, 0, 'IM'),

    0xf8: e('SED', 0xf8, 1, 2, 0, 'IM'),

    0x78: e('SEI', 0x78, 1, 2, 0, 'IM'),

    0x85: e('STA', 0x85, 2, 3, 0, 'Z'),
    0x95: e('STA', 0x95, 2, 4, 0, 'ZX'),
    0x8d: e('STA', 0x8d, 3, 4, 0, 'A'),
    0x9d: e('STA', 0x9d, 3, 5, 0, 'AX'),
    0x99: e('STA', 0x99, 3, 5, 0, 'AY'),
    0x81: e('STA', 0x81, 2, 6, 0, 'IX'),
    0x91: e('STA', 0x91, 2, 6, 0, 'IY'),

    0x86: e('STX', 0x86, 2, 3, 0, 'Z'),
    0x96: e('STX', 0x96, 2, 4, 0, 'ZY'),
    0x8e: e('STX', 0x8e, 3, 4, 0, 'A'),

    0x84: e('STY', 0x84, 2, 3, 0, 'Z'),
    0x94: e('STY', 0x94, 2, 4, 0, 'ZX'),
    0x8c: e('STY', 0x8c, 3, 4, 0, 'A'),

    0xaa: e('TAX', 0xaa, 1, 2, 0, 'IM'),

    0xa8: e('TAY', 0xa8, 1, 2, 0, 'IM'),

    0xba: e('TSX', 0xba, 1, 2, 0, 'IM'),

    0x8a: e('TXA', 0x8a, 1, 2, 0, 'IM'),

    0x9a: e('TXS', 0x9a, 1, 2, 0, 'IM'),

    0x98: e('TYA', 0x98, 1, 2, 0, 'IM')
} as {
    [opc: number]: {
        name: string,
        opcode: number,
        bytes: number,
        cycles: number,
        pageCycles: number,
        mode: keyof ADDRMODE
    }
}