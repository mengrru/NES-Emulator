import { OPERAND, ADDR, ZADDR, ADDRMODE, ICPU } from './cpu.d'

/**
 * input: opcode arg: number, Register
 * output: operand: number
 */
export const AddressingMode: ADDRMODE = {
    I: function (cpu: ICPU, arg: OPERAND) {
        return { addr: -1, operand: arg }
    },
    Z: function (cpu: ICPU, arg: ZADDR) {
        return { addr: arg, operand: cpu.memRead(arg) }
    },
    ZX: function (cpu: ICPU, arg: ZADDR) {
        const addr = (arg + cpu.Register.X) & 0xff
        return { addr, operand: cpu.memRead(addr) }
    },
    ZY: function (cpu: ICPU, arg: ZADDR) {
        const addr = (arg + cpu.Register.Y) & 0xff
        return { addr, operand: cpu.memRead(addr) }
    },
    A: function (cpu: ICPU, arg: ADDR) {
        return { addr: arg, operand: cpu.memRead(arg) }
    },
    AX: function (cpu: ICPU, arg: ADDR) {
        const addr = (arg + cpu.Register.X) & 0xffff
        return { addr, operand: cpu.memRead(addr) }
    },
    AY: function (cpu: ICPU, arg: ADDR) {
        const addr = (arg + cpu.Register.Y) & 0xffff
        return { addr, operand: cpu.memRead(addr) }
    },
    IN: function (cpu: ICPU, arg: ADDR) {
        const addr = cpu.memRead(arg, 2)
        return { addr, operand: cpu.memRead(addr) }
    },
    IX: function (cpu: ICPU, arg: ZADDR) {
        const addr = cpu.memRead((arg + cpu.Register.X) & 0xff, 2)
        return { addr, operand: cpu.memRead(addr) }
    },
    IY: function (cpu: ICPU, arg: ZADDR) {
        const addr = (cpu.memRead(arg, 2) + cpu.Register.Y) & 0xffff
        return { addr, operand: cpu.memRead(addr) }
    },
    IM: function (cpu: ICPU, arg: number) {
        return { addr: -1, operand: -1 }
    },
    R: function (cpu: ICPU, arg: number) {
        return { addr: -1, operand: arg }
    },
    AC: function (cpu: ICPU, arg: number) {
        return { addr: -1, operand: cpu.Register.A }
    }
}