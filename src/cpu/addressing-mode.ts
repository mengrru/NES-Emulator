import { OPERAND, ADDR, ZADDR, ADDRMODE, ICPU } from './cpu.d'
import { isCrossPage } from './utils'

/**
 * input: opcode arg: number, Register
 * output: data: number
 */
export const AddressingMode: ADDRMODE = {
    I: function (cpu: ICPU, arg: OPERAND) {
        return { addr: -1, data: arg }
    },
    Z: function (cpu: ICPU, arg: ZADDR) {
        return { addr: arg, data: cpu.memRead(arg) }
    },
    ZX: function (cpu: ICPU, arg: ZADDR) {
        const addr = (arg + cpu.Register.X) & 0xff
        return { addr, data: cpu.memRead(addr) }
    },
    ZY: function (cpu: ICPU, arg: ZADDR) {
        const addr = (arg + cpu.Register.Y) & 0xff
        return { addr, data: cpu.memRead(addr) }
    },
    A: function (cpu: ICPU, arg: ADDR) {
        return { addr: arg, data: cpu.memRead(arg) }
    },
    AX: function (cpu: ICPU, arg: ADDR) {
        const addr = (arg + cpu.Register.X) & 0xffff
        return { addr, data: cpu.memRead(addr) }
    },
    AY: function (cpu: ICPU, arg: ADDR) {
        const addr = (arg + cpu.Register.Y) & 0xffff
        return { addr, data: cpu.memRead(addr) }
    },
    IN: function (cpu: ICPU, arg: ADDR) {
        const addr = cpu.memRead(arg, 2)
        return { addr, data: cpu.memRead(addr) }
    },
    IX: function (cpu: ICPU, arg: ZADDR) {
        const addr = cpu.memRead((arg + cpu.Register.X) & 0xff, 2)
        return { addr, data: cpu.memRead(addr) }
    },
    IY: function (cpu: ICPU, arg: ZADDR) {
        const addr = (cpu.memRead(arg, 2) + cpu.Register.Y) & 0xffff
        return { addr, data: cpu.memRead(addr) }
    },
    IM: function (cpu: ICPU, arg: number) {
        return { addr: -1, data: -1 }
    },
    R: function (cpu: ICPU, arg: number) {
        return { addr: -1, data: arg }
    },
    AC: function (cpu: ICPU, arg: number) {
        return { addr: -1, data: cpu.Register.A }
    }
}