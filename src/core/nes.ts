import CPU from './cpu/index'
import Cartridge from './cartridges/index'
import Bus from './bus/index'
import { NESCPUMap } from './memory-map'
import { cpuRunningHelper } from './cpu/utils'
import Screen from './screen/index'
import {Btn} from './joypad'

const bus = new Bus()
const cpu = new CPU(NESCPUMap, bus)
const cpuRunner = cpuRunningHelper(cpu)

export default {
  bus: bus,
  cpu: cpuRunner,
  joypad: bus.joypad,
  Btn: Btn,
  Screen: Screen,
  Cartridge: Cartridge
}
