<script lang="ts">
  import NES from '../core/nes.ts'
  import '../../node_modules/nes.css/css/nes.css'

  let canvas
  let curPressed = null
  let cartridgePath = null
  let loading = false

  function loadROM (path: string, callback: (x: any) => void) {
    const xhr = new XMLHttpRequest()
    xhr.responseType = 'arraybuffer'
    xhr.open('GET', path, true)
    xhr.onload = function (e) {
        callback(xhr.response)
    }
    xhr.send()
  }

  function press (btnName: string) {
    NES.joypad.setBtn(NES.Btn[btnName])
    curPressed = btnName
  }
  function release () {
    curPressed = null
  }
  document.onkeydown = (event) => {
    const Btn = NES.Btn
    switch (event.code.toLowerCase()) {
      case 'keya':
        press('Left')
        break
      case 'keyd':
        press('Right')
        break
      case 'keys':
        press('Down')
        break
      case 'keyw':
        press('Up')
        break
      case 'keyj':
        press('A')
        break
      case 'keyk':
        press('B')
        break
      case 'enter':
        press('Select')
        break
      case 'space':
        press('Start')
        break
    }
  }
  document.onkeyup = () => {
    release()
  }
  const cartridgeChange = (event) => {
    if (!event.target.value) return

    loading = true
    const selected = Array.prototype.find.call(event.target, e => e.selected)
    const originInnerText = selected.innerText
    selected.innerText += ' - loading'

    NES.cpu.stop()

    loadROM(event.target.value, (buffer) => {
      const cartridge = new NES.Cartridge(new Uint8Array(buffer))
      NES.bus.connectScreen(new NES.Screen(canvas, document.body.clientWidth < 592 ? 1 : 2))
      NES.bus.connectCartridge(cartridge)
      NES.cpu.launch()

      selected.innerText = originInnerText
      loading = false
    })
  }

  export {}
</script>
<div id="app">
  <h1 class="page-title">Mengru's NES</h1>
  <div class="nes-container with-title">
    <p class="title">Hello</p>
    <div class="lists">
      <ul class="nes-list is-disc">
        <li>Now this NES emulator only can run games without background scroll.</li>
        <li>You can find source code in the <a href="https://github.com/mengrru/NES-Emulator">repo</a>.</li>
      </ul>
    </div>
  </div>
  <div class="nes-select">
    <select disabled={loading} on:change={cartridgeChange} required id="default_select">
      <option value="" selected>No Cartridge Selected</option>
      <option value="./cartridges/pac-man.nes">Pac-Man</option>
    </select>
  </div>
  <div class="nes-container is-rounded is-dark screen-container">
    <canvas bind:this={canvas} id="nes-canvas"></canvas>
  </div>
  <div class="joypad-container">
    <div class="joypad-body">
      <div class="joypad-direction-keys">
        <div on:touchstart={() => press('Up')} on:mousedown={() => press('Up')} on:touchend={release} on:mouseup={release} class:pressed={curPressed === 'Up'} class="up"><span class="nes-text is-primary">W</span></div>
        <div on:touchstart={() => press('Down')} on:mousedown={() => press('Down')} on:touchend={release} on:mouseup={release} class:pressed={curPressed === 'Down'} class="down"><span class="nes-text is-success">S</span></div>
        <div on:touchstart={() => press('Left')} on:mousedown={() => press('Left')} on:touchend={release} on:mouseup={release} class:pressed={curPressed === 'Left'} class="left"><span class="nes-text is-warning">A</span></div>
        <div on:touchstart={() => press('Right')} on:mousedown={() => press('Right')} on:touchend={release} on:mouseup={release} class:pressed={curPressed === 'Right'} class="right"><span class="nes-text is-error">D</span></div>
        <div class="center"></div>
      </div>
      <div class="joypad-function-keys">
        <div class="start">
          <p>START</p>
          <div on:touchstart={() => press('Start')} on:mousedown={() => press('Start')} on:touchend={release} on:mouseup={release} class:pressed={curPressed === 'Start'} class="btn"><span class="nes-text is-disabled">SPACE</span></div>
        </div>
        <div class="select">
          <p>SELECT</p>
          <div on:touchstart={() => press('Select')} on:mousedown={() => press('Select')} on:touchend={release} on:mouseup={release} class:pressed={curPressed === 'Select'} class="btn"><span class="nes-text is-disabled">ENTER</span></div>
        </div>
      </div>
      <div class="joypad-ab-keys">
        <div class="b">
          <div on:touchstart={() => press('B')} on:mousedown={() => press('B')} on:touchend={release} on:mouseup={release} class:pressed={curPressed === 'B'} class="btn nes-badge"><span class="is-error">K</span></div>
          <p>B</p>
        </div>
        <div class="a">
          <div on:touchstart={() => press('A')} on:mousedown={() => press('A')} on:touchend={release} on:mouseup={release} class:pressed={curPressed === 'A'} class="btn nes-badge"><span class="is-error">J</span></div>
          <p>A</p>
        </div>
      </div>
      <div class="joypad-logo">
        Nintendo®
      </div>
    </div>
  </div>
  <p></p>
