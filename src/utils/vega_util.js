const vega = require('vega');
const { ExampleGenerator } = require("../ExampleGenerator.js");

const path = "../example/cars/raw/quant_and_qual_stat.json";
const stringify = true;

const Generator = ExampleGenerator.init(path);

function generateSpec(datasetSize, urls, transform) {
    let sample = undefined;
    let meta = null;
    let outermeta = "sampleCount";

    if (transform == "collect") {
        sample = Generator.Collect.generate(1)[0]
    } else if (transform == "project") {
        sample = Generator.Project.generate(1)[0]
    } else if (transform == "extent") {
        sample = Generator.Extent.generate(1)[0]
    } else if (transform == "aggregate") {
        sample = Generator.Aggregate.generate(1)[0]
        meta = ["ops"]
    } else if (transform == "filter") {
        sample = Generator.Filter.generate(1)[0]
        outermeta = ["sampleCount", "ops"]
    } else if (transform == "bin") {
        sample = Generator.Bin.generate(1)[0]
        outermeta = ["__omit__", "ops"]
    } else if (transform == "stack") {
        sample = Generator.Stack.generate(1)[0]
        outermeta = ["__omit__", "groupby"]
    } else {
        throw new Error();
    }

    const spec = {};
    
    spec["$schema"] = "https://vega.github.io/schema/vega/v5.json";
    spec["description"] = "sandbox";
    spec["width"] = 400;
    spec["height"] = 200;
    spec["padding"] = 5;
    spec["data"] = [
        {
            name: "sandbox",
            url: urls[datasetSize],
            transform: [ sample[0] ]
        }
    ]
    
    const supplementary = {
        type: transform,
        datasetSize: datasetSize
    }

    if (outermeta == "sampleCount") {
        supplementary["sampleCount"] = sample[1];
    } else {
        for (let i = 0; i < outermeta.length; i++) {
            if (outermeta[i] != "__omit__") {
                supplementary[outermeta[i]] = sample[1][i]
            }
        }
    }

    if (meta != null) {
        for (let i of meta) {
            if (i != "__omit__") {
                supplementary[i] = sample[0][i]
            }
        }
    }

    return { spec, supplementary };
}

async function computeSpeed(spec, supplementary) {
    let parsed = await vega.parse(spec);
    let t = Date.now();
    let view = await new vega.View(parsed).runAsync();
    let time = Date.now() - t;
    let len = view.data('sandbox').length

    return { len, time, supplementary }
}

module.exports = { generateSpec, computeSpeed };
