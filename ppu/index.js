define(["require", "exports", "../memory-map", "../public.def", "./registers", "./colors", "./timing"], function (require, exports, memory_map_1, public_def_1, registers_1, colors_1, timing_1) {
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
            this.v = 0;
            this.t = 0;
            this.x = 0;
            this.w = 0;
            this.regController = new registers_1.REG_Controller(this);
            this.regMask = new registers_1.REG_Mask();
            this.regStatus = new registers_1.REG_Status();
            this.regOAMAddress = new registers_1.REG_OAMAddress();
            this.regOAMData = new registers_1.REG_OAMData();
            this.regScroll = new registers_1.REG_Scroll();
            this.regAddress = new registers_1.REG_Address();
            this.regData = new registers_1.REG_Data();
            this.regOAMDMA = new registers_1.REG_OAMDMA();
            this.timing = new timing_1.default(this);
            this.VRAMMap = genVRAMMap();
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
                        self.t &= 29695;
                        self.t |= (data & 3) << 10;
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
                        if (self.w === 0) {
                            self.t &= 32736;
                            self.t |= (data & 248) >> 3;
                            self.x = data & 7;
                            self.w = 1;
                        }
                        else {
                            self.t &= 3103;
                            self.t |= (data & 192) << 2;
                            self.t |= (data & 56) << 2;
                            self.t |= (data & 7) << 12;
                            self.w = 0;
                        }
                    },
                    _a[memory_map_1.PPUReg.Address] = function (data) {
                        self.regAddress.updateByte(data);
                        if (self.w === 0) {
                            self.t &= 255;
                            self.t |= (data & 63) << 8;
                            self.w = 1;
                        }
                        else {
                            self.t &= 32512;
                            self.t |= data;
                            self.v = self.t;
                            self.w = 0;
                        }
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
                        self.w = 0;
                        self.regScroll.reset();
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
            if (this._clockCycle === 341) {
                this._clockCycle = 0;
                this.scanline++;
                if (this.scanline === 262) {
                    this.scanline = 0;
                }
            }
            this.timing.exec(this.scanline, this._clockCycle);
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
        Object.defineProperty(PPU.prototype, "renderingEnable", {
            get: function () {
                return this.regMask.showBg || this.regMask.showSprites;
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
            var VRAMAddr = addr - VRAM_START;
            if (VRAMAddr < 0x3c0) {
                var i = VRAMAddr;
                this.VRAMMap[i + Math.floor(i / 32) * 32].data = data;
            }
            else if (VRAMAddr >= 0x400 && VRAMAddr < 0x7c0) {
                var i = VRAMAddr - 0x400;
                this.VRAMMap[i + (Math.floor(i / 32) + 1) * 32].data = data;
            }
            else if (VRAMAddr >= 0x800 && VRAMAddr < 0xbc0) {
                var i = VRAMAddr - 64 * 2;
                this.VRAMMap[i + Math.floor((i - 0x800) / 32) * 32].data = data;
            }
            else if (VRAMAddr >= 0xc00 && VRAMAddr < 0xfc0) {
                var i = VRAMAddr - 0x400 - 64 * 2;
                this.VRAMMap[i + (Math.floor((i - 0x800) / 32) + 1) * 32].data = data;
            }
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
    function computedAttributeIndex(x, y) {
        return Math.floor(x / 4) + Math.floor(y / 4) * (32 / 4);
    }
    function computedPaletteIndexPosi(x, y) {
        switch ((Math.floor(x % 4 / 2) << 1) + Math.floor(y % 4 / 2)) {
            case 0: return 0;
            case 2: return 1;
            case 1: return 2;
            case 3: return 3;
        }
    }
    function genVRAMMap() {
        var LEN = 32 * 30 * 4;
        var res = Array(LEN);
        for (var VRAMAddr = 0; VRAMAddr < LEN; VRAMAddr++) {
            var x = void 0, y = void 0, mappedIndex = void 0;
            if (VRAMAddr < 0x3c0) {
                var i = VRAMAddr;
                mappedIndex = i + Math.floor(i / 32) * 32;
                x = VRAMAddr % 32;
                y = Math.floor(VRAMAddr / 32);
            }
            else if (VRAMAddr >= 0x400 && VRAMAddr < 0x7c0) {
                var i = VRAMAddr - 0x400;
                mappedIndex = i + (Math.floor(i / 32) + 1) * 32;
                x = i % 32;
                y = Math.floor(i / 32);
            }
            else if (VRAMAddr >= 0x800 && VRAMAddr < 0xbc0) {
                var i = VRAMAddr - 64 * 2;
                mappedIndex = i + Math.floor((i - 0x800) / 32) * 32;
                x = (VRAMAddr - 0x800) % 32;
                y = Math.floor((VRAMAddr - 0x800) / 32);
            }
            else if (VRAMAddr >= 0xc00 && VRAMAddr < 0xfc0) {
                var i = VRAMAddr - 0x400 - 64 * 2;
                mappedIndex = i + (Math.floor((i - 0x800) / 32) + 1) * 32;
                x = (VRAMAddr - 0xc00) % 32;
                y = Math.floor((VRAMAddr - 0xc00) / 32);
            }
            res[mappedIndex] = {
                data: 0,
                attrIndex: computedAttributeIndex(x, y),
                paletteIndexPosi: computedPaletteIndexPosi(x, y)
            };
        }
        return res;
    }
    function scrollAddr(mirroring, nametableStartAddr, addr, x, y) {
        if (mirroring === public_def_1.Mirroring.HORIZONTAL) {
            var haddr = addr + Math.floor(x / 8) * 32;
            if (haddr - nametableStartAddr < (0x400 - 64)) {
                return haddr;
            }
            switch (nametableStartAddr) {
                case 0x2000:
                    return haddr + 0x800 + 64;
                case 0x2400:
                    return haddr + 0x800 + 64;
                case 0x2800:
                    return haddr - 0x800 + 64;
                case 0x2c00:
                    return haddr - 0x1000 + 64;
            }
        }
        if (mirroring === public_def_1.Mirroring.VERTICAL) {
            var vaddr = addr + Math.floor(x / 8) * 30;
            if (vaddr < 0x3000) {
                return vaddr;
            }
            return vaddr - 0x1000;
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
    function drawPixelFromVRAM(addr, map) { }
});
//# sourceMappingURL=index.js.map