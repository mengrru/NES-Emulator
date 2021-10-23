define(["require", "exports", "./cpu/index", "./cartridges/index", "./bus/index", "./memory-map", "./cpu/utils"], function (require, exports, index_1, index_2, index_3, memory_map_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    loadROM('./cartridges/pac-man.nes', function (buffer) {
        var cartridge = new index_2.default(new Uint8Array(buffer));
        var cdata = cartridge.resolve();
        var bus = new index_3.default();
        var cpu = new index_1.default(memory_map_1.NESCPUMap, bus);
        var cpuRunner = utils_1.cpuRunningHelper(cpu);
        document.body.appendChild(bus.screen.canvas);
        bus.loadROM(cdata);
        cpuRunner.launch();
    });
    function loadROM(path, callback) {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'arraybuffer';
        xhr.open('GET', path, true);
        xhr.onload = function (e) {
            callback(xhr.response);
        };
        xhr.send();
    }
});
//# sourceMappingURL=index.js.map