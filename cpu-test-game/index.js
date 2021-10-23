define(["require", "exports", "../cpu/index", "./memory-map", "../cpu/utils"], function (require, exports, index_1, memory_map_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RANDOM_NUMBER_GENERATOR = 0xfe;
    var THE_CODE_OF_LAST_PRESSED_BTN = 0xff;
    var OUTPUT_START = 0x0200;
    var OUTPUT_END = 0x05ff;
    var palette = [
        '#000',
        '#fff',
        'grey',
        'red',
        'green',
        'blue',
        'magenta',
        'yellow',
        'tomato',
        'grey',
        'red',
        'green',
        'blue',
        'magenta',
        'yellow',
        'tomato',
    ];
    var TestGame = (function () {
        function TestGame(bus) {
            var _this = this;
            this.cpu = new index_1.default(memory_map_1.TestGameMap, bus);
            this.cpuRunner = utils_1.cpuRunningHelper(this.cpu);
            this.initMemory();
            this.initScreen();
            this.initJoyPad();
            this.cpuRunner.registerRunningCallback(function () {
                _this.genRandom();
                _this.refreshScreen();
            }, 96);
        }
        TestGame.prototype.run = function () {
            this.cpuRunner.launch();
        };
        TestGame.prototype.genRandom = function () {
            var num = Math.floor(Math.random() * 256);
            this.cpu.memWrite(RANDOM_NUMBER_GENERATOR, num);
        };
        TestGame.prototype.refreshScreen = function () {
            var start = OUTPUT_START;
            var end = OUTPUT_END;
            for (var i = start; i <= end; i++) {
                var si = i - start;
                var row = Math.floor(si / 32);
                var col = si - 32 * (row);
                var colorid = this.cpu.memRead(i);
                if (colorid !== 0 && colorid !== 1) {
                    colorid = Math.floor(this.cpu.memRead(i) / 256 * (palette.length - 1));
                }
                var color = palette[colorid];
                this.screen.fillStyle = color ? color : 'cyan';
                this.screen.fillRect(col * 10, row * 10, 10, 10);
            }
        };
        TestGame.prototype.initMemory = function () {
            var start = OUTPUT_START;
            var end = OUTPUT_END;
            for (var i = start; i <= end; i++) {
                this.cpu.memWrite(i, 0);
            }
        };
        TestGame.prototype.initScreen = function () {
            var canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 320;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, 320, 320);
            document.getElementById('app').appendChild(canvas);
            this.screen = ctx;
        };
        TestGame.prototype.initJoyPad = function () {
            var _this = this;
            document.onkeydown = function (event) {
                switch (event.code.toLowerCase()) {
                    case 'arrowup':
                        _this.cpu.memWrite(THE_CODE_OF_LAST_PRESSED_BTN, 0x77);
                        break;
                    case 'arrowdown':
                        _this.cpu.memWrite(THE_CODE_OF_LAST_PRESSED_BTN, 0x73);
                        break;
                    case 'arrowleft':
                        _this.cpu.memWrite(THE_CODE_OF_LAST_PRESSED_BTN, 0x61);
                        break;
                    case 'arrowright':
                        _this.cpu.memWrite(THE_CODE_OF_LAST_PRESSED_BTN, 0x64);
                        break;
                }
            };
        };
        return TestGame;
    }());
    exports.default = TestGame;
});
//# sourceMappingURL=index.js.map