define(["require", "exports", "../memory-map", "../public.def", "./registers", "./colors"], function (require, exports, memory_map_1, public_def_1, registers_1, colors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PPU = void 0;
    var _a = memory_map_1.NESPPUMap.ADDR_SPACE, CHR_ROM_START = _a.CHR_ROM_START, CHR_ROM_END = _a.CHR_ROM_END, VRAM_START = _a.VRAM_START, VRAM_END = _a.VRAM_END, PALETTES_START = _a.PALETTES_START, PALETTES_END = _a.PALETTES_END;
    var PPU = (function () {
        function PPU(bus) {
            this.paletteTable = Array(32).fill(0);
            this.VRAM = Array(2048).fill(0);
            this.OAMData = Array(64 * 4).fill(0);
            this._clockCycle = 0;
            this.scanline = 0;
            this.internalBuf = 0;
            this.regController = new registers_1.REG_Controller(this);
            this.regMask = new registers_1.REG_Mask();
            this.regStatus = new registers_1.REG_Status();
            this.regOAMAddress = new registers_1.REG_OAMAddress();
            this.regOAMData = new registers_1.REG_OAMData();
            this.regScroll = new registers_1.REG_Scroll();
            this.regAddress = new registers_1.REG_Address();
            this.regData = new registers_1.REG_Data();
            this.regOAMDMA = new registers_1.REG_OAMDMA();
            this.lastTime = window.performance.now();
            this.CHRROM = bus.rom.CHRROM;
            this.mirroring = bus.rom.screenMirroring;
            this.bus = bus;
        }
        Object.defineProperty(PPU.prototype, "clockCycle", {
            get: function () {
                return this._clockCycle;
            },
            set: function (value) {
                if (value > this._clockCycle) {
                    var old = this._clockCycle;
                    for (var i = 0; i < value - old; i++) {
                        this._clockCycle++;
                        this.tick();
                    }
                }
                else {
                    this._clockCycle = value;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(PPU.prototype, "write", {
            get: function () {
                var _a;
                var self = this;
                return _a = {},
                    _a[memory_map_1.PPUReg.Controller] = function (data, i) {
                        if (i === void 0) { i = -1; }
                        if (i === -1) {
                            self.regController.set(data);
                        }
                        else {
                            self.regController.updateBit(i, data);
                        }
                    },
                    _a[memory_map_1.PPUReg.Mask] = function (data, i) {
                        if (i === void 0) { i = -1; }
                        self.regMask.set(data);
                    },
                    _a[memory_map_1.PPUReg.OAM_Address] = function (data) {
                        self.regOAMAddress.set(data);
                        self.regOAMData.set(self.OAMRead(data));
                    },
                    _a[memory_map_1.PPUReg.OAM_Data] = function (data) {
                        self.regOAMData.set(data);
                        self.OAMWrite(self.regOAMAddress.get(), data);
                        self.regOAMAddress.inc();
                    },
                    _a[memory_map_1.PPUReg.Scroll] = function (data) {
                        self.regScroll.updateByte(data);
                    },
                    _a[memory_map_1.PPUReg.Address] = function (data) {
                        self.regAddress.updateByte(data);
                    },
                    _a[memory_map_1.PPUReg.Data] = function (data) {
                        self.regData.set(data);
                        self.memWrite(self.regAddress.get(), data);
                        self.regAddress.inc(self.regController.vramAddrInc);
                    },
                    _a.OAM_DMA = function (data, page) {
                        self.regOAMDMA.set(data);
                        if (page.length !== 0) {
                            self.writePagetoOAM(page);
                        }
                    },
                    _a;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(PPU.prototype, "read", {
            get: function () {
                var _a;
                var self = this;
                return _a = {},
                    _a[memory_map_1.PPUReg.Mask] = function () {
                        return self.regMask.get();
                    },
                    _a[memory_map_1.PPUReg.Scroll] = function () {
                        self.regScroll.reset();
                        return self.regScroll.get();
                    },
                    _a[memory_map_1.PPUReg.Controller] = function () {
                        return self.regController.get();
                    },
                    _a[memory_map_1.PPUReg.OAM_Address] = function () {
                        return self.regOAMAddress.get();
                    },
                    _a[memory_map_1.PPUReg.Address] = function () {
                        return self.regAddress.value[1];
                    },
                    _a[memory_map_1.PPUReg.Status] = function () {
                        self.regAddress.reset();
                        return self.regStatus.get();
                    },
                    _a[memory_map_1.PPUReg.OAM_Data] = function () {
                        return self.OAMRead(self.regOAMAddress.get());
                    },
                    _a[memory_map_1.PPUReg.Data] = function () {
                        var addr = self.regAddress.get();
                        var data = self.memRead(addr);
                        self.regData.set(data);
                        return self.regData.get();
                    },
                    _a;
            },
            enumerable: false,
            configurable: true
        });
        PPU.prototype.tick = function () {
            var cycle = this._clockCycle;
            if (cycle === 341) {
                if (this.isSprite0Hit) {
                    this.regStatus.sprite0Hit = true;
                }
                this._clockCycle = 0;
                this.scanline++;
                if (this.scanline === 240) {
                    this.frame();
                }
                if (this.scanline === 241) {
                    this.regStatus.inVblank = true;
                    this.regStatus.sprite0Hit = false;
                    if (this.regController.hasNMI) {
                        this.IR_NMI();
                    }
                }
                if (this.scanline === 261) {
                    this.scanline = 0;
                    this.regStatus.inVblank = false;
                    this.regStatus.sprite0Hit = false;
                }
            }
        };
        Object.defineProperty(PPU.prototype, "isSprite0Hit", {
            get: function () {
                var x = this.OAMData[3];
                var y = this.OAMData[0];
                return (this.scanline === y) && (x <= this._clockCycle) && this.regMask.showSprites;
            },
            enumerable: false,
            configurable: true
        });
        PPU.prototype.IR_NMI = function () {
            this.bus.cpu.IR_NMI();
        };
        PPU.prototype.writePagetoOAM = function (page) {
            this.OAMData = page;
        };
        PPU.prototype.OAMRead = function (addr) {
            return this.OAMData[addr];
        };
        PPU.prototype.OAMWrite = function (addr, data) {
            this.OAMData[addr] = data;
        };
        PPU.prototype.VRAMRead = function (addr) {
            var realAddr = mirroringAddr(addr - VRAM_START, this.mirroring);
            return this.VRAM[realAddr];
        };
        PPU.prototype.VRAMWrite = function (addr, data) {
            var realAddr = mirroringAddr(addr - VRAM_START, this.mirroring);
            this.VRAM[realAddr] = data;
        };
        PPU.prototype.memRead = function (addr) {
            addr %= 0x4000;
            var res = this.internalBuf;
            switch (true) {
                case addr >= CHR_ROM_START && addr <= CHR_ROM_END:
                    this.internalBuf = this.CHRROM[addr];
                    return res;
                case addr >= VRAM_START && addr <= VRAM_END:
                    this.internalBuf = this.VRAMRead(addr);
                    return res;
                case addr >= PALETTES_START && addr <= PALETTES_END:
                    return this.paletteTable[addr - PALETTES_START];
                default:
                    console.warn('invalid PPU memRead.' + addr.toString(16));
            }
        };
        PPU.prototype.memWrite = function (addr, data) {
            addr %= 0x4000;
            if (addr < 0x2000) {
                addr += 0x2000;
            }
            switch (true) {
                case addr >= VRAM_START && addr <= VRAM_END:
                    return this.VRAMWrite(addr, data);
                case addr >= PALETTES_START && addr <= PALETTES_END:
                    this.paletteTable[addr - PALETTES_START] = data;
                    return;
                default:
                    console.warn('invalid PPU memWrite.' + addr.toString(16));
            }
        };
        PPU.prototype.frame = function () {
            this.renderBackground();
            this.renderSprites();
            this.bus.screen.render();
        };
        PPU.prototype.renderBackground = function () {
            var nametableStartAddr = this.regController.nametable;
            var CHRBank = this.regController.backgroundAddr;
            var startVRAMAddr = mirroringAddr(nametableStartAddr - VRAM_START, this.mirroring);
            var attributeTable = this.VRAM.slice(startVRAMAddr, startVRAMAddr + 1024).slice(-64);
            var LEN = 32 * 30;
            var scale = this.bus.screen.scale;
            var res = [];
            for (var i = nametableStartAddr, j = 0; i < nametableStartAddr + LEN; i++, j++) {
                var tileStartAddr = (this.VRAMRead(i) || 0) * 16 + CHRBank;
                var paletteIndex = getPaletteIndex(j % 32, Math.floor(j / 32), attributeTable);
                var tile = (combineToATile(this.CHRROM.slice(tileStartAddr, tileStartAddr + 8), this.CHRROM.slice(tileStartAddr + 8, tileStartAddr + 16), getBgPalette(this.paletteTable, paletteIndex)));
                this.bus.screen.drawATile(tile, j % 32 * scale * 8, Math.floor(j / 32) * scale * 8);
            }
        };
        PPU.prototype.renderSprites = function () {
            var oam = this.OAMData;
            var scale = this.bus.screen.scale;
            for (var i = oam.length - 4; i >= 0; i -= 4) {
                var x = oam[i + 3];
                var y = oam[i];
                var index = oam[i + 1];
                var attr = oam[i + 2];
                var priority = attr >> 5 & 1;
                if (priority) {
                    continue;
                }
                var flipH = (attr >> 6 & 1) ? true : false;
                var flipV = (attr >> 7 & 1) ? true : false;
                var palette = getSpritePalette(this.paletteTable, attr & 3);
                var CHRBank = this.regController.spriteAddr;
                var tileStartAddr = CHRBank + index * 16;
                var tile = combineToATile(this.CHRROM.slice(tileStartAddr, tileStartAddr + 8), this.CHRROM.slice(tileStartAddr + 8, tileStartAddr + 16), palette, flipV, flipH, true);
                this.bus.screen.drawATile(tile, x * scale, y * scale);
            }
        };
        PPU.prototype.tiles_test = function () {
            var len = this.CHRROM.length;
            var output = [];
            for (var i = 0; i < len; i += 16) {
                output.push(combineToATile(this.CHRROM.slice(i, i + 8), this.CHRROM.slice(i + 8, i + 16)));
            }
            return output;
        };
        return PPU;
    }());
    exports.PPU = PPU;
    function getBgPalette(paletteTable, paletteIndex) {
        return paletteTable.slice(paletteIndex * 4, paletteIndex * 4 + 4);
    }
    function getSpritePalette(paletteTable, paletteIndex) {
        var N = 4 * 4;
        return paletteTable.slice(N + paletteIndex * 4, N + paletteIndex * 4 + 4);
    }
    function getPaletteIndex(x, y, attributeTable) {
        var attributeIndex = Math.floor(x / 4) + Math.floor(y / 4) * (32 / 4);
        var attribute = attributeTable[attributeIndex];
        switch ((Math.floor(x % 4 / 2) << 1) + Math.floor(y % 4 / 2)) {
            case 0: return attribute & 3;
            case 2: return (attribute >> 2) & 3;
            case 1: return (attribute >> 4) & 3;
            case 3: return (attribute >> 6) & 3;
        }
    }
    function mirroringAddr(addr, mirroring) {
        if (mirroring === public_def_1.Mirroring.VERTICAL) {
            return addr % 0x800;
        }
        else if (mirroring === public_def_1.Mirroring.HORIZONTAL) {
            if (Math.floor(addr / 0x400) === 1) {
                return addr - 0x400;
            }
            else if (Math.floor(addr / 0x400) === 2) {
                return addr - 0x400;
            }
            else if (Math.floor(addr / 0x400) === 3) {
                return addr - 0x800;
            }
            else {
                return addr;
            }
        }
        console.warn("VRAM addr: " + addr);
    }
    function combineToATile(low, high, palette, v, h, isSprite) {
        if (v === void 0) { v = false; }
        if (h === void 0) { h = false; }
        if (isSprite === void 0) { isSprite = false; }
        if (!palette) {
            palette = [0x23, 0x27, 0x30];
        }
        var res = [];
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                var a = v ? 7 - i : i, b = h ? 7 - j : j;
                if (res[a] === undefined) {
                    res[a] = [];
                }
                var code = (ByteN(high[i], j) << 1) | ByteN(low[i], j);
                if (isSprite) {
                    res[a][b] = code === 0 ? [0, 0, 0, 0] : colors_1.default[palette[code]];
                }
                else {
                    res[a][b] = colors_1.default[palette[code]];
                }
            }
        }
        return res;
    }
    function ByteN(x, n) {
        return ((x >> n) & 1);
    }
});
//# sourceMappingURL=index.js.map