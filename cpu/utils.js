define(["require", "exports", "../logger"], function (require, exports, logger_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cpuRunningHelper = exports.to16 = exports.isCrossPage = exports.page = exports.uint16 = exports.uint8 = exports.int8 = void 0;
    function int8(value) {
        if ((value & 128) > 0) {
            return value - 0x100;
        }
        return value;
    }
    exports.int8 = int8;
    function uint8(value) {
        return value & 0xff;
    }
    exports.uint8 = uint8;
    function uint16(value) {
        return value & 0xffff;
    }
    exports.uint16 = uint16;
    function page(value) {
        return (value & 0xff00) >> 8;
    }
    exports.page = page;
    function isCrossPage(addr1, addr2) {
        return (addr1 & 0xff00) !== (addr2 & 0xff00) ? 1 : 0;
    }
    exports.isCrossPage = isCrossPage;
    function to16(n) {
        return n.toString(16);
    }
    exports.to16 = to16;
    function cpuRunningHelper(cpu) {
        var timeout;
        var runningCallbackTable = {};
        var shouldStop = function () {
            var ADDR_SPACE = cpu.memoryMap.ADDR_SPACE;
            if (cpu.Register.PC === ADDR_SPACE.PRG_ROM_END ||
                cpu.Register.PC === 0 ||
                cpu.memRead(cpu.Register.PC) === -1 ||
                cpu.Register.PC === -1) {
                return true;
            }
            return false;
        };
        cpu.subClockCycleHandler = function (curClockCycle) {
            for (var T in runningCallbackTable) {
                if (curClockCycle % parseInt(T) === 0) {
                    runningCallbackTable[T].forEach(function (fn) { return fn(); });
                }
            }
        };
        return {
            exec: function (num) {
                if (num === void 0) { num = 1; }
                for (var i = 0; i < num; i++) {
                    var s = cpu.step();
                    logger_1.default.screen(to16(s.PC) + " " + to16(s.opcInfo.opcode) + " " + to16(s.arg) +
                        ("   " + s.opcInfo.name + " " + to16(s.addrRes.addr === -1 ? s.addrRes.data : s.addrRes.addr)) +
                        ("   A:" + s.A + " X:" + s.X + " Y:" + s.Y + " P:" + s.P + " SP:" + s.SP + " CYC:" + s.CYC));
                }
            },
            launch: function (done) {
                var F = 1.78 * 1000000;
                var FPS = Math.ceil(F / 341 / 261 * 3);
                var T = 1000 / F;
                var RunnerStepCount = Math.floor(F / FPS / 3);
                var RunnerInterval = Math.floor(1000 / FPS);
                var lastTime = window.performance.now();
                var runner = function () {
                    var curTime = window.performance.now();
                    var diff = curTime - lastTime;
                    if (diff < RunnerInterval) {
                        return requestAnimationFrame(runner);
                    }
                    lastTime = curTime;
                    for (var i = 0; i < RunnerStepCount; i++) {
                        try {
                            cpu.step();
                        }
                        catch (e) {
                            clearInterval(timeout);
                            throw e;
                        }
                    }
                    requestAnimationFrame(runner);
                };
                requestAnimationFrame(runner);
            },
            launchWithLog: function () {
                timeout = setInterval(function () {
                    for (var i = 0; i < 97; i++) {
                        if (shouldStop()) {
                            clearInterval(timeout);
                            return;
                        }
                        try {
                            var s = cpu.step();
                            logger_1.default.console(to16(s.PC) + " " + ('0' + to16(s.opcInfo.opcode)).slice(-2) + " " + to16(s.arg) +
                                ("   " + s.opcInfo.name + " " + to16(s.addrRes.addr === -1 ? s.addrRes.data : s.addrRes.addr)) +
                                ("   A:" + s.A + " X:" + s.X + " Y:" + s.Y + " P:" + s.P + " SP:" + s.SP + " CYC:" + s.CYC));
                        }
                        catch (e) {
                            clearInterval(timeout);
                            throw e;
                        }
                    }
                }, 15);
            },
            registerRunningCallback: function (fn, T) {
                if (!runningCallbackTable[T]) {
                    runningCallbackTable[T] = [];
                }
                if (typeof fn === 'function') {
                    runningCallbackTable[T].push(fn);
                }
            }
        };
    }
    exports.cpuRunningHelper = cpuRunningHelper;
});
//# sourceMappingURL=utils.js.map