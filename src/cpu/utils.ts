import Logger from '../logger'
import { INT8, UINT8, UINT16, ICPU } from './cpu.d'

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
export function isCrossPage (addr1: UINT16, addr2: UINT16): number {
    return (addr1 & 0xff00) !== (addr2 & 0xff00) ? 1 : 0
}
export function to16 (n: number): string {
    return n.toString(16)
}

export function cpuRunningHelper (cpu: ICPU) {
    let timeout: NodeJS.Timeout
    const runningCallbackTable: { [T: number]: (() => void)[] } = {}
    const shouldStop = () => {
        const { ADDR_SPACE } = cpu.memoryMap
        if (cpu.Register.PC === ADDR_SPACE.PRG_ROM_END ||
            cpu.Register.PC === 0 ||
            // when you run test, use this condition
            // (cpu.Register.PC - ADDR_SPACE.PRG_ROM_START) === cpu.bus.PRGROMLen ||
            cpu.memRead(cpu.Register.PC) === -1 ||
            cpu.Register.PC === -1) {
            return true
        }
        return false
    }
    cpu.subClockCycleHandler = function (curClockCycle) {
        for (const T in runningCallbackTable) {
            if (curClockCycle % parseInt(T) === 0) {
                runningCallbackTable[T].forEach(fn => fn())
            }
        }
    }

    return {
        exec (num: number = 1) {
            for (let i = 0; i < num; i++) {
                const s = cpu.step()
                Logger.screen(
                    `${to16(s.PC)} ${to16(s.opcInfo.opcode)} ${to16(s.arg)}` + 
                    `   ${s.opcInfo.name} ${to16(s.addrRes.addr === -1 ? s.addrRes.data : s.addrRes.addr)}` +
                    `   A:${s.A} X:${s.X} Y:${s.Y} P:${s.P} SP:${s.SP} CYC:${s.CYC}`
                )
            }
        },
        launch (done?: () => void) {
            /**
             * every runner render 1 frame can bring fluent picture
             */
            const F = 1.78 * 1000000
            const FPS = Math.ceil(F / 341 / 261 * 3)
            const T = 1000 / F
            // why divide 3? if not I can get 3 renders per runner. why?
            const RunnerStepCount = Math.floor(F / FPS / 3)
            const RunnerInterval = Math.floor(1000 / FPS)

            let lastTime = window.performance.now()

            const runner = () => {
                const curTime = window.performance.now()
                const diff = curTime - lastTime
                if (diff < RunnerInterval) {
                    return requestAnimationFrame(runner)
                }
                lastTime = curTime
                for (let i = 0; i < RunnerStepCount; i++) {
                    /*
                    if (shouldStop()) {
                        clearInterval(timeout)
                        typeof done === 'function'
                            ? done()
                            : ''
                        return
                    }
                    */
                    try {
                        cpu.step()
                    } catch (e) {
                        clearInterval(timeout)
                        throw e
                    }
                }
                requestAnimationFrame(runner)
            }
            requestAnimationFrame(runner)
        },
        launchWithLog () {
            timeout = setInterval(() => {
                for (let i = 0; i < 97; i++) {
                    if (shouldStop()) {
                        clearInterval(timeout)
                        return
                    }
                    try {
                        const s = cpu.step()
                        Logger.console(
                            `${to16(s.PC)} ${('0' + to16(s.opcInfo.opcode)).slice(-2)} ${to16(s.arg)}` + 
                            `   ${s.opcInfo.name} ${to16(s.addrRes.addr === -1 ? s.addrRes.data : s.addrRes.addr)}` +
                            `   A:${s.A} X:${s.X} Y:${s.Y} P:${s.P} SP:${s.SP} CYC:${s.CYC}`
                        )
                    } catch (e) {
                        clearInterval(timeout)
                        throw e
                    }
                }
            }, 15);
        },
        registerRunningCallback (fn: () => void, T: number) {
            if (!runningCallbackTable[T]) {
                runningCallbackTable[T] = []
            }
            if (typeof fn === 'function') {
                runningCallbackTable[T].push(fn)
            }
        }
    }



}
