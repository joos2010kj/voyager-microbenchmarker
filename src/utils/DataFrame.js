const utils = require('./basic_util.js')

class DataFrame {
    constructor(array) {
        if (array == undefined) {
            array = []
        }
        
        this.data = array;
        this.length = this.data.length;

        if (array.length == 0) {
            this.empty = true;
            this.columns = []
        } else {
            this.empty = false;
            this.columns = Object.keys(array[0]);
        }
    }

    getColumns(cols) {
        let newData = [];

        for (let elm of this.data) {
            let obj = {}

            for (let col of cols) {
                obj[col] = elm[col]
            }

            newData.push(obj);
        }

        return new DataFrame(newData);
    }

    loc(indices) {
        let newData = [];

        for (let i = indices[0]; i < indices[1]; i++) {
            newData.push(this.data[i]);
        }

        return new DataFrame(newData)
    }

    getDummies(col) {
        let df = this.getColumns([col])
        let attributes = Array.from(new Set(df.data.map(k => k[Object.keys(k)[0]])))
        let obj = {}

        for (let att of attributes) {
            let name = att
            obj[name] = [];
        }

        for (let elm of df.data) {
            let category = elm[col]

            for (let attr of attributes) {
                if (attr == category) {
                    obj[attr].push(1)
                } else {
                    obj[attr].push(0)
                }
            }
        }

        let newData = []

        for (let i = 0; i < df.data.length; i++) {
            let stub = {};
            let sum = 0

            for (let attr of attributes) {
                stub[`${col}_${attr}`] = obj[attr][i]
                sum += obj[attr][i]
            }

            if (sum != 1) {
                throw Error()
            }

            newData.push(stub)
        }

        return new DataFrame(newData)
    }

    head(count) {
        return this.loc([0, Math.min(count, this.data.length - 1)])
    }

    tail(count) {
        return this.loc([Math.max(0, this.data.length - 1 - (count)), this.data.length - 1])
    }

    prettify(padding, all) {
        let data;

        if (padding == undefined) {
            padding = 10;
        }

        if (this.data.length < 10 || all) {
            data = this.data;
        } else {
            data = [...this.head(5).data, ...this.tail(5).data]
        }
            
        let txt = "\t"
        
        for (let i = 0; i < this.columns.length; i++) {
            let attr = `                    ${this.columns[i]}`
            let len = Math.max(this.columns[i].length, padding)
            txt += `| ${attr.slice(-len)} |`
        }

        txt += "\n"

        for (let i = 0; i < data.length; i++) {
            txt += `| ${i}\t`
            let datum = data[i];

            for (let col of this.columns) {
                txt += `| ${datum[col]}`

                for (let j = 0; j < Math.max(col.length, padding) - datum[col].toString().length + 1; j++) {
                    txt += " "
                }

                txt += "|"
            }

            txt += "\n"
        }

        return txt
    }

    concatenate(df) {
        let myData = this.data;
        let otherData = df.data;

        if (myData.length != otherData.length) {
            throw Error();
        }

        let newData = [];

        for (let i = 0; i < myData.length; i++) {
            newData.push(Object.assign({}, myData[i], otherData[i]))
        }

        return new DataFrame(newData);
    }

    append(otherDf) {
        if (this.columns.sort().toString() != otherDf.columns.sort().toString()) {
            if (!this.empty && !otherDf.empty) {
                throw Error();
            }
        }

        let newData = [
            ...this.data,
            ...otherDf.data
        ];

        return new DataFrame(newData)
    }

    sample() {
        let res = ""
        let size = 0;

        for (let i = 0; i < this.columns.length; i++) {
            size = Math.max(this.columns[i].length, size);
        }

        for (let key in this.data[0]) {
            let digit = ""
            for (let i = 0; i < size; i++) {
                digit += " "
            }
            digit += key
            digit = digit.slice(-size)
            res += `${digit}: ${this.data[0][key]}\n`
        }

        return res
    }

    setInputs(arr) {
        this.inputAttributes = arr;
    }

    setOutputs(arr) {
        this.outputAttributes = arr;
    }

    getInputs(columnsOnly) {
        if (this.inputAttributes != undefined) {
            if (columnsOnly == true) {
                return this.inputAttributes;
            } else {
                return this.getColumns(this.inputAttributes)
            }
        } else {
            return undefined;
        }
    }

    getOutputs(columnsOnly) {
        if (this.outputAttributes != undefined) {
            if (columnsOnly == true) {
                return this.outputAttributes;
            } else {
                return this.getColumns(this.outputAttributes)
            }
        } else {
            return undefined;
        }
    }

    shuffle(inplace) {
        // Fisher-Yates (aka Knuth) Shuffle
        let res = (function (array) {     
            let currentIndex = array.length,  randomIndex;
        
            // While there remain elements to shuffle...
            while (currentIndex != 0) {
        
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
        
            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
            }
        
            return array;
        })(this.data);

        if (inplace) {
            this.data = res;
        } else {
            return new DataFrame(res);
        }
    }

    clone() {
        return new DataFrame([...this.data])
    }

    crossvalidation(fold, shuffle) {
        let folds = utils.crossvalidation(fold, this.length);
        let df;

        if (shuffle) {
            df = this.clone().shuffle();
        } else {
            df = this.clone();
        }

        let subset = {}

        for (let i = 0; i < folds.length; i++) {
            let [ begin, end ] = folds[i];
            
            let train = new DataFrame([
                ...df.loc([0, begin]).append(df.loc([end, df.length])).data
            ])

            let test = new DataFrame([
                ...df.loc([begin, end]).data
            ])

            subset[i] = [train, test]
        }

        return subset
    }

    vectorize() {
        let newData = [];

        for (let each of this.data) {
            let data = [];

            for (let col of this.columns) {
                data.push(each[col])
            }

            newData.push(data)
        }
        
        return newData
    }

    average() {
        let newData = {};
        for (let col of this.columns) {
            newData[col] = this.getColumns([col]).vectorize().reduce((a, b) => parseFloat(a) + parseFloat(b)) / this.length
        }

        return new DataFrame([newData])
    }
}

module.exports = DataFrame
