const vega = require('vega');
const { ExampleGenerator } = require("../ExampleGenerator.js");

const path = "../example/cars/raw/quant_and_qual_stat.json";
const stringify = true;

const Generator = ExampleGenerator.init(path);

function generateSpec(datasetSize, urls, transform) {
    let sample = undefined;

    if (transform == "collect") {
        sample = Generator.Collect.generate(1)[0]
    } else if (transform == "project") {
        sample = Generator.Project.generate(1)[0]
    } else if (transform == "extent") {
        sample = Generator.Extent.generate(1)[0]
    } else if (transform == "aggregate") {
        sample = Generator.Extent.generate(1)[0]
    } else if (transform == "filter") {
        sample = Generator.Extent.generate(1)[0]
    } else if (transform == "bin") {
        sample = Generator.Extent.generate(1)[0]
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
        datasetSize: datasetSize,
        sampleCount: sample[1]
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
