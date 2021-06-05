import { AddressingMode } from './addressing-mode'
import { PS, REG, ICPU, BYTE } from './cpu.d'
import { Instructions } from './instructions'
import Opcode from './opcode'

// load program code into memory starting at 0x8000 address.
// Program ROM: 0x8000 - 0xffff
// instruction stream start somewhere in this space (not necessarily at 0x8000)


enum ADDR_SPACE {
    PRG_ROM_START = 0x8000,
    PRG_ROM_END = 0xffff,
}

enum SPEC_ADDR {
    RESET_PC_STORED_IN = 0xfffc,
}

export default class CPU implements ICPU{
    Register: REG
    PS: PS
    Memory: number[]
    constructor () {
        this.Memory = Array(0xffff + 1).fill(-1)
        this.PS = {
            C: 0,
            Z: 0,
            I: 0,
            D: 0,
            // ?
            B: 0b11,
            V: 0,
            N: 0
        }
        const PS = this.PS
        this.Register = {
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
                PS.V = (v & 64) >> 5
                PS.N = (v & 128) >> 6
            }
        }
    }
    test_loadPRGROM (program: BYTE[]) {
        let cur = ADDR_SPACE.PRG_ROM_START
        for (let i = 0; i < program.length; i++) {
            this.Memory[cur] = program[i]
            cur++
        }
        // store #0x8000 to 0xfffc
        this.memWrite(SPEC_ADDR.RESET_PC_STORED_IN, ADDR_SPACE.PRG_ROM_START, 2)
    }
    test_runProgram (program: BYTE[]) {
        this.test_loadPRGROM(program)
        this.IR_RESET()
        this.run(program)
    }
    run (program: number[]) {
        if (this.Register.PC === ADDR_SPACE.PRG_ROM_END ||
            this.Register.PC === 0 ||
            (this.Register.PC - ADDR_SPACE.PRG_ROM_START) === program.length ||
            this.memRead(this.Register.PC) === -1 ||
            this.Register.PC === -1) {
            return
        }
        const cycles = this.execOnce()
        // setTimeout(() => {
            this.run(program)
        // }, cycles * 10);
    }
    test_exec (num: number = 1) {
        for (let i = 0; i < num; i++) {
            this.execOnce()
        }
    }
    execOnce (): number {
        const { opcInfo, arg } = this.readAStatement()
        console.log(opcInfo.name + '[' + opcInfo.mode + ']' + arg.toString(16))
        const addrRes = AddressingMode[opcInfo.mode](this, arg)
        let cycles = opcInfo.cycles
        cycles += Instructions[opcInfo.name](this, opcInfo.mode, addrRes)
        return cycles
    }
    readAStatement () {
        // console.log('PC', this.Register.PC.toString(16))
        const opcode = this.readByteByPC()
        // console.log(opcode)
        const opcInfo = Opcode[opcode]
        if (!opcInfo) {
            throw new Error('opcode ' + opcode + ' is not exist.')
        }
        let arg = 0
        let i = 0
        while (i < opcInfo.bytes - 1) {
            const operand = this.readByteByPC()
            arg |= (operand << (i * 8))
            i++
        }
        return {
            opcInfo,
            arg
        }
    }
    readByteByPC (): BYTE {
        const data = this.memRead(this.Register.PC)
        this.Register.PC++
        return data
    }
    /**
     * reset interrupt: 
     * 1. reset the state (register and flags)
     * 2. set PC to the 16-bit address that stored at 0xfffc
    */
    IR_RESET () {
        this.Register.A = 0
        this.Register.X = 0
        // this.Register.Y = 0
        this.Register.PS = 0
        // ?
        this.PS.B = 0b11
        this.Register.PC = this.memRead(SPEC_ADDR.RESET_PC_STORED_IN, 2)
    }
    push8 (value: number) {
        // The CPU does not detect if the stack is overflowed
        // by excessive pushing or pulling operations
        // and will most likely result in the program crashing.
        this.memWrite(this.Register.SP + 0x100, value)
        this.Register.SP--
    }
    push16 (value: number) {
        const low8 = value & 0xff
        const high8 = (value >> 8) & 0xff
        this.push8(high8)
        this.push8(low8)
        console.log('push16:' + this.Register.SP)
    }
    pull8 () {
        this.Register.SP++
        const res = this.memRead(this.Register.SP + 0x100)
        return res
    }
    pull16 () {
        const low8 = this.pull8()
        const high8 = this.pull8()
        console.log('pull16:' + this.Register.SP)
        return low8 | (high8 << 8)
    }
    memWrite (addr: number, value: number, byteNum: number = 1) {
        if (byteNum === 1) {
            this.Memory[addr] = value
        } else if (byteNum === 2) {
            this.Memory[addr] = value & 0xff
            this.Memory[addr + 1] = value >> 8
        } else {
            throw new Error('value written in memory is too large.')
        }
    }
    memRead (addr: number, byteNum: number = 1) {
        if (byteNum === 1) {
            return this.Memory[addr]
        } else if (byteNum === 2) {
            return (this.Memory[addr + 1] << 8) | this.Memory[addr]
        } else {
            throw new Error('the number of byte should not large than 2.')
        }
    }
}