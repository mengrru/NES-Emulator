define(["require", "exports", "../memory-map", "../ppu/index", "../screen/index", "../joypad/index"], function (require, exports, memory_map_1, index_1, index_2, index_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CPU_ADDRESS_MASK = 2047;
    var PPU_REGISTER_MASK = 8199;
    var _a = memory_map_1.NESCPUMap.ADDR_SPACE, CPU_RAM_START = _a.CPU_RAM_START, CPU_RAM_END = _a.CPU_RAM_END, PRG_ROM_START = _a.PRG_ROM_START, PRG_ROM_END = _a.PRG_ROM_END, PPU_REG_START = _a.PPU_REG_START, PPU_REG_END = _a.PPU_REG_END;
    function Addr(addr) {
        switch (true) {
            case addr >= CPU_RAM_START && addr <= CPU_RAM_END:
                return addr & CPU_ADDRESS_MASK;
            case addr >= PPU_REG_START && addr <= PPU_REG_END:
                return addr & PPU_REGISTER_MASK;
            default:
                return addr;
        }
    }
    function Max(addr) {
        switch (true) {
            case addr <= 0xff:
                return 0xff;
            case addr <= CPU_RAM_END:
                return CPU_ADDRESS_MASK;
            case addr <= PPU_REG_END:
                return PPU_REGISTER_MASK;
            case addr >= PRG_ROM_START:
                return PRG_ROM_END;
            default:
                console.warn('不在范围内的地址' + addr);
                return 0x7fff;
        }
    }
    function Min(addr) {
        switch (true) {
            case addr <= 0xff:
                return 0;
            case addr <= CPU_RAM_END:
                return CPU_RAM_START;
            case addr <= PPU_REG_END:
                return PPU_REG_START;
            case addr >= PRG_ROM_START:
                return PRG_ROM_START;
            default:
                console.warn('不在范围内的地址' + addr);
                return 0x7fff;
        }
    }
    var Bus = (function () {
        function Bus() {
            this.memory = Array(0xffff + 1).fill(0);
            this._screen = new index_2.default(document.createElement('canvas'), 2);
            this._joypad = new index_3.default();
        }
        Object.defineProperty(Bus.prototype, "PRGROMLen", {
            get: function () {
                return this._PRGROMLen;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Bus.prototype, "rom", {
            get: function () {
                return this._rom;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Bus.prototype, "ppu", {
            get: function () {
                return this._ppu;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Bus.prototype, "cpu", {
            get: function () {
                return this._cpu;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Bus.prototype, "screen", {
            get: function () {
                return this._screen;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Bus.prototype, "joypad", {
            get: function () {
                return this._joypad;
            },
            enumerable: false,
            configurable: true
        });
        Bus.prototype.loadROM = function (rom) {
            if (!this.cpu) {
                throw new Error('there has no CPU.');
            }
            this._rom = rom;
            this._PRGROMLen = rom.PRGROM.length;
            this._ppu = new index_1.PPU(this);
            this.cpu.IR_RESET();
        };
        Bus.prototype.connectCPU = function (cpu) {
            this._cpu = cpu;
        };
        Bus.prototype.memWrite8 = function (addr, value) {
            addr = Addr(addr);
            switch (addr) {
                case memory_map_1.PPUReg.Controller:
                case memory_map_1.PPUReg.Mask:
                case memory_map_1.PPUReg.OAM_Address:
                case memory_map_1.PPUReg.OAM_Data:
                case memory_map_1.PPUReg.Scroll:
                case memory_map_1.PPUReg.Address:
                case memory_map_1.PPUReg.Data:
                    this.ppu.write[addr](value);
                    return;
                case memory_map_1.PPUReg.OAM_DMA:
                    this.ppu.write.OAM_DMA(value, this.readPage(value));
                    return;
                case 0x4016:
                    this.joypad.write(value);
                    return;
            }
            if (addr >= PRG_ROM_START && addr <= PRG_ROM_END) {
                console.warn("invalid write addr " + addr + " on PRG_ROM");
                return;
            }
            else if (addr >= PPU_REG_START && addr <= PPU_REG_END) {
                console.warn("address " + addr.toString() + " is read-only.");
                return;
            }
            this.memory[Addr(addr)] = value;
        };
        Bus.prototype.memRead8 = function (addr) {
            addr = Addr(addr);
            switch (true) {
                case addr === 0x4016:
                    return this.joypad.read();
                case addr === memory_map_1.PPUReg.Data:
                case addr === memory_map_1.PPUReg.OAM_Data:
                case addr === memory_map_1.PPUReg.Status:
                    return this.ppu.read[addr]();
                case addr >= PRG_ROM_START && addr <= PRG_ROM_END:
                    return this.readPRGROM(addr - 0x8000);
                case addr >= PPU_REG_START && addr <= PPU_REG_END:
                    return this.ppu.read[addr]();
                default:
                    return this.memory[addr];
            }
        };
        Bus.prototype.memWrite16 = function (addr, value) {
            addr = Addr(addr);
            this.memory[addr] = value & 0xff;
            if (addr <= Max(addr)) {
                this.memory[addr + 1] = value >> 8;
            }
        };
        Bus.prototype.memRead16 = function (addr) {
            addr = Addr(addr);
            switch (addr) {
                case memory_map_1.NESCPUMap.IR.RESET:
                    return this.rom.PRGROM.length === 0x4000 ? 0xc000 : 0x8000;
            }
            if (addr + 1 <= Max(addr)) {
                return (this.memRead8(addr + 1) << 8) | this.memRead8(addr);
            }
            else {
                return (this.memRead8(Min(addr)) << 8) | this.memRead8(addr);
            }
        };
        Bus.prototype.readPage = function (hiAddr) {
            switch (true) {
                case hiAddr >= 0 && hiAddr <= 0x1f:
                    return this.memory.slice(hiAddr << 8, (hiAddr + 1) << 8);
                default:
                    console.warn("invalid read page addr " + hiAddr);
                    return [];
            }
        };
        Bus.prototype.readPRGROM = function (addr) {
            return this.rom.PRGROM[addr % this.rom.PRGROM.length];
        };
        return Bus;
    }());
    exports.default = Bus;
});
//# sourceMappingURL=index.js.map