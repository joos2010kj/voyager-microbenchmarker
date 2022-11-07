// const { ExampleGenerator } = require("./ExampleGenerator.js");

// const path = "../example/cars/raw/quant_and_qual_stat.json";
// const stringify = true;

// const Generator = ExampleGenerator.init(path);

// const result = [Generator.Filter.generate(1)[0], Generator.Aggregate.generate(1)[0], Generator.Project.generate(1)[0], Generator.Extent.generate(1)[0], Generator.Collect.generate(1)[0]];

// console.log(result[1])


const fs = require("fs")
const vega = require('vega');

const path = "/Users/hyekangjoo/Desktop/repo/voyager-microbenchmarker/example/histogram/histogram.json"
const spec = JSON.parse(fs.readFileSync(path, 'utf-8'));
const mappers = [];

async function compute() {
    const parsed = await vega.parse(spec);
    const view = await new vega.View(parsed).runAsync();
    const runtime = view["_runtime"];
    
    const data = runtime["data"]
    const input = data["directors"]["input"];

    const vegaData = recurse(input["_targets"], data["directors"]["output"]["id"], input.constructor.name, {});
    
    const dbData = {};

    spec["data"][0]["transform"].forEach(f => {
        add(dbData, f["type"], 1);
    })
    
    console.log(dbData)
}

function recurse(target, cancel, parent, storage) {
    if (target === undefined) {
        return storage
    }

    for (let elm of target) {
        if (elm["id"] == cancel) {
            return storage;
        }

        const name = elm.constructor.name;

        if (name == "Collect") {
            add(storage, `${parent}_card`, elm["value"].length)
        } else {
            add(storage, name, 1)
        }

        storage = recurse(elm["_targets"], cancel, elm.constructor.name, storage)
    }

    return storage
}

function add(mapper, key, val) {
    if (mapper[key] === undefined) {
        mapper[key] = 0;
    }

    mapper[key] += val;
}

compute();

// {
//     "Filter": 2, // sum of all filters
//     "Aggregate": 1,
//     "Window": 1,
//     "Filter_Card":0 //sum of all cards (Collect["value"])
// }