import CPU from "../src/cpu"
import { NESMap } from '../src/memory-map'

test('test_loadPRGROM', () => {
  const program = [0xa9, 0xc0, 0xaa, 0xe8, 0x69, 0xc4, 0x00]
  const cpu = new CPU(NESMap)
  cpu.test_loadPRGROM(program)
  const m = cpu.Memory
  expect(m[0x8000]).toBe(0xa9)
  expect(m[0x8001]).toBe(0xc0)
  expect(m[0x8002]).toBe(0xaa)
  expect(m[0x8005]).toBe(0xc4)
  const fffc = cpu.memRead(0xfffc, 2)
  expect(fffc).toBe(0x8000)
})
test('IR_RESET', () => {
  const program = [0xa9, 0xc0, 0xaa, 0xe8, 0x69, 0xc4, 0x00]
  const cpu = new CPU(NESMap)
  cpu.test_loadPRGROM(program)
  cpu.IR_RESET()
  expect(cpu.Register.PC).toBe(0x8000)
})
test('readAStatement', () => {
  const program = [0xa9, 0xc0, 0xaa, 0xe8, 0x69, 0xc4, 0x00]
  const cpu = new CPU(NESMap)
  const m = cpu.Memory
  cpu.test_loadPRGROM(program)
  cpu.IR_RESET()
  const res = cpu.readAStatement()
  expect(res.arg).toBe(0xc0)
  expect(res.opcInfo.name).toBe('LDA')
  expect(cpu.Register.PC).toBe(0x8002)
  expect(m[0x8002]).toBe(0xaa)

  const res2 = cpu.readAStatement()
  expect(res2.opcInfo.name).toBe('TAX')
  expect(res2.opcInfo.opcode).toBe(0xaa)
  expect(cpu.Register.PC).toBe(0x8003)
  expect(res2.arg).toBe(0)
})
test('program 0', () => {
  /*
LDA #$01
STA $0200
LDA #$05
STA $0201
LDA #$08
STA $0202
  */
  const program = [0xa9, 0x01, 0x8d, 0x00, 0x02, 0xa9, 0x05, 0x8d,
                   0x01, 0x02, 0xa9, 0x08, 0x8d, 0x02, 0x02]
  const cpu = new CPU(NESMap)
  cpu.test_runProgram(program)
  expect(cpu.Register.A).toBe(0x08)
  expect(cpu.Register.X).toBe(0x00)
  expect(cpu.Register.Y).toBe(0x00)
  expect(cpu.Register.PS).toBe(0b00110000)
  expect(cpu.Register.SP).toBe(0xff)
  expect(cpu.Register.PC).toBe(0x800f)
})
test('program 1', () => {
  /*
LDA #$c0  ;Load the hex value $c0 into the A register
TAX       ;Transfer the value in the A register to X
INX       ;Increment the value in the X register
ADC #$c4  ;Add the hex value $c4 to the A register
BRK       ;Break - we're done
  */
  // expect(sum(1, 2)).toBe(3);
  const program = [0xa9, 0xc0, 0xaa, 0xe8, 0x69, 0xc4, 0x00]
  const cpu = new CPU(NESMap)
  cpu.test_runProgram(program)
  expect(cpu.Register.A).toBe(0x84)
  expect(cpu.Register.X).toBe(0xc1)
  expect(cpu.Register.Y).toBe(0x00)
  expect(cpu.Register.PS).toBe(0b10110001)
  expect(cpu.Register.SP).toBe(0xfc)
  // expect(cpu.Register.PC).toBe(0x8007)
});
test('program 2 branching', () => {
  /*
  LDX #$08
decrement:
  DEX
  STX $0200
  CPX #$03
  BNE decrement
  STX $0201
  BRK
  */
  const program = [0xa2, 0x08, 0xca, 0x8e, 0x00, 0x02, 0xe0,
                  0x03, 0xd0, 0xf8, 0x8e, 0x01, 0x02, 0x00 ]
  const cpu = new CPU(NESMap)
  cpu.test_runProgram(program)
  expect(cpu.Register.A).toBe(0x00)
  expect(cpu.Register.X).toBe(0x03)
  expect(cpu.Register.Y).toBe(0x00)
  expect(cpu.Register.PS).toBe(0b00110011)
  expect(cpu.Register.SP).toBe(0xfc)
})
test('program 3 relative', () => {
  /*
  LDA #$01
  CMP #$02
  BNE notequal
  STA $22
notequal:
  BRK
  */
  const program = [0xa9, 0x01, 0xc9, 0x02, 0xd0, 0x02, 0x85, 0x22, 0x00]
  const cpu = new CPU(NESMap)
  cpu.test_runProgram(program)
  expect(cpu.Register.A).toBe(0x01)
  expect(cpu.Register.X).toBe(0x00)
  expect(cpu.Register.Y).toBe(0x00)
  expect(cpu.Register.PS).toBe(0b10110000)
  expect(cpu.Register.SP).toBe(0xfc)
})
test('indexed indirect', () => {
  const program = [0xa2, 0x01, 0xa9, 0x05, 0x85, 0x01, 0xa9, 0x07,
                  0x85, 0x02, 0xa0, 0x0a, 0x8c, 0x05, 0x07, 0xa1, 0x00 ]
  const cpu = new CPU(NESMap)
  cpu.test_runProgram(program)
  expect(cpu.Register.A).toBe(0x0a)
  expect(cpu.Register.X).toBe(0x01)
  expect(cpu.Register.Y).toBe(0x0a)
  expect(cpu.Register.PS).toBe(0b00110000)
  expect(cpu.Register.SP).toBe(0xff)
})
test('indirect indexed', () => {
  const program = [0xa0, 0x01, 0xa9, 0x03, 0x85, 0x01, 0xa9, 0x07,
                 0x85, 0x02, 0xa2, 0x0a, 0x8e, 0x04, 0x07, 0xb1, 0x01 ]
  const cpu = new CPU(NESMap)
  cpu.test_runProgram(program)
  expect(cpu.Register.A).toBe(0x0a)
  expect(cpu.Register.X).toBe(0x0a)
  expect(cpu.Register.Y).toBe(0x01)
  expect(cpu.Register.PS).toBe(0b00110000)
  expect(cpu.Register.SP).toBe(0xff)
})
test('stack', () => {
  /*
  LDX #$00
  LDY #$00
firstloop:
  TXA
  STA $0200,Y
  PHA
  INX
  INY
  CPY #$10
  BNE firstloop ;loop until Y is $10
secondloop:
  PLA
  STA $0200,Y
  INY
  CPY #$20      ;loop until Y is $20
  BNE secondloop
  */
  const program = [0xa2, 0x00, 0xa0, 0x00, 0x8a, 0x99, 0x00, 0x02, 0x48,
    0xe8, 0xc8, 0xc0, 0x10, 0xd0, 0xf5, 0x68, 0x99, 0x00, 0x02, 0xc8,
    0xc0, 0x20, 0xd0, 0xf7]
  const cpu = new CPU(NESMap)
  cpu.test_loadPRGROM(program)
  cpu.IR_RESET()
  // ldx 0x00
  cpu.execOnce()
  // ldy 0x00
  cpu.execOnce()
  // firstloop
  cpu.test_exec(7)
  expect(cpu.memRead(0x0200)).toBe(0)
  expect(cpu.Register.X).toBe(1)
  expect(cpu.Register.Y).toBe(1)
  expect(cpu.memRead(0x01ff)).toBe(0)
  cpu.test_exec(7 * 15)
  expect(cpu.memRead(0x020f)).toBe(15)
  expect(cpu.memRead(0x01f0)).toBe(15)
  cpu.test_exec(5)
  expect(cpu.Register.A).toBe(15)
  expect(cpu.memRead(0x0210)).toBe(15)
  cpu.test_exec(5 * 15)
  expect(cpu.Register.SP).toBe(0xff)
  expect(cpu.memRead(0x021f)).toBe(0)
  expect(cpu.Register.A).toBe(0)
  expect(cpu.Register.A).toBe(0x00)
  expect(cpu.Register.X).toBe(0x10)
  expect(cpu.Register.Y).toBe(0x20)
  expect(cpu.Register.PS).toBe(0b00110011)
  expect(cpu.Register.SP).toBe(0xff)

  const cpu2 = new CPU(NESMap)
  cpu2.test_runProgram(program)
  expect(cpu.Register.A).toBe(0x00)
  expect(cpu.Register.X).toBe(0x10)
  expect(cpu.Register.Y).toBe(0x20)
  expect(cpu.Register.PS).toBe(0b00110011)
  expect(cpu.Register.SP).toBe(0xff)
})
test('JMP', () => {
  /*
  LDA #$03
  JMP there ; in nes 6502 "there" will be compiled to 0x8008, cause
  BRK       ; PRG ROM is start in 0x8000
  BRK
  BRK
there:
  STA $0200
  */
  const program = [0xa9, 0x03, 0x4c, 0x08, 0x80, 0x00, 0x00, 0x00,
    0x8d, 0x00, 0x02 ]
  const cpu = new CPU(NESMap)
  cpu.test_runProgram(program)
  expect(cpu.Register.A).toBe(0x03)
  expect(cpu.Register.X).toBe(0)
  expect(cpu.Register.Y).toBe(0)
  expect(cpu.Register.PS).toBe(0b00110000)
  expect(cpu.memRead(0x0200)).toBe(0x03)
})
test('JSR/RTS', () => {
  /*
  JSR init
  JSR loop
  JSR end

init:
  LDX #$00
  RTS

loop:
  INX
  CPX #$05
  BNE loop
  RTS

end:
  BRK
  */
  const program = [0x20, 0x09, 0x80, 0x20, 0x0c, 0x80, 0x20, 0x12,
    0x80, 0xa2, 0x00, 0x60, 0xe8, 0xe0, 0x05, 0xd0, 0xfb, 0x60, 0x00]
  const cpu = new CPU(NESMap)
  cpu.test_runProgram(program)
  expect(cpu.Register.A).toBe(0x00)
  expect(cpu.Register.X).toBe(0x05)
  expect(cpu.Register.Y).toBe(0)
  expect(cpu.Register.PS).toBe(0b00110011)
  expect(cpu.Register.SP).toBe(0xfa)
})