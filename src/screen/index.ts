import {RGB, Tile} from "../ppu/ppu.def"

const W = 256
const H = 240

export default class Screen {
    scale: number = 1
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    imageData: ImageData
    constructor (canvas: HTMLCanvasElement, scale = 1) {
        canvas.width = W * scale
        canvas.height = H * scale

        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.scale = scale

        this.imageData = new ImageData(this.canvas.width, this.canvas.height)
    }

    drawBg (tiles: Tile[]) {
        for (let i = 0; i < tiles.length; i++) {
            const X = i % (W / 8) * 8 * this.scale
            const Y = Math.floor(i / (W / 8)) * 8 * this.scale
            this.drawATile(tiles[i], X, Y)
        }
    }

    drawATile (tile: Tile, X: number, Y: number) {
        const S = this.scale
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                fillRect(this.imageData, tile[i][j],
                         X + (7 - j) * S,
                         Y + (i * S),
                         S, S)
            }
        }
    }
    render () {
        this.ctx.putImageData(this.imageData, 0, 0)
    }
}

function fillRect (imageData: ImageData, color: RGB, X: number, Y: number, width: number, height: number) {
    const pixel = imageData.data
    for (let y = Y; y < Y + height; y++) {
        for (let x = X; x < X + width; x++) {
            const index = y * imageData.width * 4 + x * 4
            if (color[3] === 0) {
                continue
            }
            pixel[index] = color[0]
            pixel[index + 1] = color[1]
            pixel[index + 2] = color[2]
            pixel[index + 3] = 255
        }
    }
}
