import Bus from '../bus'
import { AddressingMode } from './addressing-mode'
import { PS, REG, ICPU, BYTE } from './cpu.d'
import { Instructions } from './instructions'
import Opcode from './opcode'
import { to16 } from './utils'

export default class CPU implements ICPU{
    Register: REG
    PS: PS
    memoryMap: any
    clockCycle: number
    bus: Bus
    subClockCycleHandler: (cur: number) => void
    constructor (memoryMap: any, bus: any) {
        this.bus = bus
        this.memoryMap = memoryMap
        this.clockCycle = 0

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

    step () {
        /**
         * if you want to run nestest.nes and get logs,
         * fetch registers and cycles before instruction running
         */
        const pc = this.Register.PC
        const registerInfo = 
            `   A:${to16(this.Register.A)} X:${to16(this.Register.X)} Y:${to16(this.Register.Y)}` +
            ` P:${to16(this.Register.PS)} SP:${to16(this.Register.SP)}` +
            ` CYC:${this.clockCycle}`

        const { opcInfo, arg } = this.resolveAStatement()
        const addrRes = AddressingMode[opcInfo.mode](this, arg)
        const cycle = (opcInfo.cycles + Instructions[opcInfo.name](this, opcInfo.mode, addrRes))
        this.takeCycles(cycle)

        console.log(
            `${to16(pc)} ${to16(opcInfo.opcode)} ${to16(arg)}` + 
            `   ${opcInfo.name} ${to16(addrRes.addr === -1 ? addrRes.data : addrRes.addr)}` +
            registerInfo
        )
    }

    resolveAStatement () {
        const opcode = this.readByteByPC()
        const opcInfo = Opcode[opcode]
        if (!opcInfo) {
            throw new Error(`opcode ${opcode.toString(16)} is not exist. PC: ${(this.Register.PC - 1).toString(16)}`)
        }
        let arg = 0
        let i = 0
        while (i < opcInfo.bytes - 1) {
            const operand = this.readByteByPC()
            arg |= (operand << (i * 8))
            i++
        }
        if (isNaN(arg)) {
            throw new Error(`argument ${arg} is not a number. opcode: ${opcode} addrmode: ${opcInfo.mode}`)
        }
        return {
            opcInfo,
            arg
        }
    }

    readByteByPC (): BYTE {
        return this.memRead(this.Register.PC++)
    }

    takeCycles (num = 1) {
        for (let i = 0; i < num; i++) {
            this.clockCycle++
            if (typeof this.subClockCycleHandler === 'function') {
                this.subClockCycleHandler(this.clockCycle)
            }
        }
    }

    IR_RESET () {
        /**
         * reset interrupt: 
         * 1. reset the state (register and flags)
         * 2. set PC to the 16-bit address that stored at 0xfffc
        */
        this.Register.A = 0
        this.Register.X = 0
        this.Register.Y = 0
        // ?
        this.Register.PS = 0
        // reference https://stackoverflow.com/questions/16913423/why-is-the-initial-state-of-the-interrupt-flag-of-the-6502-a-1
        this.PS.I = 1
        // ?
        // this.PS.B = 0b11
        this.PS.B = 0b10
        // reference https://www.pagetable.com/?p=410
        this.Register.SP = 0xfd

        // for test
        this.Register.PC = 0xc000 // this.memRead(this.memoryMap.SPEC_ADDR.RESET_PC_STORED_IN, 2)

        this.takeCycles(7)

        console.log('PC from $fffc: ' + to16(this.Register.PC))
        console.log(`$fffc:${to16(this.memRead(0xfffc))} $fffd:${to16(this.memRead(0xfffd))}`)
        console.log(`$fffa:${to16(this.memRead(0xfffa))} $fffb:${to16(this.memRead(0xfffb))}`)
        console.log(`$fffe:${to16(this.memRead(0xfffe))} $ffff:${to16(this.memRead(0xffff))}`)
        console.log(`$c000:${to16(this.memRead(0xc000))} $c001:${to16(this.memRead(0xc001))}`)
        console.log(`$c002:${to16(this.memRead(0xc002))}`)
    }

    push8 (value: number) {
        /**
         * The CPU does not detect if the stack is overflowed
         * by excessive pushing or pulling operations
         * and will most likely result in the program crashing.
         */
        if (this.Register.SP < 0) {
            throw new Error('Stack overflow')
        }
        this.memWrite(this.Register.SP + 0x100, value)
        this.Register.SP--
    }

    push16 (value: number) {
        const low8 = value & 0xff
        const high8 = (value >> 8) & 0xff
        this.push8(high8)
        this.push8(low8)
    }

    pull8 () {
        if (this.Register.SP === 0xff) {
            throw new Error('Invalid pull')
        }
        this.Register.SP++
        const res = this.memRead(this.Register.SP + 0x100)
        return res
    }

    pull16 () {
        const low8 = this.pull8()
        const high8 = this.pull8()
        return low8 | (high8 << 8)
    }

    memWrite (addr: number, value: number, byteNum: number = 1) {
        if (byteNum === 1) {
            this.bus.memWrite8(addr, value)
        } else if (byteNum === 2) {
            this.bus.memWrite16(addr, value)
        } else {
            throw new Error('value written in memory is too large.')
        }
    }

    memRead (addr: number, byteNum: number = 1) {
        if (byteNum === 1) {
            return this.bus.memRead8(addr)
        } else if (byteNum === 2) {
            return this.bus.memRead16(addr)
        } else {
            throw new Error('the number of byte should not large than 2.')
        }
    }
}