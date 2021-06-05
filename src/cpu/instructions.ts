import { ADDRMODE, PS, ICPU, AddressingRes } from './cpu'
import { int8, uint16, isCorssPage } from './utils'

const setFlag = {
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
        const res = !!((m ^ r) & (n ^ r) & 0x80)
        PS.V = res ? 1 : 0
    },
    N:  function (PS: PS, value: number) {
        PS.N = (value & 128) >> 7
    },
}
// Register Memory
// return cycle
export const Instructions = {
    'ADC': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        // const operand = AddressingMode[mode](cpu, arg)
        const { operand } = addrRes
        const res = cpu.PS.C + operand + cpu.Register.A
        cpu.Register.A = res & 0xff

        setFlag.Z(cpu.PS, cpu.Register.A)
        setFlag.C(cpu.PS, res > 0xff)
        setFlag.N(cpu.PS, cpu.Register.A)
        setFlag.V(cpu.PS, cpu.Register.A, operand, res & 0xff)
        return 0
    },

    'SBC': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        addrRes.operand = ((~addrRes.operand) & 0xff) + 1
        Instructions.ADC(cpu, mode, addrRes)
        return 0
    },

    'AND': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        const res = cpu.Register.A & operand
        cpu.Register.A = res

        setFlag.Z(cpu.PS, cpu.Register.A)
        setFlag.N(cpu.PS, cpu.Register.A)
        return 0
    },

    'ASL': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand, addr } = addrRes
        const res = operand << 1
        // ?
        if (mode == 'AC') {
            cpu.Register.A = res & 0xff
        } else {
            cpu.memWrite(addr, res & 0xff)
        }
        setFlag.C(cpu.PS, res > 0xff)
        setFlag.Z(cpu.PS, cpu.Register.A)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'BCC': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.C === 0) {
            const res = uint16(cpu.Register.PC + int8(operand))
            cpu.Register.PC = res
            if (isCorssPage(cpu.Register.PC, oldPC)) {
                return 2
            } else {
                return 1
            }
        }
        return 0
    },

    'BCS': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.C === 1) {
            const res = uint16(cpu.Register.PC + int8(operand))
            cpu.Register.PC = res
            if (isCorssPage(cpu.Register.PC, oldPC)) {
                return 2
            } else {
                return 1
            }
        }
        return 0
    },

    'BEQ': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.Z === 1) {
            const res = uint16(cpu.Register.PC + int8(operand))
            cpu.Register.PC = res
            if (isCorssPage(cpu.Register.PC, oldPC)) {
                return 2
            } else {
                return 1
            }
        }
        return 0
    },

    'BIT': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        // ?
        const { operand } = addrRes
        setFlag.Z(cpu.PS, cpu.Register.A & operand)
        cpu.PS.V = (operand >> 6) & 1
        setFlag.N(cpu.PS, operand)
        return 0
    },

    'BMI': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.N === 1) {
            const res = uint16(cpu.Register.PC + int8(operand))
            cpu.Register.PC = res
            if (isCorssPage(cpu.Register.PC, oldPC)) {
                return 2
            } else {
                return 1
            }
        }
        return 0
    },
    
    'BNE': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.Z === 0) {
            const res = uint16(cpu.Register.PC + int8(operand))
            cpu.Register.PC = res
            if (isCorssPage(cpu.Register.PC, oldPC)) {
                return 2
            } else {
                return 1
            }
        }
        return 0
    },

    'BPL': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.N === 0) {
            const res = uint16(cpu.Register.PC + int8(operand))
            cpu.Register.PC = res
            if (isCorssPage(cpu.Register.PC, oldPC)) {
                return 2
            } else {
                return 1
            }
        }
        return 0
    },

    'BRK': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        // The program counter and processor status are pushed on the stack 
        cpu.push16(cpu.Register.PC)
        cpu.push8(cpu.Register.PS)
        // then the IRQ interrupt vector at $FFFE/F is loaded into the PC
        cpu.Register.PC = cpu.memRead(0xfffe, 2)
        // and the break flag in the status set to one
        setFlag.B(cpu.PS, 'BRK')
        return 0
    },

    'BVC': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.V === 0) {
            const res = uint16(cpu.Register.PC + int8(operand))
            cpu.Register.PC = res
            if (isCorssPage(cpu.Register.PC, oldPC)) {
                return 2
            } else {
                return 1
            }
        }
        return 0
    },

    'BVS': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.V === 1) {
            const res = uint16(cpu.Register.PC + int8(operand))
            cpu.Register.PC = res
            if (isCorssPage(cpu.Register.PC, oldPC)) {
                return 2
            } else {
                return 1
            }
        }
        return 0
    },

    'CLC': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        cpu.PS.C = 0
        return 0
    },

    'CLD': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        cpu.PS.D = 0
        return 0
    },

    'CLI': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        cpu.PS.I = 0
        return 0
    },

    'CLV': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        cpu.PS.V = 0
        return 0
    },

    'CMP': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        const r = cpu.Register.A
        setFlag.C(cpu.PS, r >= operand)
        setFlag.Z(cpu.PS, r - operand)
        setFlag.N(cpu.PS, r - operand)
        return 0
    },

    'CPX': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        const r = cpu.Register.X
        setFlag.C(cpu.PS, r >= operand)
        setFlag.Z(cpu.PS, r - operand)
        setFlag.N(cpu.PS, r - operand)
        return 0
    },

    'CPY': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        const r = cpu.Register.Y
        setFlag.C(cpu.PS, r >= operand)
        setFlag.Z(cpu.PS, r - operand)
        setFlag.N(cpu.PS, r - operand)
        return 0
    },

    'DEC': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { addr, operand } = addrRes
        const res = (operand - 1) & 0xff
        cpu.memWrite(addr, res)
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'DEX': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        // const res = (cpu.Register.X - 1) & 0xff
        const res = cpu.Register.X - 1
        cpu.Register.X = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'DEY': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = (cpu.Register.Y - 1) & 0xff
        cpu.Register.Y = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'INC': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { addr, operand } = addrRes
        const res = (operand + 1) & 0xff
        cpu.memWrite(addr, res)
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'INX': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = (cpu.Register.X + 1) & 0xff
        cpu.Register.X = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'INY': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = (cpu.Register.Y + 1) & 0xff
        cpu.Register.Y = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'EOR': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        const res = cpu.Register.A ^ operand
        cpu.Register.A = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'JMP': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { addr } = addrRes
        cpu.Register.PC = addr
        return 0
    },

    'JSR': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { addr } = addrRes
        cpu.push16(cpu.Register.PC - 1)
        cpu.Register.PC = addr
        return 0
    },

    'RTS': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        cpu.Register.PC = uint16(cpu.pull16() + 1)
        console.log('RTS:' + cpu.Register.PC.toString(16))
        return 0
    },

    'LDA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        cpu.Register.A = operand
        setFlag.Z(cpu.PS, cpu.Register.A)
        setFlag.N(cpu.PS, cpu.Register.A)
        return 0
    },

    'LDX': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        cpu.Register.X = operand
        setFlag.Z(cpu.PS, cpu.Register.X)
        setFlag.N(cpu.PS, cpu.Register.X)
        return 0
    },

    'LDY': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        cpu.Register.Y = operand
        setFlag.Z(cpu.PS, cpu.Register.Y)
        setFlag.N(cpu.PS, cpu.Register.Y)
        return 0
    },

    'LSR': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { addr, operand } = addrRes
        const res = operand >> 1
        if (mode === 'AC') {
            cpu.Register.A = res
        } else {
            cpu.memWrite(addr, res)
        }
        cpu.PS.C = operand & 1
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'NOP': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        return 0
    },

    'ORA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { operand } = addrRes
        const res = cpu.Register.A | operand
        cpu.Register.A = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'PHA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        cpu.push8(cpu.Register.A)
        return 0
    },

    'PHP': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        cpu.push8(cpu.Register.PS)
        return 0
    },

    'PLA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = cpu.pull8()
        cpu.Register.A = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'PLP': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = cpu.pull8()
        cpu.Register.PS = res
        return 0
    },

    'ROL': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { addr, operand } = addrRes
        const res = (operand << 1) | cpu.PS.C
        if (mode === 'AC') {
            cpu.Register.A = res & 0xff
        } else {
            cpu.memWrite(addr, res & 0xff)
        }
        setFlag.C(cpu.PS, (operand & 128) > 0)
        // ? only acc or all
        setFlag.Z(cpu.PS, res & 0xff)
        setFlag.N(cpu.PS, res & 0xff)
        return 0
    },

    'ROR': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { addr, operand } = addrRes
        const res = (operand >> 1) | (cpu.PS.C << 7)
        if (mode === 'AC') {
            cpu.Register.A = res & 0xff
        } else {
            cpu.memWrite(addr, res & 0xff)
        }
        setFlag.C(cpu.PS, (operand & 1) > 0)
        // ? only acc or all
        setFlag.Z(cpu.PS, res & 0xff)
        setFlag.N(cpu.PS, res & 0xff)
        return 0
    },

    'RTI': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        // ?
        cpu.Register.PS = cpu.pull8()
        cpu.Register.PC = cpu.pull16()
        return 0
    },

    'SEC': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        cpu.PS.C = 1
        return 0
    },

    'SED': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        cpu.PS.D = 1
        return 0
    },

    'SEI': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        cpu.PS.I = 1
        return 0
    },

    'STA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { addr } = addrRes
        cpu.memWrite(addr, cpu.Register.A)
        return 0
    },

    'STX': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { addr } = addrRes
        cpu.memWrite(addr, cpu.Register.X)
        return 0
    },

    'STY': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { addr } = addrRes
        cpu.memWrite(addr, cpu.Register.Y)
        return 0
    },

    'TAX': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = cpu.Register.A
        cpu.Register.X = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'TAY': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = cpu.Register.A
        cpu.Register.Y = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'TSX': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = cpu.Register.SP
        cpu.Register.X = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'TXA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = cpu.Register.X
        cpu.Register.A = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'TXS': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        cpu.Register.SP = cpu.Register.X
        return 0
    },

    'TYA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = cpu.Register.Y
        cpu.Register.A = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    }

} as {
    [instruction: string]: (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) => number
}