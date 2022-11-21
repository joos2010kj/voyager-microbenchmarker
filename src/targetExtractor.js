const fs = require("fs")
const vega = require('vega');

const path = "/Users/hyekangjoo/Desktop/repo/voyager-microbenchmarker/example/histogram/histogram.json"
const spec = JSON.parse(fs.readFileSync(path, 'utf-8'));
const mappers = [];

// Vega Transform       - O
// Vega Cardinality     - O
// DB Transform         - O
// DB Cardinality       - X
async function compute() {
    const parsed = await vega.parse(spec);
    const view = await new vega.View(parsed).runAsync();
    const data = view["_runtime"]["data"];
    let out = {};

    for (let i = 0 ; i < spec["data"].length; i++) {
        const name = spec["data"][i]["name"];
        const input = data[name]["input"];
        const vegaData = recurse(input["_targets"], data[name]["output"]["id"], input.constructor.name, {});
        
        const dbData = {};

        spec["data"][i]["transform"].forEach(f => {
            add(dbData, f["type"], 1);
        })

        const subnet = {};

        Object.keys(vegaData).forEach(f => {
            subnet[`vega_${f}`] = vegaData[f];
        })

        Object.keys(dbData).forEach(f => {
            subnet[`db_${f}`] = dbData[f];
        })

        out = merge(out, subnet);
    }
    
    return out;
}

function merge(map1, map2) {
    return Object.entries(map2).reduce((acc, [key, value]) => ({ ...acc, [key]: (acc[key] || 0) + value }), { ...map1 });
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
