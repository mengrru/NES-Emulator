define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Scanline = {
        Each: [0, 261],
        PreRender: 261,
        Visible: [0, 239],
        PostRender: 240,
        VerticalBlanking: [241, 260]
    };
    var PPUTiming = (function () {
        function PPUTiming(ppu) {
            this.t = Array.from(Array(262)).map(function (e) { return Array.from(Array(341)).map(function (e) { return []; }); });
            this.ppu = ppu;
            this.init();
        }
        PPUTiming.prototype.exec = function (scanline, cycle) {
            this.t[scanline][cycle].forEach(function (f) { return f(); });
        };
        PPUTiming.prototype.init = function () {
            var _this = this;
            this.setAction(Scanline.Each, 340, function () {
                if (_this.ppu.isSprite0Hit) {
                    _this.ppu.regStatus.sprite0Hit = true;
                }
            });
            this.setAction(240, 0, function () {
                _this.ppu.frame();
            });
            this.setAction(241, 340, function () {
                _this.ppu.regStatus.inVblank = true;
                _this.ppu.regStatus.sprite0Hit = false;
                if (_this.ppu.regController.hasNMI) {
                    _this.ppu.IR_NMI();
                }
            });
            this.setAction(261, 1, function () {
                _this.ppu.regStatus.inVblank = false;
                _this.ppu.regStatus.sprite0Hit = false;
            });
            this.setAction(Scanline.Each, 256, function () {
                if (_this.ppu.renderingEnable) {
                    _this.ppu.v++;
                }
            });
            this.setAction(Scanline.Each, 257, function () {
                if (_this.ppu.renderingEnable) {
                    _this.ppu.v &= 31712;
                    _this.ppu.v |= (_this.ppu.t & 1055);
                }
            });
            this.setAction(Scanline.PreRender, [280, 304], function () {
                if (_this.ppu.renderingEnable) {
                    _this.ppu.v &= 1055;
                    _this.ppu.v |= (_this.ppu.t & 31712);
                }
            });
            this.setAction(Scanline.Each, [328, 340], function () {
            });
            this.setAction(Scanline.Each, [0, 256], function () { });
        };
        PPUTiming.prototype.setAction = function (scanline, cycle, action) {
            if (typeof scanline === 'number' && typeof cycle === 'number') {
                this.t[scanline][cycle].push(action);
            }
            else if (Array.isArray(scanline) && Array.isArray(cycle)) {
                for (var i = scanline[0]; i <= scanline[1]; i++) {
                    for (var j = cycle[0]; j <= cycle[1]; j++) {
                        this.t[i][j].push(action);
                    }
                }
            }
            else if (Array.isArray(scanline)) {
                for (var i = scanline[0]; i <= scanline[1]; i++) {
                    this.t[i][cycle].push(action);
                }
            }
            else if (Array.isArray(cycle)) {
                for (var i = cycle[0]; i <= cycle[1]; i++) {
                    this.t[scanline][i].push(action);
                }
            }
        };
        return PPUTiming;
    }());
    exports.default = PPUTiming;
});
//# sourceMappingURL=timing.js.map