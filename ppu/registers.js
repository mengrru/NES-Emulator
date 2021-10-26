var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.REG_OAMDMA = exports.REG_Data = exports.REG_Address = exports.REG_Scroll = exports.REG_OAMData = exports.REG_OAMAddress = exports.REG_Status = exports.REG_Mask = exports.REG_Controller = void 0;
    var FlagReg = (function () {
        function FlagReg() {
            this.value = Array(8).fill(0);
        }
        FlagReg.prototype.set = function (data) {
            this.value = data.toString(2).split('').reverse().map(function (e) { return parseInt(e); });
        };
        FlagReg.prototype.get = function () {
            return parseInt(this.value.reverse().map(function (e) { return e.toString(); }).join(''), 2);
        };
        FlagReg.prototype.updateBit = function (i, data) {
            this.value[i] = data;
        };
        return FlagReg;
    }());
    var SingleWriteReg = (function () {
        function SingleWriteReg() {
            this.value = 0;
        }
        SingleWriteReg.prototype.set = function (data) {
            this.value = data;
        };
        SingleWriteReg.prototype.get = function () {
            return this.value;
        };
        SingleWriteReg.prototype.inc = function (n) {
            if (n === void 0) { n = 1; }
            var sum = this.value + n;
            this.value = sum & 0xff;
        };
        return SingleWriteReg;
    }());
    var DoubleWriteReg = (function () {
        function DoubleWriteReg() {
            this.value = [0, 0];
            this.sethi = true;
        }
        DoubleWriteReg.prototype.set = function (data) {
            this.value[0] = data >> 8;
            this.value[1] = data & 0xff;
        };
        DoubleWriteReg.prototype.get = function () {
            return (this.value[0] << 8) | this.value[1];
        };
        DoubleWriteReg.prototype.updateByte = function (data) {
            if (this.sethi) {
                this.value[0] = data;
            }
            else {
                this.value[1] = data;
            }
            this.sethi = !this.sethi;
        };
        DoubleWriteReg.prototype.inc = function (n) {
            var sum = this.value[1] + n;
            this.value[1] = sum & 0xff;
            if (sum > this.value[1]) {
                this.value[0] = (this.value[0] + 1) & 0xff;
            }
        };
        DoubleWriteReg.prototype.reset = function () {
            this.sethi = true;
        };
        return DoubleWriteReg;
    }());
    var REG_Controller = (function (_super) {
        __extends(REG_Controller, _super);
        function REG_Controller(ppu) {
            var _this = _super.call(this) || this;
            _this.ppu = ppu;
            return _this;
        }
        Object.defineProperty(REG_Controller.prototype, "nametable", {
            get: function () {
                var n = (this.value[1] << 1) | this.value[0];
                switch (n) {
                    case 0: return 0x2000;
                    case 1: return 0x2400;
                    case 2: return 0x2800;
                    case 3: return 0x2c00;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Controller.prototype, "vramAddrInc", {
            get: function () {
                return this.value[2] ? 32 : 1;
            },
            set: function (v) {
                this.value[2] = v === 32 ? 1 : 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Controller.prototype, "spriteAddr", {
            get: function () {
                return this.value[3] ? 0x1000 : 0;
            },
            set: function (v) {
                this.value[3] = v === 0x1000 ? 1 : 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Controller.prototype, "backgroundAddr", {
            get: function () {
                return this.value[4] ? 0x1000 : 0;
            },
            set: function (v) {
                this.value[4] = v === 0x1000 ? 1 : 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Controller.prototype, "spriteSize", {
            get: function () {
                return this.value[5] ? 8 * 16 : 8 * 8;
            },
            set: function (v) {
                this.value[5] = v === 8 * 16 ? 1 : 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Controller.prototype, "ppuSelect", {
            get: function () {
                return this.value[6];
            },
            set: function (v) {
                this.value[6] = v;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Controller.prototype, "hasNMI", {
            get: function () {
                return !!this.value[7];
            },
            set: function (v) {
                var before = this.value[7];
                this.value[7] = +v;
                if (!before && v && this.ppu.regStatus.inVblank) {
                    this.ppu.IR_NMI();
                }
            },
            enumerable: false,
            configurable: true
        });
        return REG_Controller;
    }(FlagReg));
    exports.REG_Controller = REG_Controller;
    var REG_Mask = (function (_super) {
        __extends(REG_Mask, _super);
        function REG_Mask() {
            return _super.call(this) || this;
        }
        Object.defineProperty(REG_Mask.prototype, "greyscale", {
            get: function () {
                return !!this.value[0];
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Mask.prototype, "showBgInLeftmost", {
            get: function () {
                return !!this.value[1];
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Mask.prototype, "showSpritesInLeftmost", {
            get: function () {
                return !!this.value[2];
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Mask.prototype, "showBg", {
            get: function () {
                return !!this.value[3];
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Mask.prototype, "showSprites", {
            get: function () {
                return !!this.value[4];
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Mask.prototype, "emRed", {
            get: function () {
                return !!this.value[5];
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Mask.prototype, "emGreen", {
            get: function () {
                return !!this.value[6];
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Mask.prototype, "emBlue", {
            get: function () {
                return !!this.value[7];
            },
            enumerable: false,
            configurable: true
        });
        return REG_Mask;
    }(FlagReg));
    exports.REG_Mask = REG_Mask;
    var REG_Status = (function (_super) {
        __extends(REG_Status, _super);
        function REG_Status() {
            return _super.call(this) || this;
        }
        Object.defineProperty(REG_Status.prototype, "spriteOverflow", {
            get: function () {
                return !!this.value[5];
            },
            set: function (v) {
                this.value[5] = +v;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Status.prototype, "sprite0Hit", {
            get: function () {
                return !!this.value[6];
            },
            set: function (v) {
                this.value[6] = +v;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Status.prototype, "inVblank", {
            get: function () {
                return !!this.value[7];
            },
            set: function (v) {
                this.value[7] = +v;
            },
            enumerable: false,
            configurable: true
        });
        return REG_Status;
    }(FlagReg));
    exports.REG_Status = REG_Status;
    var REG_OAMAddress = (function (_super) {
        __extends(REG_OAMAddress, _super);
        function REG_OAMAddress() {
            return _super.call(this) || this;
        }
        return REG_OAMAddress;
    }(SingleWriteReg));
    exports.REG_OAMAddress = REG_OAMAddress;
    var REG_OAMData = (function (_super) {
        __extends(REG_OAMData, _super);
        function REG_OAMData() {
            return _super.call(this) || this;
        }
        return REG_OAMData;
    }(SingleWriteReg));
    exports.REG_OAMData = REG_OAMData;
    var REG_Scroll = (function (_super) {
        __extends(REG_Scroll, _super);
        function REG_Scroll() {
            return _super.call(this) || this;
        }
        Object.defineProperty(REG_Scroll.prototype, "x", {
            get: function () {
                return this.value[0];
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(REG_Scroll.prototype, "y", {
            get: function () {
                return this.value[1];
            },
            enumerable: false,
            configurable: true
        });
        return REG_Scroll;
    }(DoubleWriteReg));
    exports.REG_Scroll = REG_Scroll;
    var REG_Address = (function (_super) {
        __extends(REG_Address, _super);
        function REG_Address() {
            return _super.call(this) || this;
        }
        return REG_Address;
    }(DoubleWriteReg));
    exports.REG_Address = REG_Address;
    var REG_Data = (function (_super) {
        __extends(REG_Data, _super);
        function REG_Data() {
            return _super.call(this) || this;
        }
        return REG_Data;
    }(SingleWriteReg));
    exports.REG_Data = REG_Data;
    var REG_OAMDMA = (function (_super) {
        __extends(REG_OAMDMA, _super);
        function REG_OAMDMA() {
            return _super.call(this) || this;
        }
        return REG_OAMDMA;
    }(SingleWriteReg));
    exports.REG_OAMDMA = REG_OAMDMA;
});
//# sourceMappingURL=registers.js.map