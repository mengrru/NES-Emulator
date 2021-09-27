import Bus from '../bus'
import { AddressingMode } from './addressing-mode'
import { PS, REG, ICPU, BYTE } from './cpu.d'
import { Instructions } from './instructions'
import Opcode from './opcode'
import { ProcessorStatus, Registers } from './registers'
import { to16 } from './utils'

export default class CPU implements ICPU{
    clockCycle: number = 0
    Register: REG
    PS: PS
    memoryMap: any
    bus: Bus
    subClockCycleHandler: (cur: number) => void

    constructor (memoryMap: any, bus: any) {
        this.bus = bus
        this.bus.connectCPU(this)

        this.memoryMap = memoryMap
        this.PS = ProcessorStatus()
        this.Register = Registers(this.PS)
    }

    step (): any {
        /**
         * if you want to run nestest.nes and gather logs,
         * fetch registers and cycles before instruction running
         * 
         * nestest log: https://www.qmtpro.com/~nes/misc/nestest.log
         */
        const snapshot = {
            PC: ('00' + to16(this.Register.PC)).slice(-4),
            A: ('0' + to16(this.Register.A)).slice(-2),
            X: ('0' + to16(this.Register.X)).slice(-2),
            Y: ('0' + to16(this.Register.Y)).slice(-2),
            P: ('0' + to16(this.Register.PS)).slice(-2),
            SP: ('0' + to16(this.Register.SP)).slice(-2),
            CYC: this.clockCycle
        }

        const { opcInfo, arg } = this.resolveAStatement()
        const addrRes = AddressingMode[opcInfo.mode](this, arg, opcInfo.name)
        const cycle = (opcInfo.cycles + Instructions[opcInfo.name](this, opcInfo.mode, addrRes))
        this.takeCycles(cycle)

        return {
            ...snapshot,
            opcInfo,
            arg,
            addrRes
        }
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

        this.Register.PC = this.memRead(this.memoryMap.IR.RESET, 2)

        this.takeCycles(7)
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