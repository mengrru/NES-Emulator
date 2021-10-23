define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Btn;
    (function (Btn) {
        Btn[Btn["A"] = 1] = "A";
        Btn[Btn["B"] = 2] = "B";
        Btn[Btn["Select"] = 4] = "Select";
        Btn[Btn["Start"] = 8] = "Start";
        Btn[Btn["Up"] = 16] = "Up";
        Btn[Btn["Down"] = 32] = "Down";
        Btn[Btn["Left"] = 64] = "Left";
        Btn[Btn["Right"] = 128] = "Right";
    })(Btn || (Btn = {}));
    var JoyPad = (function () {
        function JoyPad() {
            this.strobe = false;
            this.btn = Btn.A;
            this.curReportedBtn = 0;
            this.initUI();
        }
        JoyPad.prototype.write = function (data) {
            this.strobe = (data & 1) === 1;
            if (this.strobe) {
                this.curReportedBtn = 0;
            }
        };
        JoyPad.prototype.read = function () {
            if (this.curReportedBtn > 7) {
                return 1;
            }
            var res = (this.btn & (1 << this.curReportedBtn)) >> this.curReportedBtn;
            if (!this.strobe && this.curReportedBtn <= 7) {
                this.curReportedBtn += 1;
            }
            return res;
        };
        JoyPad.prototype.setBtn = function (btn) {
            this.btn = btn;
        };
        JoyPad.prototype.initUI = function () {
            var _this = this;
            document.onkeydown = function (event) {
                switch (event.code.toLowerCase()) {
                    case 'keya':
                        _this.setBtn(Btn.Left);
                        break;
                    case 'keyd':
                        _this.setBtn(Btn.Right);
                        break;
                    case 'keys':
                        _this.setBtn(Btn.Down);
                        break;
                    case 'keyw':
                        _this.setBtn(Btn.Up);
                        break;
                    case 'keyj':
                        _this.setBtn(Btn.A);
                        break;
                    case 'keyk':
                        _this.setBtn(Btn.B);
                        break;
                    case 'enter':
                        _this.setBtn(Btn.Select);
                        break;
                    case 'space':
                        _this.setBtn(Btn.Start);
                        break;
                }
            };
        };
        return JoyPad;
    }());
    exports.default = JoyPad;
});
//# sourceMappingURL=index.js.map