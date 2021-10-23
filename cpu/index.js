var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
define(["require", "exports", "./addressing-mode", "./instructions", "./opcode", "./registers", "./utils"], function (require, exports, addressing_mode_1, instructions_1, opcode_1, registers_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CPU = (function () {
        function CPU(memoryMap, bus) {
            this._clockCycle = 0;
            this.bus = bus;
            this.bus.connectCPU(this);
            this.memoryMap = memoryMap;
            this.PS = registers_1.ProcessorStatus();
            this.Register = registers_1.Registers(this.PS);
        }
        Object.defineProperty(CPU.prototype, "clockCycle", {
            get: function () {
                return this._clockCycle;
            },
            enumerable: false,
            configurable: true
        });
        CPU.prototype.step = function () {
            var snapshot = {
                PC: ('00' + utils_1.to16(this.Register.PC)).slice(-4),
                A: ('0' + utils_1.to16(this.Register.A)).slice(-2),
                X: ('0' + utils_1.to16(this.Register.X)).slice(-2),
                Y: ('0' + utils_1.to16(this.Register.Y)).slice(-2),
                P: ('0' + utils_1.to16(this.Register.PS)).slice(-2),
                SP: ('0' + utils_1.to16(this.Register.SP)).slice(-2),
                CYC: this.clockCycle
            };
            var _a = this.resolveAStatement(), opcInfo = _a.opcInfo, arg = _a.arg;
            var addrRes = addressing_mode_1.AddressingMode[opcInfo.mode](this, arg, opcInfo.name);
            var cycle = (opcInfo.cycles + instructions_1.Instructions[opcInfo.name](this, opcInfo.mode, addrRes));
            this.takeCycles(cycle);
            return __assign(__assign({}, snapshot), { opcInfo: opcInfo,
                arg: arg,
                addrRes: addrRes });
        };
        CPU.prototype.resolveAStatement = function () {
            var opcode = this.readByteByPC();
            var opcInfo = opcode_1.default[opcode];
            if (!opcInfo) {
                throw new Error("opcode " + opcode.toString(16) + " is not exist. PC: " + (this.Register.PC - 1).toString(16));
            }
            var arg = 0;
            var i = 0;
            while (i < opcInfo.bytes - 1) {
                var operand = this.readByteByPC();
                arg |= (operand << (i * 8));
                i++;
            }
            if (isNaN(arg)) {
                throw new Error("argument " + arg + " is not a number. opcode: " + opcode + " addrmode: " + opcInfo.mode);
            }
            return {
                opcInfo: opcInfo,
                arg: arg
            };
        };
        CPU.prototype.readByteByPC = function () {
            return this.memRead(this.Register.PC++);
        };
        CPU.prototype.takeCycles = function (num) {
            if (num === void 0) { num = 1; }
            for (var i = 0; i < num; i++) {
                this._clockCycle++;
                this.bus.ppu.clockCycle += 3;
                if (typeof this.subClockCycleHandler === 'function') {
                    this.subClockCycleHandler(this.clockCycle);
                }
            }
        };
        CPU.prototype.IR_RESET = function () {
            this.Register.A = 0;
            this.Register.X = 0;
            this.Register.Y = 0;
            this.Register.PS = 0;
            this.PS.I = 1;
            this.PS.B = 2;
            this.Register.SP = 0xfd;
            this.Register.PC = this.memRead(this.memoryMap.IR.RESET, 2);
            this.takeCycles(7);
        };
        CPU.prototype.IR_NMI = function () {
            this.push16(this.Register.PC);
            registers_1.setFlag.B(this.PS, 'NMI');
            this.push8(this.Register.PS);
            registers_1.setFlag.I(this.PS, 0);
            this.Register.PC = this.memRead(0xfffa, 2);
        };
        CPU.prototype.push8 = function (value) {
            if (this.Register.SP < 0) {
                throw new Error('Stack overflow');
            }
            this.memWrite(this.Register.SP + 0x100, value);
            this.Register.SP--;
        };
        CPU.prototype.push16 = function (value) {
            var low8 = value & 0xff;
            var high8 = (value >> 8) & 0xff;
            this.push8(high8);
            this.push8(low8);
        };
        CPU.prototype.pull8 = function () {
            if (this.Register.SP === 0xff) {
                throw new Error('Invalid pull');
            }
            this.Register.SP++;
            var res = this.memRead(this.Register.SP + 0x100);
            return res;
        };
        CPU.prototype.pull16 = function () {
            var low8 = this.pull8();
            var high8 = this.pull8();
            return low8 | (high8 << 8);
        };
        CPU.prototype.memWrite = function (addr, value, byteNum) {
            if (byteNum === void 0) { byteNum = 1; }
            if (byteNum === 1) {
                this.bus.memWrite8(addr, value);
            }
            else if (byteNum === 2) {
                this.bus.memWrite16(addr, value);
            }
            else {
                throw new Error('value written in memory is too large.');
            }
        };
        CPU.prototype.memRead = function (addr, byteNum) {
            if (byteNum === void 0) { byteNum = 1; }
            if (byteNum === 1) {
                return this.bus.memRead8(addr);
            }
            else if (byteNum === 2) {
                return this.bus.memRead16(addr);
            }
            else {
                throw new Error('the number of byte should not large than 2.');
            }
        };
        return CPU;
    }());
    exports.default = CPU;
});
//# sourceMappingURL=index.js.map