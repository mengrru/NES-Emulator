import CPU from "../cpu/index"
import Bus from '../bus/general-bus'
import { TestGameMap } from "./memory-map"
import program from './program'
import { cpuRunningHelper } from "../cpu/utils"

const RANDOM_NUMBER_GENERATOR = 0xfe
const THE_CODE_OF_LAST_PRESSED_BTN = 0xff
const OUTPUT_START = 0x0200
const OUTPUT_END = 0x05ff

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
    cpuRunner
    constructor (bus: any) {
        this.cpu = new CPU(TestGameMap, bus)
        this.cpuRunner = cpuRunningHelper(this.cpu)

        this.initMemory()
        this.initScreen()
        this.initJoyPad()

        this.cpuRunner.registerRunningCallback(() => {
            this.genRandom()
            this.refreshScreen()
        }, 96)
    }
    run () {
        this.cpuRunner.launch()
    }
    genRandom () {
        const num = Math.floor(Math.random() * 256)
        this.cpu.memWrite(RANDOM_NUMBER_GENERATOR, num)
    }
    refreshScreen () {
        const start = OUTPUT_START
        const end = OUTPUT_END
        for (let i = start; i <= end; i++) {
            const si = i - start
            const row = Math.floor(si / 32)
            const col = si - 32 * (row)
            let colorid = this.cpu.memRead(i)
            if (colorid !== 0 && colorid !== 1) {
                colorid = Math.floor(this.cpu.memRead(i) / 256 * (palette.length - 1))
            }
            const color = palette[colorid]
            // if (this.cpu.memRead(i) > 1) {
            //     console.log(row, col)
            //     console.log(i.toString(16), this.cpu.memRead(i).toString(16))
            //     console.log(color)
            // }
            this.screen.fillStyle =  color ? color : 'cyan'
            this.screen.fillRect(col * 10, row * 10, 10, 10)
        }
    }
    initMemory () {
        const start = OUTPUT_START
        const end = OUTPUT_END
        for (let i = start; i <= end; i++) {
            this.cpu.memWrite(i, 0)
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
    }
    initJoyPad () {
        document.onkeydown = (event) => {
            switch (event.code.toLowerCase()) {
                case 'arrowup':
                    this.cpu.memWrite(
                        THE_CODE_OF_LAST_PRESSED_BTN,
                        0x77)
                break
                case 'arrowdown':
                    this.cpu.memWrite(
                        THE_CODE_OF_LAST_PRESSED_BTN,
                        0x73)
                break
                case 'arrowleft':
                    this.cpu.memWrite(
                        THE_CODE_OF_LAST_PRESSED_BTN,
                        0x61)
                break
                case 'arrowright':
                    this.cpu.memWrite(
                        THE_CODE_OF_LAST_PRESSED_BTN,
                        0x64)
                break
            }
        }
    }
}