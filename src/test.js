const { ExampleGenerator } = require("./ExampleGenerator.js");

const path = "../example/cars/raw/quant_and_qual_stat.json";
const stringify = true;

const Generator = ExampleGenerator.init(path);

const result = [Generator.Filter.generate(1)[0], Generator.Aggregate.generate(1)[0], Generator.Project.generate(1)[0], Generator.Extent.generate(1)[0], Generator.Collect.generate(1)[0]];

console.log(result[0][0])