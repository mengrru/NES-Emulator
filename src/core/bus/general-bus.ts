import CPU from "../cpu";
import { PRG_ROM_PAGE_SIZE } from "../public.def";
import type { ADDR, BYTE, CartridgeResolvedData, MemoryMap } from "../public.def";

export default class Bus {
    PRGROMLen: number
    program: number[]
    memoryMap: MemoryMap
    private cpu: CPU
    private memory: number[]

    constructor (memoryMap: MemoryMap) {
        this.memory = Array(0xffff + 1).fill(0)
        this.memoryMap = memoryMap
    }
    connectCPU (cpu: CPU) {
        this.cpu = cpu
    }
    loadROM (program: number[]) {
        if (!this.cpu) {
            throw new Error('there has no CPU.')
        }
        this.PRGROMLen = program.length
        this.program = program

        let cur = this.memoryMap.ADDR_SPACE.PRG_ROM_START
        for (let i = 0; i < this.PRGROMLen; i++) {
            this.memWrite8(cur, this.program[i])
            cur++
        }
        // store #0x8000 to 0xfffc
        this.memWrite16(
            this.memoryMap.IR.RESET,
            this.memoryMap.ADDR_SPACE.PRG_ROM_START
        )
        this.cpu.IR_RESET()
    }
    memWrite8 (addr: number, value: number) {
        this.memory[addr] = value
    }
    memRead8 (addr: number) {
        return this.memory[addr]
    }
    memWrite16 (addr: number, value: number) {
        this.memory[addr] = value & 0xff
        this.memory[addr + 1] = value >> 8
    }
    memRead16 (addr: number) {
        return (this.memRead8(addr + 1) << 8) | this.memRead8(addr)
    }
}
