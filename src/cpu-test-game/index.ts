import CPU from "../cpu/index"
import { TestGameMap } from "./memory-map"
import program from './program'

const palette = [
    '#000',
    '#fff',
    'grey',
    'red',
    'green',
    'blue',
    'magenta',
    'yellow',
    'tomato',
    'grey',
    'red',
    'green',
    'blue',
    'magenta',
    'yellow',
    'tomato',
]
export default class TestGame {
    screen: CanvasRenderingContext2D
    cpu: CPU
    constructor () {
        this.cpu = new CPU(TestGameMap)
        this.initScreen()
        this.initJoyPad()
        this.cpu.registerRunningCallback(() => {
            this.genRandom()
            this.refreshScreen()
        })
    }
    run () {
        this.cpu.test_runProgram(program)
    }
    genRandom () {
        const num = Math.floor(Math.random() * 256)
        this.cpu.memWrite(TestGameMap.SPEC_ADDR.RANDOM_NUMBER_GENERATOR, num)
    }
    refreshScreen () {
        const start = TestGameMap.ADDR_SPACE.OUTPUT_START
        const end = TestGameMap.ADDR_SPACE.OUTPUT_END
        console.log('=====')
        for (let i = start; i <= end; i++) {
            const si = i - start
            const row = Math.floor(si / 32)
            const col = si - 32 * (row)
            let colorid = this.cpu.memRead(i)
            if (colorid !== 0 && colorid !== 1) {
                colorid = Math.floor(this.cpu.memRead(i) / 256 * (palette.length - 1))
            }
            if (colorid == 1) {
                console.log(i.toString(16))
            }
            const color = palette[colorid]
            // if (this.cpu.memRead(i) > 0) {
            //     console.log(row, col)
            //     console.log(i.toString(16), this.cpu.memRead(i).toString(16))
            //     console.log(color)
            // }
            this.screen.fillStyle =  color ? color : 'cyan'
            this.screen.fillRect(col * 10, row * 10, 10, 10)
        }
    }
    initScreen () {
        const canvas = document.createElement('canvas')
        canvas.width = 320
        canvas.height = 320
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, 320, 320)
        document.getElementById('app').appendChild(canvas)
        this.screen = ctx
        /*
        const screen = document.createElement('div')
        const screenUnits: HTMLDivElement[][] = []
        for (let i = 0; i < 32; i++) {
            const row = document.createElement('div')
            row.style.height = '10px'
            for (let j = 0; j < 32; j++) {
                if (!screenUnits[i]) {
                    screenUnits[i] = []
                    screen.appendChild(row)
                }
                const unit = document.createElement('div')
                screenUnits[i].push(unit)
                unit.style.width = '10px'
                unit.style.height = '10px'
                unit.style.backgroundColor = '#000'
                unit.style.display = 'inline-block'
                row.appendChild(unit)
            }
        }
        document.getElementById('app').appendChild(screen)
        this.screenUnits = screenUnits
        */
    }
    initJoyPad () {
        document.onkeydown = (event) => {
            switch (event.code.toLowerCase()) {
                case 'arrowup':
                    this.cpu.memWrite(
                        TestGameMap.SPEC_ADDR.THE_CODE_OF_LAST_PRESSED_BTN,
                        0x77)
                break
                case 'arrowdown':
                    this.cpu.memWrite(
                        TestGameMap.SPEC_ADDR.THE_CODE_OF_LAST_PRESSED_BTN,
                        0x73)
                break
                case 'arrowleft':
                    this.cpu.memWrite(
                        TestGameMap.SPEC_ADDR.THE_CODE_OF_LAST_PRESSED_BTN,
                        0x61)
                break
                case 'arrowright':
                    this.cpu.memWrite(
                        TestGameMap.SPEC_ADDR.THE_CODE_OF_LAST_PRESSED_BTN,
                        0x64)
                break
            }
        }
    }
}