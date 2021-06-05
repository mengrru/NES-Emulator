import sum from './cpu'
const xhr = new XMLHttpRequest()
xhr.responseType = 'arraybuffer'
xhr.open('GET', './cartridges/ram_retain.nes', true)
xhr.onload = function (e) {
    console.log(xhr.response)
}
xhr.send()