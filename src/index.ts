import TestGame from './cpu-test-game/index'

/** cpu bus cartridge test by running nestest.nes **/
import CPU from './cpu/index'
import Cartridge from './cartridges/index'
import Bus from './bus/index'
import { NESCPUMap } from './memory-map'
import { cpuRunningHelper } from './cpu/utils'

loadROM('./cartridges/nestest.nes', (buffer) => {
    const cartridge = new Cartridge(new Uint8Array(buffer))
    const cdata = cartridge.resolve()
    const cpu = new CPU(NESCPUMap, new Bus(cdata))
    const cpuRunner = cpuRunningHelper(cpu)

    /*
    document.getElementById('step-btn').onclick = function () {
        cpuRunner.exec()
    }
    */
   cpuRunner.launchWithLog()
})
/****/

/** only cpu test by running test game
import GBus from './bus/general-bus'
import TestGamePRG from './cpu-test-game/program'
import { TestGameMap } from './cpu-test-game/memory-map'

const testGame = new TestGame(new GBus(TestGamePRG, TestGameMap))
testGame.run()
/****/

function loadROM (path: string, callback: (x: any) => void) {
    const xhr = new XMLHttpRequest()
    xhr.responseType = 'arraybuffer'
    xhr.open('GET', path, true)
    xhr.onload = function (e) {
        callback(xhr.response)
    }
    xhr.send()
}
/*
loadROM('./cartridges/snake.nes', (buffer) => {
    const cartridge = new Cartridge(new Uint8Array(buffer))
    const cdata = cartridge.resolve()
    cdata.PRGROM = cdata.PRGROM.slice(1536)
    console.log(Array.from(cdata.PRGROM))
    const testGame = new TestGame(new Bus(cdata))
    testGame.run()
})
*/