import CPU from './cpu/index'
import TestGame from './cpu-test-game/index'

function loadROM (path: string) {
    const xhr = new XMLHttpRequest()
    xhr.responseType = 'arraybuffer'
    xhr.open('GET', path, true)
    xhr.onload = function (e) {
        console.log(xhr.response)
    }
    xhr.send()
}



const testGame = new TestGame()
testGame.run()

// loadROM('./cartridges/ram_retain.nes')