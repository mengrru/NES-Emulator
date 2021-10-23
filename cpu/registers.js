define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProcessorStatus = exports.Registers = exports.setFlag = void 0;
    exports.setFlag = {
        C: function (PS, value) {
            PS.C = value ? 1 : 0;
        },
        Z: function (PS, value) {
            PS.Z = value === 0 ? 1 : 0;
        },
        I: function (PS, value) {
            PS.I = value;
        },
        D: function (PS, value) {
            PS.D = value;
        },
        B: function (PS, action) {
            var bit4 = (function (a) {
                switch (a) {
                    case 'PHP':
                    case 'BRK':
                        return 1;
                    case 'IRQ':
                    case 'NMI':
                    case 'PLP':
                        return 0;
                }
                return 0;
            })(action);
            var bit5 = 1;
            PS.B = (bit5 << 1) | bit4;
        },
        V: function (PS, m, n, r) {
            var res = !!((m ^ n) & 0x80);
            PS.V = res ? 1 : 0;
        },
        N: function (PS, value) {
            PS.N = (value & 128) >> 7;
        },
    };
    function Registers(PS) {
        return {
            PC: 0x0000,
            SP: 0xff,
            A: 0x00,
            X: 0x00,
            Y: 0x00,
            get PS() {
                return PS.C & 1 |
                    (PS.Z << 1) & 2 |
                    (PS.I << 2) & 4 |
                    (PS.D << 3) & 8 |
                    (PS.B << 4) & (16 + 32) |
                    (PS.V << 6) & 64 |
                    (PS.N << 7) & 128;
            },
            set PS(v) {
                PS.C = v & 1;
                PS.Z = (v & 2) >> 1;
                PS.I = (v & 4) >> 2;
                PS.D = (v & 8) >> 3;
                PS.B = (v & (16 + 32)) >> 4;
                PS.V = (v & 64) >> 6;
                PS.N = (v & 128) >> 7;
            }
        };
    }
    exports.Registers = Registers;
    function ProcessorStatus() {
        return {
            C: 0,
            Z: 0,
            I: 0,
            D: 0,
            B: 3,
            V: 0,
            N: 0
        };
    }
    exports.ProcessorStatus = ProcessorStatus;
});
//# sourceMappingURL=registers.js.map