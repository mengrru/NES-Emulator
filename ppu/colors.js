define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = [
        '#6d6d6d', '#002491', '#0000da', '#6d48da', '#91006d', '#b6006d', '#b62400', '#914800',
        '#6d4800', '#244800', '#006d24', '#009100', '#004848', '#000000', '#000000', '#000000',
        '#b6b6b6', '#006dda', '#0048ff', '#9100ff', '#b600ff', '#ff0091', '#ff0000', '#da6d00',
        '#916d00', '#249100', '#009100', '#00b66d', '#009191', '#000000', '#000000', '#000000',
        '#ffffff', '#6db6ff', '#9191ff', '#da6dff', '#ff00ff', '#ff6dff', '#ff9100', '#ffb600',
        '#dada00', '#6dda00', '#00ff00', '#48ffda', '#00ffff', '#000000', '#000000', '#000000',
        '#ffffff', '#b6daff', '#dab6ff', '#ffb6ff', '#ff91ff', '#ffb6b6', '#ffda91', '#ffff48',
        '#ffff6d', '#b6ff48', '#91ff6d', '#48ffda', '#91daff', '#000000', '#000000', '#000000'
    ].map(hexColorToRGB);
    function hexColorToRGB(hexColor) {
        hexColor = hexColor.slice(1);
        return [
            parseInt(hexColor.slice(0, 2), 16),
            parseInt(hexColor.slice(2, 4), 16),
            parseInt(hexColor.slice(4), 16)
        ];
    }
});
//# sourceMappingURL=colors.js.map