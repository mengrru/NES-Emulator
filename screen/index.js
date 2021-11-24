define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var W = 256;
    var H = 240;
    var Screen = (function () {
        function Screen(canvas, scale) {
            if (scale === void 0) { scale = 1; }
            this.scale = 1;
            canvas.width = W * scale;
            canvas.height = H * scale;
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.scale = scale;
            this.imageData = new ImageData(this.canvas.width, this.canvas.height);
            this.imageDataData = this.imageData.data;
        }
        Screen.prototype.drawAPixel = function (x, y, color) {
            var S = this.scale;
            fillRect(this.imageData.width, this.imageDataData, color, x * S, y * S, S, S);
        };
        Screen.prototype.drawBg = function (tiles) {
            for (var i = 0; i < tiles.length; i++) {
                var X = i % (W / 8) * 8 * this.scale;
                var Y = Math.floor(i / (W / 8)) * 8 * this.scale;
                this.drawATile(tiles[i], X, Y);
            }
        };
        Screen.prototype.drawATile = function (tile, X, Y) {
            var S = this.scale;
            var W = this.imageData.width;
            for (var i = 0; i < 8; i++) {
                for (var j = 0; j < 8; j++) {
                    var Y_ = Y + (i * S);
                    var X_ = X + (7 - j) * S;
                    var pixel = this.imageData.data;
                    var color = tile[i][j];
                    for (var y = Y_; y < Y_ + S; y++) {
                        for (var x = X_; x < X_ + S; x++) {
                            var index = y * W * 4 + x * 4;
                            if (color[3] === 0) {
                                continue;
                            }
                            pixel[index] = color[0];
                            pixel[index + 1] = color[1];
                            pixel[index + 2] = color[2];
                            pixel[index + 3] = 255;
                        }
                    }
                }
            }
        };
        Screen.prototype.render = function () {
            this.ctx.putImageData(this.imageData, 0, 0);
        };
        return Screen;
    }());
    exports.default = Screen;
    function fillRect(imageWidth, pixels, color, X, Y, width, height) {
        for (var y = Y; y < Y + height; y++) {
            for (var x = X; x < X + width; x++) {
                var index = y * imageWidth * 4 + x * 4;
                if (color[3] === 0) {
                    continue;
                }
                pixels[index] = color[0];
                pixels[index + 1] = color[1];
                pixels[index + 2] = color[2];
                pixels[index + 3] = 255;
            }
        }
    }
});
//# sourceMappingURL=index.js.map