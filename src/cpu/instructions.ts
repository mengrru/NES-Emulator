import { ADDRMODE, PS, ICPU, AddressingRes } from './cpu.d'
import { setFlag } from './registers'
import { int8, uint16, isCrossPage } from './utils'

// Register Memory
// return cycle
export const Instructions = {
    'ADC': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        // const data = AddressingMode[mode](cpu, arg)
        const { data } = addrRes
        const res = cpu.PS.C + data + cpu.Register.A
        cpu.Register.A = res & 0xff

        setFlag.Z(cpu.PS, cpu.Register.A)
        setFlag.C(cpu.PS, res > 0xff)
        setFlag.N(cpu.PS, cpu.Register.A)
        setFlag.V(cpu.PS, cpu.Register.A, data, res & 0xff)

        if (mode === 'AX' || mode === 'AY' || mode === 'IY') {
            return 1
        }
        return 0
    },

    'SBC': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        addrRes.data = ((~addrRes.data) & 0xff)// + 1
        Instructions.ADC(cpu, mode, addrRes)

        if (mode === 'AX' || mode === 'AY' || mode === 'IY') {
            return 1
        }
        return 0
    },

    'AND': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data } = addrRes
        const res = cpu.Register.A & data
        cpu.Register.A = res

        setFlag.Z(cpu.PS, cpu.Register.A)
        setFlag.N(cpu.PS, cpu.Register.A)

        if (mode === 'AX' || mode === 'AY' || mode === 'IY') {
            return 1
        }
        return 0
    },

    'ASL': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data, addr } = addrRes
        const res = data << 1
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
        const { data } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.C === 0) {
            const res = uint16(cpu.Register.PC + int8(data))
            cpu.Register.PC = res
            if (isCrossPage(cpu.Register.PC, oldPC)) {
                return 2
            } else {
                return 1
            }
        }
        return 0
    },

    'BCS': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.C === 1) {
            const res = uint16(cpu.Register.PC + int8(data))
            cpu.Register.PC = res
            if (isCrossPage(cpu.Register.PC, oldPC)) {
                return 2
            } else {
                return 1
            }
        }
        return 0
    },

    'BEQ': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.Z === 1) {
            const res = uint16(cpu.Register.PC + int8(data))
            cpu.Register.PC = res
            if (isCrossPage(cpu.Register.PC, oldPC)) {
                return 2
            } else {
                return 1
            }
        }
        return 0
    },

    'BIT': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data } = addrRes
        setFlag.Z(cpu.PS, cpu.Register.A & data)
        cpu.PS.V = (data >> 6) & 1
        setFlag.N(cpu.PS, data)
        return 0
    },

    'BMI': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.N === 1) {
            const res = uint16(cpu.Register.PC + int8(data))
            cpu.Register.PC = res
            if (isCrossPage(cpu.Register.PC, oldPC)) {
                return 2
            } else {
                return 1
            }
        }
        return 0
    },
    
    'BNE': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.Z === 0) {
            const res = uint16(cpu.Register.PC + int8(data))
            cpu.Register.PC = res
            if (isCrossPage(cpu.Register.PC, oldPC)) {
                return 2
            } else {
                return 1
            }
        }
        return 0
    },

    'BPL': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.N === 0) {
            const res = uint16(cpu.Register.PC + int8(data))
            cpu.Register.PC = res
            if (isCrossPage(cpu.Register.PC, oldPC)) {
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
        const { data } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.V === 0) {
            const res = uint16(cpu.Register.PC + int8(data))
            cpu.Register.PC = res
            if (isCrossPage(cpu.Register.PC, oldPC)) {
                return 2
            } else {
                return 1
            }
        }
        return 0
    },

    'BVS': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data } = addrRes
        const oldPC = cpu.Register.PC
        if (cpu.PS.V === 1) {
            const res = uint16(cpu.Register.PC + int8(data))
            cpu.Register.PC = res
            if (isCrossPage(cpu.Register.PC, oldPC)) {
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
        const { data } = addrRes
        const r = cpu.Register.A
        setFlag.C(cpu.PS, r >= data)
        setFlag.Z(cpu.PS, r - data)
        setFlag.N(cpu.PS, r - data)

        if (mode === 'AX' || mode === 'AY' || mode === 'IY') {
            return 1
        }
        return 0
    },

    'CPX': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data } = addrRes
        const r = cpu.Register.X
        setFlag.C(cpu.PS, r >= data)
        setFlag.Z(cpu.PS, r - data)
        setFlag.N(cpu.PS, r - data)
        return 0
    },

    'CPY': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data } = addrRes
        const r = cpu.Register.Y
        setFlag.C(cpu.PS, r >= data)
        setFlag.Z(cpu.PS, r - data)
        setFlag.N(cpu.PS, r - data)
        return 0
    },

    'DEC': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { addr, data } = addrRes
        const res = (data - 1) & 0xff
        cpu.memWrite(addr, res)
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'DEX': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = (cpu.Register.X - 1) & 0xff
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
        const { addr, data } = addrRes
        const res = (data + 1) & 0xff
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
        const { data } = addrRes
        const res = cpu.Register.A ^ data
        cpu.Register.A = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)

        if (mode === 'AX' || mode === 'AY' || mode === 'IY') {
            return 1
        }
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
        // console.log('RTS:' + cpu.Register.PC.toString(16))
        return 0
    },

    'LDA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data } = addrRes
        cpu.Register.A = data
        setFlag.Z(cpu.PS, cpu.Register.A)
        setFlag.N(cpu.PS, cpu.Register.A)

        if (mode === 'AX' || mode === 'AY' || mode === 'IY') {
            return 1
        }
        return 0
    },

    'LDX': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data } = addrRes
        cpu.Register.X = data
        setFlag.Z(cpu.PS, cpu.Register.X)
        setFlag.N(cpu.PS, cpu.Register.X)

        if (mode === 'AY') {
            return 1
        }
        return 0
    },

    'LDY': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data } = addrRes
        cpu.Register.Y = data
        setFlag.Z(cpu.PS, cpu.Register.Y)
        setFlag.N(cpu.PS, cpu.Register.Y)

        if (mode === 'AX') {
            return 1
        }
        return 0
    },

    'LSR': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { addr, data } = addrRes
        const res = data >> 1
        if (mode === 'AC') {
            cpu.Register.A = res
        } else {
            cpu.memWrite(addr, res)
        }
        cpu.PS.C = data & 1
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'NOP': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        return 0
    },

    'ORA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { data } = addrRes
        const res = cpu.Register.A | data
        cpu.Register.A = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)

        if (mode === 'AX' || mode === 'AY' || mode === 'IY') {
            return 1
        }
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
        const { addr, data } = addrRes
        const res = (data << 1) | cpu.PS.C
        if (mode === 'AC') {
            cpu.Register.A = res & 0xff
        } else {
            cpu.memWrite(addr, res & 0xff)
        }
        setFlag.C(cpu.PS, (data & 128) > 0)
        // ? only acc or all
        setFlag.Z(cpu.PS, res & 0xff)
        setFlag.N(cpu.PS, res & 0xff)
        return 0
    },

    'ROR': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const { addr, data } = addrRes
        const res = (data >> 1) | (cpu.PS.C << 7)
        if (mode === 'AC') {
            cpu.Register.A = res & 0xff
        } else {
            cpu.memWrite(addr, res & 0xff)
        }
        setFlag.C(cpu.PS, (data & 1) > 0)
        // ? only acc or all
        setFlag.Z(cpu.PS, res & 0xff)
        setFlag.N(cpu.PS, res & 0xff)
        return 0
    },

    'RTI': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        // ?
        cpu.Register.PS = cpu.pull8()
        setFlag.B(cpu.PS, 'IRQ')
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
    },

    /* unofficial */
    'AAC': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        Instructions.AND(cpu, mode, addrRes)
        if (cpu.Register.A >> 7 !== 0) {
            setFlag.C(cpu.PS, true)
        }
        return 0
    },

    'AAX': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = cpu.Register.X & cpu.Register.A
        cpu.memWrite(addrRes.addr, res)
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'ARR': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        Instructions.AND(cpu, 'I', addrRes)
        Instructions.ROR(cpu, 'AC', { addr: -1, data: cpu.Register.A})
        const bit5 = (cpu.Register.A >> 4) & 1
        const bit6 = (cpu.Register.A >> 5) & 1
        setFlag.C(cpu.PS, bit6 === 1)
        cpu.PS.V = bit5 ^ bit6
        return 0
    },

    'ASR': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        Instructions.AND(cpu, mode, addrRes)
        Instructions.LSR(cpu, 'AC', { addr: -1, data: cpu.Register.A })
        return 0
    },

    'ATX': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = cpu.Register.A & addrRes.data
        cpu.Register.A = res
        cpu.Register.X = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        return 0
    },

    'AXA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = cpu.Register.X & cpu.Register.A
        cpu.Register.A = res
        cpu.memWrite(addrRes.addr, res & 7)
        return 0
    },

    'AXS': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        Instructions.STX(cpu, mode, addrRes)
        Instructions.PHA(cpu, mode, addrRes)
        Instructions.AND(cpu, mode, addrRes)
        Instructions.STA(cpu, mode, addrRes)
        Instructions.PLA(cpu, mode, addrRes)
        return 0
    },

    'DCP': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        Instructions.DEC(cpu, mode, addrRes)
        Instructions.CMP(cpu, mode, addrRes)
        return 0
    },

    'DOP': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        Instructions.NOP(cpu, mode, addrRes)
        Instructions.NOP(cpu, mode, addrRes)
        return 0
    },

    'ISC': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        Instructions.INC(cpu, mode, addrRes)
        Instructions.SBC(cpu, mode, addrRes)
        return 0
    },

    'KIL': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        // stop program counter (processor lock up)
        throw new Error('KIL(HLT) is executed. ')
    },

    /*
    'LAR': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        return 0
    },
    */

    'LAX': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        const res = addrRes.data
        cpu.Register.A = res
        cpu.Register.X = res
        setFlag.Z(cpu.PS, res)
        setFlag.N(cpu.PS, res)
        if (mode === 'AY' || mode === 'IY') {
            return 1
        }
        return 0
    },

    'RLA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        Instructions.ROL(cpu, mode, addrRes)
        Instructions.AND(cpu, mode, addrRes)
        return 0
    },

    'RRA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        Instructions.ROR(cpu, mode, addrRes)
        Instructions.ADC(cpu, mode, addrRes)
        return 0
    },

    'SLO': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        Instructions.ASL(cpu, mode, addrRes)
        Instructions.ORA(cpu, mode, addrRes)
        return 0
    },

    'SRE': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        Instructions.LSR(cpu, mode, addrRes)
        Instructions.EOR(cpu, mode, addrRes)
        return 0
    },

    /*
    'SXA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        return 0
    },

    'SYA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        return 0
    },
    */

    'TOP': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        Instructions.NOP(cpu, mode, addrRes)
        Instructions.NOP(cpu, mode, addrRes)
        Instructions.NOP(cpu, mode, addrRes)
        if (mode === 'AX') {
            return 1
        }
        return 0
    },

    'XAA': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        Instructions.TXA(cpu, 'IM', addrRes)
        Instructions.AND(cpu, mode, addrRes)
        return 0
    },

    /*
    'XAS': function (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) {
        return 0
    },
    */

} as {
    [instruction: string]: (cpu: ICPU, mode: keyof ADDRMODE, addrRes: AddressingRes) => number
}