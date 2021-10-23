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
define(["require", "exports", "./registers", "./utils"], function (require, exports, registers_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Instructions = void 0;
    exports.Instructions = {
        ADC: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var a = cpu.Register.A;
            var b = data;
            var c = cpu.PS.C;
            var res = a + b + c;
            cpu.Register.A = res & 0xff;
            registers_1.setFlag.Z(cpu.PS, cpu.Register.A);
            registers_1.setFlag.C(cpu.PS, res > 0xff);
            registers_1.setFlag.N(cpu.PS, cpu.Register.A);
            if (a < 128 && b < 128) {
                cpu.PS.V = cpu.Register.A < 128 ? 0 : 1;
            }
            else if (a >= 128 && b >= 128) {
                cpu.PS.V = cpu.Register.A < 128 ? 1 : 0;
            }
            else {
                cpu.PS.V = 0;
            }
            if (mode === 'AX' || mode === 'AY' || mode === 'IY') {
                return addrRes.isCrossPage;
            }
            return 0;
        },
        SBC: function (cpu, mode, addrRes) {
            exports.Instructions.ADC(cpu, mode, __assign(__assign({}, addrRes), { data: ((~addrRes.data) & 0xff) }));
            if (mode === 'AX' || mode === 'AY' || mode === 'IY') {
                return addrRes.isCrossPage;
            }
            return 0;
        },
        AND: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var res = cpu.Register.A & data;
            cpu.Register.A = res;
            registers_1.setFlag.Z(cpu.PS, cpu.Register.A);
            registers_1.setFlag.N(cpu.PS, cpu.Register.A);
            if (mode === 'AX' || mode === 'AY' || mode === 'IY') {
                return addrRes.isCrossPage;
            }
            return 0;
        },
        ASL: function (cpu, mode, addrRes) {
            var data = addrRes.data, addr = addrRes.addr;
            var res = data << 1;
            if (mode == 'AC') {
                cpu.Register.A = res & 0xff;
            }
            else {
                cpu.memWrite(addr, res & 0xff);
            }
            registers_1.setFlag.C(cpu.PS, res > 0xff);
            registers_1.setFlag.Z(cpu.PS, res & 0xff);
            registers_1.setFlag.N(cpu.PS, res & 0xff);
            return 0;
        },
        BCC: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var oldPC = cpu.Register.PC;
            if (cpu.PS.C === 0) {
                var res = utils_1.uint16(cpu.Register.PC + utils_1.int8(data));
                cpu.Register.PC = res;
                if (utils_1.isCrossPage(cpu.Register.PC, oldPC)) {
                    return 2;
                }
                else {
                    return 1;
                }
            }
            return 0;
        },
        BCS: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var oldPC = cpu.Register.PC;
            if (cpu.PS.C === 1) {
                var res = utils_1.uint16(cpu.Register.PC + utils_1.int8(data));
                cpu.Register.PC = res;
                if (utils_1.isCrossPage(cpu.Register.PC, oldPC)) {
                    return 2;
                }
                else {
                    return 1;
                }
            }
            return 0;
        },
        BEQ: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var oldPC = cpu.Register.PC;
            if (cpu.PS.Z === 1) {
                var res = utils_1.uint16(cpu.Register.PC + utils_1.int8(data));
                cpu.Register.PC = res;
                if (utils_1.isCrossPage(cpu.Register.PC, oldPC)) {
                    return 2;
                }
                else {
                    return 1;
                }
            }
            return 0;
        },
        BIT: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            registers_1.setFlag.Z(cpu.PS, cpu.Register.A & data);
            cpu.PS.V = (data >> 6) & 1;
            registers_1.setFlag.N(cpu.PS, data);
            return 0;
        },
        BMI: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var oldPC = cpu.Register.PC;
            if (cpu.PS.N === 1) {
                var res = utils_1.uint16(cpu.Register.PC + utils_1.int8(data));
                cpu.Register.PC = res;
                if (utils_1.isCrossPage(cpu.Register.PC, oldPC)) {
                    return 2;
                }
                else {
                    return 1;
                }
            }
            return 0;
        },
        BNE: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var oldPC = cpu.Register.PC;
            if (cpu.PS.Z === 0) {
                var res = utils_1.uint16(cpu.Register.PC + utils_1.int8(data));
                cpu.Register.PC = res;
                if (utils_1.isCrossPage(cpu.Register.PC, oldPC)) {
                    return 2;
                }
                else {
                    return 1;
                }
            }
            return 0;
        },
        BPL: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var oldPC = cpu.Register.PC;
            if (cpu.PS.N === 0) {
                var res = utils_1.uint16(cpu.Register.PC + utils_1.int8(data));
                cpu.Register.PC = res;
                if (utils_1.isCrossPage(cpu.Register.PC, oldPC)) {
                    return 2;
                }
                else {
                    return 1;
                }
            }
            return 0;
        },
        BRK: function (cpu, mode, addrRes) {
            cpu.push16(cpu.Register.PC);
            cpu.push8(cpu.Register.PS);
            cpu.Register.PC = cpu.memRead(0xfffe, 2);
            registers_1.setFlag.B(cpu.PS, 'BRK');
            return 0;
        },
        BVC: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var oldPC = cpu.Register.PC;
            if (cpu.PS.V === 0) {
                var res = utils_1.uint16(cpu.Register.PC + utils_1.int8(data));
                cpu.Register.PC = res;
                if (utils_1.isCrossPage(cpu.Register.PC, oldPC)) {
                    return 2;
                }
                else {
                    return 1;
                }
            }
            return 0;
        },
        BVS: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var oldPC = cpu.Register.PC;
            if (cpu.PS.V === 1) {
                var res = utils_1.uint16(cpu.Register.PC + utils_1.int8(data));
                cpu.Register.PC = res;
                if (utils_1.isCrossPage(cpu.Register.PC, oldPC)) {
                    return 2;
                }
                else {
                    return 1;
                }
            }
            return 0;
        },
        CLC: function (cpu, mode, addrRes) {
            cpu.PS.C = 0;
            return 0;
        },
        CLD: function (cpu, mode, addrRes) {
            cpu.PS.D = 0;
            return 0;
        },
        CLI: function (cpu, mode, addrRes) {
            cpu.PS.I = 0;
            return 0;
        },
        CLV: function (cpu, mode, addrRes) {
            cpu.PS.V = 0;
            return 0;
        },
        CMP: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var r = cpu.Register.A;
            registers_1.setFlag.C(cpu.PS, r >= data);
            registers_1.setFlag.Z(cpu.PS, r - data);
            registers_1.setFlag.N(cpu.PS, r - data);
            if (mode === 'AX' || mode === 'AY' || mode === 'IY') {
                return addrRes.isCrossPage;
            }
            return 0;
        },
        CPX: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var r = cpu.Register.X;
            registers_1.setFlag.C(cpu.PS, r >= data);
            registers_1.setFlag.Z(cpu.PS, r - data);
            registers_1.setFlag.N(cpu.PS, r - data);
            return 0;
        },
        CPY: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var r = cpu.Register.Y;
            registers_1.setFlag.C(cpu.PS, r >= data);
            registers_1.setFlag.Z(cpu.PS, r - data);
            registers_1.setFlag.N(cpu.PS, r - data);
            return 0;
        },
        DEC: function (cpu, mode, addrRes) {
            var addr = addrRes.addr, data = addrRes.data;
            var res = (data - 1) & 0xff;
            cpu.memWrite(addr, res);
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            return 0;
        },
        DEX: function (cpu, mode, addrRes) {
            var res = (cpu.Register.X - 1) & 0xff;
            cpu.Register.X = res;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            return 0;
        },
        DEY: function (cpu, mode, addrRes) {
            var res = (cpu.Register.Y - 1) & 0xff;
            cpu.Register.Y = res;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            return 0;
        },
        INC: function (cpu, mode, addrRes) {
            var addr = addrRes.addr, data = addrRes.data;
            var res = (data + 1) & 0xff;
            cpu.memWrite(addr, res);
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            return 0;
        },
        INX: function (cpu, mode, addrRes) {
            var res = (cpu.Register.X + 1) & 0xff;
            cpu.Register.X = res;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            return 0;
        },
        INY: function (cpu, mode, addrRes) {
            var res = (cpu.Register.Y + 1) & 0xff;
            cpu.Register.Y = res;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            return 0;
        },
        EOR: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var res = cpu.Register.A ^ data;
            cpu.Register.A = res;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            if (mode === 'AX' || mode === 'AY' || mode === 'IY') {
                return addrRes.isCrossPage;
            }
            return 0;
        },
        JMP: function (cpu, mode, addrRes) {
            var addr = addrRes.addr;
            cpu.Register.PC = addr;
            return 0;
        },
        JSR: function (cpu, mode, addrRes) {
            var addr = addrRes.addr;
            cpu.push16(cpu.Register.PC - 1);
            cpu.Register.PC = addr;
            return 0;
        },
        RTS: function (cpu, mode, addrRes) {
            cpu.Register.PC = utils_1.uint16(cpu.pull16() + 1);
            return 0;
        },
        LDA: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            cpu.Register.A = data;
            registers_1.setFlag.Z(cpu.PS, cpu.Register.A);
            registers_1.setFlag.N(cpu.PS, cpu.Register.A);
            if (mode === 'AX' || mode === 'AY' || mode === 'IY') {
                return addrRes.isCrossPage;
            }
            return 0;
        },
        LDX: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            cpu.Register.X = data;
            registers_1.setFlag.Z(cpu.PS, cpu.Register.X);
            registers_1.setFlag.N(cpu.PS, cpu.Register.X);
            if (mode === 'AY') {
                return addrRes.isCrossPage;
            }
            return 0;
        },
        LDY: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            cpu.Register.Y = data;
            registers_1.setFlag.Z(cpu.PS, cpu.Register.Y);
            registers_1.setFlag.N(cpu.PS, cpu.Register.Y);
            if (mode === 'AX') {
                return addrRes.isCrossPage;
            }
            return 0;
        },
        LSR: function (cpu, mode, addrRes) {
            var addr = addrRes.addr, data = addrRes.data;
            var res = data >> 1;
            if (mode === 'AC') {
                cpu.Register.A = res;
            }
            else {
                cpu.memWrite(addr, res);
            }
            cpu.PS.C = data & 1;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            return 0;
        },
        NOP: function (cpu, mode, addrRes) {
            return 0;
        },
        ORA: function (cpu, mode, addrRes) {
            var data = addrRes.data;
            var res = cpu.Register.A | data;
            cpu.Register.A = res;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            if (mode === 'AX' || mode === 'AY' || mode === 'IY') {
                return addrRes.isCrossPage;
            }
            return 0;
        },
        PHA: function (cpu, mode, addrRes) {
            cpu.push8(cpu.Register.A);
            return 0;
        },
        PHP: function (cpu, mode, addrRes) {
            cpu.push8(cpu.Register.PS | 0x30);
            return 0;
        },
        PLA: function (cpu, mode, addrRes) {
            var res = cpu.pull8();
            cpu.Register.A = res;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            return 0;
        },
        PLP: function (cpu, mode, addrRes) {
            var res = cpu.pull8();
            cpu.Register.PS = res;
            registers_1.setFlag.B(cpu.PS, 'PLP');
            return 0;
        },
        ROL: function (cpu, mode, addrRes) {
            var addr = addrRes.addr, data = addrRes.data;
            var res = (data << 1) | cpu.PS.C;
            if (mode === 'AC') {
                cpu.Register.A = res & 0xff;
            }
            else {
                cpu.memWrite(addr, res & 0xff);
            }
            registers_1.setFlag.C(cpu.PS, (data & 128) > 0);
            registers_1.setFlag.Z(cpu.PS, res & 0xff);
            registers_1.setFlag.N(cpu.PS, res & 0xff);
            return 0;
        },
        ROR: function (cpu, mode, addrRes) {
            var addr = addrRes.addr, data = addrRes.data;
            var res = (data >> 1) | (cpu.PS.C << 7);
            if (mode === 'AC') {
                cpu.Register.A = res & 0xff;
            }
            else {
                cpu.memWrite(addr, res & 0xff);
            }
            registers_1.setFlag.C(cpu.PS, (data & 1) > 0);
            registers_1.setFlag.Z(cpu.PS, res & 0xff);
            registers_1.setFlag.N(cpu.PS, res & 0xff);
            return 0;
        },
        RTI: function (cpu, mode, addrRes) {
            cpu.Register.PS = cpu.pull8();
            registers_1.setFlag.B(cpu.PS, 'IRQ');
            cpu.Register.PC = cpu.pull16();
            return 0;
        },
        SEC: function (cpu, mode, addrRes) {
            cpu.PS.C = 1;
            return 0;
        },
        SED: function (cpu, mode, addrRes) {
            cpu.PS.D = 1;
            return 0;
        },
        SEI: function (cpu, mode, addrRes) {
            cpu.PS.I = 1;
            return 0;
        },
        STA: function (cpu, mode, addrRes) {
            var addr = addrRes.addr;
            cpu.memWrite(addr, cpu.Register.A);
            return 0;
        },
        STX: function (cpu, mode, addrRes) {
            var addr = addrRes.addr;
            cpu.memWrite(addr, cpu.Register.X);
            return 0;
        },
        STY: function (cpu, mode, addrRes) {
            var addr = addrRes.addr;
            cpu.memWrite(addr, cpu.Register.Y);
            return 0;
        },
        TAX: function (cpu, mode, addrRes) {
            var res = cpu.Register.A;
            cpu.Register.X = res;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            return 0;
        },
        TAY: function (cpu, mode, addrRes) {
            var res = cpu.Register.A;
            cpu.Register.Y = res;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            return 0;
        },
        TSX: function (cpu, mode, addrRes) {
            var res = cpu.Register.SP;
            cpu.Register.X = res;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            return 0;
        },
        TXA: function (cpu, mode, addrRes) {
            var res = cpu.Register.X;
            cpu.Register.A = res;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            return 0;
        },
        TXS: function (cpu, mode, addrRes) {
            cpu.Register.SP = cpu.Register.X;
            return 0;
        },
        TYA: function (cpu, mode, addrRes) {
            var res = cpu.Register.Y;
            cpu.Register.A = res;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            return 0;
        },
        AAC: function (cpu, mode, addrRes) {
            exports.Instructions.AND(cpu, mode, addrRes);
            if (cpu.Register.A >> 7 !== 0) {
                registers_1.setFlag.C(cpu.PS, true);
            }
            return 0;
        },
        AAX: function (cpu, mode, addrRes) {
            var res = cpu.Register.X & cpu.Register.A;
            cpu.memWrite(addrRes.addr, res);
            return 0;
        },
        ARR: function (cpu, mode, addrRes) {
            exports.Instructions.AND(cpu, 'I', addrRes);
            exports.Instructions.ROR(cpu, 'AC', { addr: -1, data: cpu.Register.A, isCrossPage: 0 });
            var bit5 = (cpu.Register.A >> 4) & 1;
            var bit6 = (cpu.Register.A >> 5) & 1;
            registers_1.setFlag.C(cpu.PS, bit6 === 1);
            cpu.PS.V = bit5 ^ bit6;
            return 0;
        },
        ASR: function (cpu, mode, addrRes) {
            exports.Instructions.AND(cpu, mode, addrRes);
            exports.Instructions.LSR(cpu, 'AC', { addr: -1, data: cpu.Register.A, isCrossPage: 0 });
            return 0;
        },
        ATX: function (cpu, mode, addrRes) {
            var res = cpu.Register.A & addrRes.data;
            cpu.Register.A = res;
            cpu.Register.X = res;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            return 0;
        },
        AXA: function (cpu, mode, addrRes) {
            var res = cpu.Register.X & cpu.Register.A;
            cpu.Register.A = res;
            cpu.memWrite(addrRes.addr, res & 7);
            return 0;
        },
        AXS: function (cpu, mode, addrRes) {
            exports.Instructions.STX(cpu, mode, addrRes);
            exports.Instructions.PHA(cpu, mode, addrRes);
            exports.Instructions.AND(cpu, mode, addrRes);
            exports.Instructions.STA(cpu, mode, addrRes);
            exports.Instructions.PLA(cpu, mode, addrRes);
            return 0;
        },
        DCP: function (cpu, mode, addrRes) {
            exports.Instructions.DEC(cpu, mode, addrRes);
            exports.Instructions.CMP(cpu, mode, __assign(__assign({}, addrRes), { data: cpu.memRead(addrRes.addr) }));
            return 0;
        },
        DOP: function (cpu, mode, addrRes) {
            exports.Instructions.NOP(cpu, mode, addrRes);
            exports.Instructions.NOP(cpu, mode, addrRes);
            return 0;
        },
        ISC: function (cpu, mode, addrRes) {
            exports.Instructions.INC(cpu, mode, addrRes);
            exports.Instructions.SBC(cpu, mode, __assign(__assign({}, addrRes), { data: cpu.memRead(addrRes.addr) }));
            return 0;
        },
        KIL: function (cpu, mode, addrRes) {
            throw new Error('KIL(HLT) is executed. ');
        },
        LAX: function (cpu, mode, addrRes) {
            var res = addrRes.data;
            cpu.Register.A = res;
            cpu.Register.X = res;
            registers_1.setFlag.Z(cpu.PS, res);
            registers_1.setFlag.N(cpu.PS, res);
            if (mode === 'AY' || mode === 'IY') {
                return addrRes.isCrossPage;
            }
            return 0;
        },
        RLA: function (cpu, mode, addrRes) {
            exports.Instructions.ROL(cpu, mode, addrRes);
            exports.Instructions.AND(cpu, mode, __assign(__assign({}, addrRes), { data: cpu.memRead(addrRes.addr) }));
            return 0;
        },
        RRA: function (cpu, mode, addrRes) {
            exports.Instructions.ROR(cpu, mode, addrRes);
            exports.Instructions.ADC(cpu, mode, __assign(__assign({}, addrRes), { data: cpu.memRead(addrRes.addr) }));
            return 0;
        },
        SLO: function (cpu, mode, addrRes) {
            exports.Instructions.ASL(cpu, mode, addrRes);
            exports.Instructions.ORA(cpu, mode, __assign(__assign({}, addrRes), { data: cpu.memRead(addrRes.addr) }));
            return 0;
        },
        SRE: function (cpu, mode, addrRes) {
            exports.Instructions.LSR(cpu, mode, addrRes);
            exports.Instructions.EOR(cpu, mode, __assign(__assign({}, addrRes), { data: cpu.memRead(addrRes.addr) }));
            return 0;
        },
        TOP: function (cpu, mode, addrRes) {
            exports.Instructions.NOP(cpu, mode, addrRes);
            exports.Instructions.NOP(cpu, mode, addrRes);
            exports.Instructions.NOP(cpu, mode, addrRes);
            if (mode === 'AX') {
                return addrRes.isCrossPage;
            }
            return 0;
        },
        XAA: function (cpu, mode, addrRes) {
            exports.Instructions.TXA(cpu, 'IM', addrRes);
            exports.Instructions.AND(cpu, mode, addrRes);
            return 0;
        },
    };
});
//# sourceMappingURL=instructions.js.map