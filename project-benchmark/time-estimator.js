const { ExampleGenerator } = require('../ExampleGenerator')
const fs = require('fs');

const metadata = "../quant_and_qual_stat.json";
const data = "../cars.json"
const URL = "https://vega.github.io/vega-datasets/data/cars.json"

const stringify = false;

const Generator = ExampleGenerator.init(metadata, stringify);

const samples = Generator.Project.generate(2);
const json = JSON.parse(fs.readFileSync(data, 'utf-8'));

let spec = {};

spec["$schema"] = "https://vega.github.io/schema/vega/v5.json";
spec["description"] = "sandbox";
spec["width"] = 400;
spec["height"] = 200;
spec["padding"] = 5;
spec["data"] = [
    {
        name: "sandbox",
        url: URL,
        transform: samples
    }
]

fs.writeFileSync("temp.json", JSON.stringify(spec, null, 2))

