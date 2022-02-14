const vega = require('vega');
const fs = require('fs');

/*
>>> df = pd.read_csv('../result_10000000.csv')
>>> df.to_json('result_10000000.json', orient='records', indent=2)
*/

const metadata = JSON.parse(fs.readFileSync("../quant_and_qual_stat.json", 'utf-8'));
let sampleCount = 1;
const URL = [
    "result_500000.json", 
    "result_1000000.json", 
    "result_2000000.json", 
    "result_5000000.json", 
    "result_10000000.json",
]

// '../cars.json', 
// "https://vega.github.io/vega-datasets/data/cars.json",

let i = 1

const categories = [
    ...Object.keys(metadata['quantitative']), 
    ...Object.keys(metadata['categorical'])
]

function generateSpec(datasetSize, sampleCount) {
    const samples = Array(...categories).sort(() => Math.random() - Math.random()).slice(0, sampleCount)
    const sample_as = Array(...samples).map(f => `name_${i++}`)
    const spec = {};
    
    spec["$schema"] = "https://vega.github.io/schema/vega/v5.json";
    spec["description"] = "sandbox";
    spec["width"] = 400;
    spec["height"] = 200;
    spec["padding"] = 5;
    spec["data"] = [
        {
            name: "sandbox",
            url: URL[datasetSize],
            transform: [
                {
                    type: 'project',
                    fields: samples,
                    as: sample_as
                }
            ]
        }
    ]

    return spec;
}


async function computeSpeed(spec, sampleCount) {
    let parsed = await vega.parse(spec);
    let t = Date.now();
    let view = await new vega.View(parsed).runAsync();
    let time = Date.now() - t;
    let len = view.data('sandbox').length
    return { sampleCount, len, time }
}

async function run() {
    for (let i = 0; i < 10; i++) { 
        let sampleCount = Math.floor(Math.random() * categories.length) + 1
        let datasetSize = Math.floor(Math.random() * URL.length) 
        let spec = generateSpec(datasetSize, sampleCount);
    
        await computeSpeed(spec, sampleCount).then(({ sampleCount, len, time }) => console.log(sampleCount, len, time))
    }
}

run()