</div>
<style>
  div, span {
    font-family: 'Courier New', Courier, monospace;
  }
  .page-title {
    text-align: center;
  }
  .pressed {
    opacity: .7;
  }
  #app {
    background-color: #fff;
    max-width: 600px;
    width: 100%;
    min-height: 100%;
    margin: 0 auto;
    padding: 1em 1em;
  }
  .screen-container {
    width: 100%;
    text-align: center;
    margin-left: -1px !important;
  }
  .joypad-container {
    padding-top: 2.6rem;
  }
  .joypad-container::before {
    content: "";
    width: 1.8rem;
    height: 1.8rem;
    display: block;
    background-color: #3E3634;
    margin: 0 auto;
    box-shadow: -1.7rem -1.7rem 0px 0px #3E3634,
      -1.7rem -3.4rem 0px 0px #3E3634;
  }
  .joypad-body {
    width: 100%;
    padding: 15% 0;
    background-color: #3E3634;
    border: 2rem solid #c3c3c3;
    box-sizing: border-box;
    position: relative;
  }
  .joypad-direction-keys {
    width: 7.5rem;
    height: 7.5rem;
    position: absolute;
    top: 50%;
    left: 6%;
    transform: translateY(-50%);
  }
  .joypad-direction-keys div {
    background-color: #c3c3c3;
    width: 2.5rem;
    height: 2.5rem;
    position: absolute;
  }
  .joypad-direction-keys div span {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2rem;
    font-weight: bold;
  }
  .joypad-direction-keys .up {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }
  .joypad-direction-keys .down {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
  }
  .joypad-direction-keys .left {
    left: 0;
    top: 50%;
    transform: translateY(-50%);
  }
  .joypad-direction-keys .right {
    right: 0;
    top: 50%;
    transform: translateY(-50%);
  }
  .joypad-direction-keys .center {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .joypad-function-keys {
    width: 9rem;
    height: 3rem;
    position: absolute;
    top: 58%;
    left: 48%;
    transform: translate(-50%, -50%);
  }
  .joypad-function-keys > div {
    width: 46%;
    display: inline-block;
    position: relative;
  }
  .joypad-function-keys span {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1rem;
    font-weight: bold;
  }
  .joypad-function-keys > div > p {
    margin: 0;
    margin-bottom: .3em;
    text-align: center;
    color: #BF1710;
    font-weight: bold;
    font-size: 1rem;
  }
  .joypad-function-keys .btn {
    width: 100%;
    height: 2rem;
    background-color: #787973;
    position: relative;
  }
  .joypad-ab-keys {
    width: 9rem;
    height: 3rem;
    position: absolute;
    top: 72%;
    right: 5%;
    transform: translateY(-50%);
  }
  .joypad-ab-keys > div {
    width: 45%;
    display: inline-block;
    position: relative;
  }
  .joypad-ab-keys .btn {
    width: 80%;
  }
  .joypad-ab-keys > div > p {
    text-align: right;
    color: #BF1710;
    font-weight: bold;
    font-size: 1rem;
  }
  .joypad-logo {
    color: #BF1710;
    font-weight: bold;
    position: absolute;
    right: 7%;
    top: 16%;
    font-size: 1.5rem;
  }
  @media (max-width: 592px) {
    html {
      font-size: 14px;
    }
    .joypad-function-keys > div {
      width: 40%;
    }
    .joypad-ab-keys {
      top: 60%;
    }
    .joypad-ab-keys > div {
      width: 40%;
    }
  }
</style>
