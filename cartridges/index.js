define(["require", "exports", "../public.def"], function (require, exports, public_def_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Cartridge = (function () {
        function Cartridge(binary) {
            this.binary = binary;
        }
        Cartridge.prototype.resolve = function () {
            var byte0to3 = this.binary.slice(0, 4);
            var PRGROMBanks = this.binary[4];
            var CHRROMBanks = this.binary[5];
            var controlByte1 = this.binary[6];
            var controlByte2 = this.binary[7];
            var PRGRAMUnits = this.binary.slice(8, 10);
            for (var i = 0; i < byte0to3.length; i++) {
                if (public_def_1.NESFileSymbol[i] !== byte0to3[i]) {
                    throw new Error('This file is not a .NES file.');
                }
            }
            var verticalMirroring = controlByte1 & 1;
            var batteryBackedRAM = (controlByte1 >> 1) & 1;
            var haveTrainer = (controlByte1 >> 2) & 1;
            var fourScreenVRAM = (controlByte1 >> 3) & 1;
            var mapperTypeLowerBits = (controlByte1 >> 4) & 15;
            var iNESEdition = (controlByte2 >> 2) & 3;
            var mapperTypeUpperBits = (controlByte2 >> 4) & 15;
            if (iNESEdition !== 0) {
                throw new Error('Do not support others iNES format except iNES 1.0.');
            }
            var PRGROMSize = PRGROMBanks * public_def_1.PRG_ROM_PAGE_SIZE;
            var CHRROMSize = CHRROMBanks * public_def_1.CHR_ROM_PAGE_SIZE;
            var PRGROMStart = 0x10;
            if (haveTrainer) {
                PRGROMStart += 512;
            }
            var CHRROMStart = PRGROMStart + PRGROMSize;
            console.log("PRGROMSize:" + PRGROMSize.toString(16) + " CHRROMSize:" + CHRROMSize.toString(16));
            return {
                PRGROM: this.binary.slice(PRGROMStart, PRGROMStart + PRGROMSize),
                CHRROM: this.binary.slice(CHRROMStart, CHRROMStart + CHRROMSize),
                mapper: mapperTypeLowerBits | (mapperTypeUpperBits << 4),
                screenMirroring: (function () {
                    if (fourScreenVRAM) {
                        return public_def_1.Mirroring.FOUR_SCREEN;
                    }
                    else {
                        return verticalMirroring ? public_def_1.Mirroring.VERTICAL : public_def_1.Mirroring.HORIZONTAL;
                    }
                })()
            };
        };
        return Cartridge;
    }());
    exports.default = Cartridge;
});
//# sourceMappingURL=index.js.map