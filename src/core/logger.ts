export default class Logger {
    constructor () {
    }

    static screen (text: string) {
        const p = document.createElement('span')
        p.innerText = text + '\n'
        document.getElementsByTagName('body')[0].appendChild(p)
    }

    static console (text: string) {
        console.log(text)
    }
}