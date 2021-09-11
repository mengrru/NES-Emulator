import Bus from "../bus"

export type OPERAND = number // 8bit
export type ADDR = number // 16bit
export type ZADDR = number // 8bit
export type RADDR = number // 8bit
export type BYTE2 = number
export type BYTE = number
export type BIT = number
export type INT8 = number
export type UINT8 = number
export type UINT16 = number

export type AddressingRes = {
    addr: ADDR
    data: number
}
export type ADDRMODE = {
    // Immediate
    I: (cpu: ICPU, arg: OPERAND) => AddressingRes
    // Zero Page
    Z: (cpu: ICPU, arg: ZADDR) => AddressingRes
    // Zero Page, X
    ZX: (cpu: ICPU, arg: ZADDR) => AddressingRes
    // Zero Page, Y
    ZY: (cpu: ICPU, arg: ZADDR) => AddressingRes
    // Absolute
    A: (cpu: ICPU, arg: ADDR) => AddressingRes
    // Absolute, X
    AX: (cpu: ICPU, arg: ADDR) => AddressingRes
    // Absolute, Y
    AY: (cpu: ICPU, arg: ADDR) => AddressingRes
    // (Indirect)
    IN: (cpu: ICPU, arg: ADDR) => AddressingRes
    // (Indirect, X)
    IX: (cpu: ICPU, arg: ZADDR) => AddressingRes
    // (Indirect), Y
    IY: (cpu: ICPU, arg: ZADDR) => AddressingRes
    // Implicit
    IM: (cpu: ICPU, arg: number) => AddressingRes
    // Relative
    R: (cpu: ICPU, arg: number) => AddressingRes
    // Accumulator
    AC: (cpu: ICPU, arg: number) => AddressingRes
}

export type REG = {
    PC: BYTE2
    SP: BYTE
    A: BYTE
    X: BYTE
    Y: BYTE
    PS: BYTE
}

export type PS = {
    C: BIT
    Z: BIT
    I: BIT
    D: BIT
    B: BIT
    V: BIT
    N: BIT
}

export interface ICPU {
    Register: REG
    PS: PS
    bus: Bus
    memoryMap: any
    clockCycle: number
    subClockCycleHandler: (cur: number) => void
    step: () => void
    push8: (value: number) => void
    push16: (value: number) => void
    pull8: () => UINT8
    pull16: () => UINT16
    IR_RESET: () => void
    memWrite: (addr: number, value: number, byteNum?: number) => void
    memRead: (addr: number, byteNum?: number) => number
}