define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Logger = (function () {
        function Logger() {
        }
        Logger.screen = function (text) {
            var p = document.createElement('span');
            p.innerText = text + '\n';
            document.getElementsByTagName('body')[0].appendChild(p);
        };
        Logger.console = function (text) {
            console.log(text);
        };
        return Logger;
    }());
    exports.default = Logger;
});
//# sourceMappingURL=logger.js.map