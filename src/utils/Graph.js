class Graph {
    constructor() {
        this.tracker = []
    }

    update(number) {
        this.tracker.push(number)
    }

    display(increment, text, symbol) {
        let bottles = Array(100 / increment).fill(0)

        if (symbol == undefined) {
            symbol = "x"
        }

        for (let i = 0; i < this.tracker.length; i++) {
            let currentNumber = this.tracker[i] * 100;
            let index = Math.floor(currentNumber / increment)

            bottles[index] += 1
        }

        if (text) {
            let longTxt = "";

            for (let i = 0; i < bottles.length; i++) {
                let txt = `${("0" + i * increment).slice(-2)} | `;

                for (let pt = 0; pt < bottles[i]; pt++) {
                    txt += symbol
                }

                longTxt += txt + "\n"
            }

            return longTxt
        } else {
            return bottles;
        }
    }
}

module.exports = Graph
