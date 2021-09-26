const fs = require('fs').promises

const p1 = fs.readFile('./scripts/nestest.log')
    .then((data) => {
        return data
            .toString()
            .split('\n')
            .map(e => {
                const res = []
                res.push(e.slice(0, 4))
                res.push(e.slice(6, 8))
                res.push(e.match(/A:\w{2}/)[0])
                res.push(e.match(/X:\w{2}/)[0])
                res.push(e.match(/Y:\w{2}/)[0])
                res.push(e.match(/P:\w{2}/)[0])
                res.push(e.match(/SP:\w{2}/)[0])
                res.push(e.match(/CYC:\w+/)[0])
                return res
            })
    })
const p2 = fs.readFile('./scripts/my-nestest-log.log')
    .then(data => {
    return data
        .toString()
        .split('\n')
        .slice(0, -1)
        .map(e => {
            const res = []
            res.push(e.slice(0, 4))
            res.push(e.slice(5, 7))
            res.push(e.match(/(A:\w+) /)[1])
            res.push(e.match(/(X:\w+) /)[1])
            res.push(e.match(/(Y:\w+) /)[1])
            res.push(e.match(/(P:\w+) /)[1])
            res.push(e.match(/(SP:\w+) /)[1])
            res.push(e.match(/CYC:\w+/)[0])
            return res
        })
})

Promise.all([p1, p2])
    .then(res => {
        const res1 = res[0]
        const res2 = res[1]
        for (let i = 0; i < res1.length; i ++) {
            const item1 = res1[i]
            const item2 = res2[i]
            switch (item1[0].toLowerCase()) {
                case 'c826':
                    continue
            }
            for (let j = 0; j < item1.length; j++) {
                if (item1[j].toLowerCase() !== item2[j].toLowerCase()) {
                    console.log(item1)
                    console.log(item2)
                    throw new Error()
                }
            }
        }
    })