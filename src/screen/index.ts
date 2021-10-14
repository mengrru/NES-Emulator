import {Tile} from "../ppu/ppu.def"

const W = 256
const H = 240

export default class Screen {
    scale: number = 1
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    constructor (canvas: HTMLCanvasElement, scale = 1) {
        canvas.width = W * scale
        canvas.height = H * scale

        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.scale = scale
    }

    render_test (tiles: Tile[]) {
        for (let i = 0; i < tiles.length; i++) {
            this.renderATile(tiles[i],
                             i % (W / 8) * 8 * this.scale,
                             Math.floor(i / (W / 8)) * 8 * this.scale)
        }
    }
    renderATile (tile: Tile, X: number, Y: number) {
        const S = this.scale
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                this.ctx.fillStyle = tile[i][j]
                this.ctx.fillRect(X + ((7 - j) * S), Y + (i * S), S, S)
            }
        }
    }
}
