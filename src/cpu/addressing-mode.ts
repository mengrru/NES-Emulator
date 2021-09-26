import { OPERAND, ADDR, ZADDR, ADDRMODE, ICPU } from './cpu.d'
import { isCrossPage } from './utils'

/**
 * input: opcode arg: number, Register
 * output: data: number
 */
export const AddressingMode: ADDRMODE = {
    I: function (cpu: ICPU, arg: OPERAND) {
        return { addr: -1, data: arg, isCrossPage: 0 }
    },
    Z: function (cpu: ICPU, arg: ZADDR) {
        return { addr: arg, data: cpu.memRead(arg), isCrossPage: 0 }
    },
    ZX: function (cpu: ICPU, arg: ZADDR) {
        const addr = (arg + cpu.Register.X) & 0xff
        return { addr, data: cpu.memRead(addr), isCrossPage: 0 }
    },
    ZY: function (cpu: ICPU, arg: ZADDR) {
        const addr = (arg + cpu.Register.Y) & 0xff
        return { addr, data: cpu.memRead(addr), isCrossPage: 0 }
    },
    A: function (cpu: ICPU, arg: ADDR) {
        return { addr: arg, data: cpu.memRead(arg), isCrossPage: 0 }
    },
    AX: function (cpu: ICPU, arg: ADDR) {
        const addr = (arg + cpu.Register.X) & 0xffff
        return { addr, data: cpu.memRead(addr), isCrossPage: isCrossPage(arg, addr) }
    },
    AY: function (cpu: ICPU, arg: ADDR) {
        const addr = (arg + cpu.Register.Y) & 0xffff
        return { addr, data: cpu.memRead(addr), isCrossPage: isCrossPage(arg, addr) }
    },
    IN: function (cpu: ICPU, arg: ADDR, instruction?: string) {
        let addr = cpu.memRead(arg, 2)
        if (instruction === 'JMP') {
        // https://www.reddit.com/r/EmuDev/comments/fi29ah/6502_jump_indirect_error/
            const pageHead = arg & 0xff00
            const hi = (arg & 0xff) === 0xff ? pageHead : arg + 1
            addr = cpu.memRead(arg) | (cpu.memRead(hi) << 8)
        }
        return { addr, data: cpu.memRead(addr), isCrossPage: 0 }
    },
    IX: function (cpu: ICPU, arg: ZADDR) {
        // nestest cff2
        const addr = cpu.memRead((arg + cpu.Register.X) & 0xff, 2)
        return { addr, data: cpu.memRead(addr), isCrossPage: 0 }
    },
    IY: function (cpu: ICPU, arg: ZADDR) {
        const res = cpu.memRead(arg, 2)
        const addr = (res + cpu.Register.Y) & 0xffff
        return { addr, data: cpu.memRead(addr), isCrossPage: isCrossPage(res, addr) }
    },
    IM: function (cpu: ICPU, arg: number) {
        return { addr: -1, data: -1, isCrossPage: 0 }
    },
    R: function (cpu: ICPU, arg: number) {
        return { addr: -1, data: arg, isCrossPage: 0 }
    },
    AC: function (cpu: ICPU, arg: number) {
        return { addr: -1, data: cpu.Register.A, isCrossPage: 0 }
    }
}