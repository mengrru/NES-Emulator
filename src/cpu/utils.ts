import { INT8, UINT8, UINT16 } from './cpu'

const MEMORY: number[] = []
// little-endian
/*
export function data (...args: number[]): number {
    return parseInt('0x' + args.sort((a, b) => b - a).map(index => MEMORY[index].toString(16).slice(2)).join())
}
export function twoByte (arg: number): number {
    return data(arg, arg + 1)
}
*/
export function int8 (value: number): INT8 {
    if ((value & 128) > 0) {
        return value - 0x100
    }
    return value
}
export function uint8(value: number): UINT8 {
    return value & 0xff
}
export function uint16(value: number): UINT16 {
    return value & 0xffff
}
export function page(value: number): number {
    return (value & 0xff00) >> 8
}
export function isCorssPage (addr1: UINT16, addr2: UINT16): boolean {
    return (addr1 & 0xff00) !== (addr2 & 0xff00)
}