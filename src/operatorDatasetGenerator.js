const fs = require('fs');
const tqdm = require("tqdm");
const { generateSpec, computeSpeed } = require('./utils/vega_util')

/* Required data:
*  quant_and_qual_stat.json
*  result_*.json
*/
const PREFIX = "../example/cars"
const metadata = JSON.parse(fs.readFileSync(PREFIX + "/raw/quant_and_qual_stat.json", 'utf-8'));
const URL = [
    "result_500000.json", 
    "result_1000000.json", 
    "result_2000000.json", 
    // "result_5000000.json", 
    // "result_10000000.json",
].map(f => PREFIX + "/generated/" + f)

const categories = [
    ...Object.keys(metadata['quantitative']), 
    ...Object.keys(metadata['categorical'])
]

const config = {
    prefix: PREFIX,
    metadata: metadata,
    url: URL,
    categories: categories,
}

async function run(iter, path) {
    let result = [];

    for (let i of tqdm([...Array(iter).keys()])) {
        let datasetSize = Math.floor(Math.random() * URL.length)
        let { spec, supplementary } = generateSpec(datasetSize, config["url"], "stack");

        await computeSpeed(spec, supplementary)
            .then(({ len, time, supplementary }) => {
                supplementary["len"] = len;
                supplementary["time"] = time;
                supplementary["source"] = URL[supplementary["datasetSize"]]

                delete supplementary["datasetSize"]

                result.push(supplementary)

                if (i % 25 == 0) {
                    fs.writeFileSync(path, JSON.stringify(result, null, 2))
                }
                
                return supplementary
            }).then(supplementary => console.log(
                i
            ))
    }
}

run(1000, "stack_record_2.json")
