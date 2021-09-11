import { ADDR, BYTE, CartridgeResolvedData, MemoryMap, PRG_ROM_PAGE_SIZE } from "../public.def";

export default class Bus {
    PRGROMLen: number
    program: number[]
    memoryMap: MemoryMap
    private memory: number[]

    constructor (program: number[], memoryMap: MemoryMap) {
        this.memory = Array(0xffff + 1).fill(0)
        this.PRGROMLen = program.length
        this.program = program
        this.memoryMap = memoryMap
        this.loadPRGROM()
    }
    loadPRGROM () {
        let cur = this.memoryMap.ADDR_SPACE.PRG_ROM_START
        for (let i = 0; i < this.PRGROMLen; i++) {
            this.memWrite8(cur, this.program[i])
            cur++
        }
        // store #0x8000 to 0xfffc
        this.memWrite16(
            this.memoryMap.SPEC_ADDR.RESET_PC_STORED_IN,
            this.memoryMap.ADDR_SPACE.PRG_ROM_START
        )
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
