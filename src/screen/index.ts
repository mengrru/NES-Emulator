import {RGB, Tile} from "../ppu/ppu.def"

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
        const imageData = new ImageData(this.canvas.width, this.canvas.height)
        for (let i = 0; i < tiles.length; i++) {
            const X = i % (W / 8) * 8 * this.scale
            const Y = Math.floor(i / (W / 8)) * 8 * this.scale
            this.renderATile(tiles[i], X, Y, imageData)
        }
        this.ctx.putImageData(imageData, 0, 0)
    }

    renderATile (tile: Tile, X: number, Y: number, imageData: ImageData) {
        const S = this.scale
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                fillRect(imageData, tile[i][j],
                         X + (7 - j) * S,
                         Y + (i * S),
                         S, S)
            }
        }
    }
}

function fillRect (imageData: ImageData, color: RGB, X: number, Y: number, width: number, height: number) {
    const pixel = imageData.data
    for (let y = Y; y < Y + height; y++) {
        for (let x = X; x < X + width; x++) {
            const index = y * imageData.width * 4 + x * 4
            pixel[index] = color[0]
            pixel[index + 1] = color[1]
            pixel[index + 2] = color[2]
            pixel[index + 3] = 255
        }
    }
}
