const fs = require("fs")
const DataFrame = require('./utils/DataFrame.js');

let root = "../example/cars/generated/ops/"
let save_root = "../example/cars/generated/normalized_ops/"
let ops = ["aggregate", "bin", "collect", "extent", "filter", "project", "stack"]
let paths = ops.map(a => root + a + "_record_" + (a == "stack" ? "1000" : "1500") + ".json");

let combo = [];

for (let i = 0; i < ops.length; i++) {
    let aggregate = JSON.parse(fs.readFileSync(paths[i], 'utf-8'));
    
    const commons = ["type", "ops", "sampleCount", "len", "groupby", "time"]
    
    function lenUpdate(str) {
        if (str.includes("result_500000.json")) {
            return 500000
        } else if (str.includes("result_1000000.json")) {
            return 1000000
        } else if (str.includes("result_2000000.json")) {
            return 2000000
        } else {
            throw Error();
        }
    }
    
    let df = new DataFrame(aggregate.map(f => {
        return {...f, len: lenUpdate(f["source"])}
    }))
    
    let commons_df = df.getColumns(commons)
    
    commons_df = commons_df.replace("groupby", undefined, 0)
    commons_df = commons_df.replace("sampleCount", undefined, 1)
    commons_df = commons_df.replace("ops", undefined, [])
    // commons_df = commons_df.replace("len", "__wildcard__", (f) => {return f / 100000})
    
    fs.writeFileSync(save_root + ops[i] + ".json", JSON.stringify(commons_df.data, null, 2))
    combo = [...combo, ...commons_df.data]
}

fs.writeFileSync(save_root + "all.json", JSON.stringify(combo, null, 2))
