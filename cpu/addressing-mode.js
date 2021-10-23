define(["require", "exports", "./utils"], function (require, exports, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AddressingMode = void 0;
    exports.AddressingMode = {
        I: function (cpu, arg) {
            return { addr: -1, data: arg, isCrossPage: 0 };
        },
        Z: function (cpu, arg) {
            return { addr: arg, data: cpu.memRead(arg), isCrossPage: 0 };
        },
        ZX: function (cpu, arg) {
            var addr = (arg + cpu.Register.X) & 0xff;
            return { addr: addr, data: cpu.memRead(addr), isCrossPage: 0 };
        },
        ZY: function (cpu, arg) {
            var addr = (arg + cpu.Register.Y) & 0xff;
            return { addr: addr, data: cpu.memRead(addr), isCrossPage: 0 };
        },
        A: function (cpu, arg) {
            return { addr: arg, data: cpu.memRead(arg), isCrossPage: 0 };
        },
        AX: function (cpu, arg) {
            var addr = (arg + cpu.Register.X) & 0xffff;
            return { addr: addr, data: cpu.memRead(addr), isCrossPage: utils_1.isCrossPage(arg, addr) };
        },
        AY: function (cpu, arg) {
            var addr = (arg + cpu.Register.Y) & 0xffff;
            return { addr: addr, data: cpu.memRead(addr), isCrossPage: utils_1.isCrossPage(arg, addr) };
        },
        IN: function (cpu, arg, instruction) {
            var addr = cpu.memRead(arg, 2);
            if (instruction === 'JMP') {
                var pageHead = arg & 0xff00;
                var hi = (arg & 0xff) === 0xff ? pageHead : arg + 1;
                addr = cpu.memRead(arg) | (cpu.memRead(hi) << 8);
            }
            return { addr: addr, data: cpu.memRead(addr), isCrossPage: 0 };
        },
        IX: function (cpu, arg) {
            var addr = cpu.memRead((arg + cpu.Register.X) & 0xff, 2);
            return { addr: addr, data: cpu.memRead(addr), isCrossPage: 0 };
        },
        IY: function (cpu, arg) {
            var res = cpu.memRead(arg, 2);
            var addr = (res + cpu.Register.Y) & 0xffff;
            return { addr: addr, data: cpu.memRead(addr), isCrossPage: utils_1.isCrossPage(res, addr) };
        },
        IM: function (cpu, arg) {
            return { addr: -1, data: -1, isCrossPage: 0 };
        },
        R: function (cpu, arg) {
            return { addr: -1, data: arg, isCrossPage: 0 };
        },
        AC: function (cpu, arg) {
            return { addr: -1, data: cpu.Register.A, isCrossPage: 0 };
        }
    };
});
//# sourceMappingURL=addressing-mode.js.map