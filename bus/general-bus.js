define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Bus = (function () {
        function Bus(memoryMap) {
            this.memory = Array(0xffff + 1).fill(0);
            this.memoryMap = memoryMap;
        }
        Bus.prototype.connectCPU = function (cpu) {
            this.cpu = cpu;
        };
        Bus.prototype.loadROM = function (program) {
            if (!this.cpu) {
                throw new Error('there has no CPU.');
            }
            this.PRGROMLen = program.length;
            this.program = program;
            var cur = this.memoryMap.ADDR_SPACE.PRG_ROM_START;
            for (var i = 0; i < this.PRGROMLen; i++) {
                this.memWrite8(cur, this.program[i]);
                cur++;
            }
            this.memWrite16(this.memoryMap.IR.RESET, this.memoryMap.ADDR_SPACE.PRG_ROM_START);
            this.cpu.IR_RESET();
        };
        Bus.prototype.memWrite8 = function (addr, value) {
            this.memory[addr] = value;
        };
        Bus.prototype.memRead8 = function (addr) {
            return this.memory[addr];
        };
        Bus.prototype.memWrite16 = function (addr, value) {
            this.memory[addr] = value & 0xff;
            this.memory[addr + 1] = value >> 8;
        };
        Bus.prototype.memRead16 = function (addr) {
            return (this.memRead8(addr + 1) << 8) | this.memRead8(addr);
        };
        return Bus;
    }());
    exports.default = Bus;
});
//# sourceMappingURL=general-bus.js.map