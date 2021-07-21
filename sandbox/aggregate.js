const seedrandom = require('seedrandom'),
      assert = require('assert'),
      fs = require('fs'),
      { Transform } = require('../transform.js'),
      { generate } = require("../param_generator.js"),
      { STAT, generate_examples } = require('../example_generator.js');

const methods = [
    Transform.Aggregate.count,
    Transform.Aggregate.valid,
    Transform.Aggregate.missing,
    Transform.Aggregate.distinct,
    Transform.Aggregate.sum,
    Transform.Aggregate.product,
    Transform.Aggregate.mean,
    Transform.Aggregate.average,
    Transform.Aggregate.variance,
    Transform.Aggregate.variancep,
    Transform.Aggregate.stdev,
    Transform.Aggregate.stdevp,
    Transform.Aggregate.median,
    Transform.Aggregate.min,
    Transform.Aggregate.max
]

const attributes = ["Miles_per_Gallon", "Cylinders", "Displacement", "Horsepower", "Weight_in_lbs", "Acceleration"]; 

const rng = seedrandom("rng");

function rngFactory(hasGroupby, opCount) {
    const production = [];

    function getRandomAttribute() {
        return attributes[Math.floor(rng() * attributes.length)];
    }

    function getRandomOp() {
        return methods[Math.floor(rng() * methods.length)];
    }

    if (hasGroupby == true) {
        production.push(Transform.Aggregate.groupby(getRandomAttribute()));
    }    

    for (let i = 0; i < opCount; i++) {
        production.push(getRandomOp()(getRandomAttribute()));
    }    

    return Transform.Aggregate.Merge(...production);
}

let child1 = Transform.Aggregate.Merge(
    Transform.Aggregate.valid("hi"), 
    Transform.Aggregate.min("bye"),
    Transform.Aggregate.groupby("why")
);

let child2 = Transform.Aggregate.Merge(
    Transform.Aggregate.sum("foo"),
    Transform.Aggregate.groupby("bar")
);

console.log(child1);
console.log(child2);

// Specify 

const HAS_GROUPBY = true;
const NUMBER_OF_OPERATIONS = 5;
const STORE_IN_JSON = false;
const OUTPUT_FILE = "aggregate_samples.json"

const output = rngFactory(HAS_GROUPBY, NUMBER_OF_OPERATIONS);

console.log(output);

if (STORE_IN_JSON) {
    fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, '\t'), err => {
        if (err) {
            console.log('Error writing file', err)
        } else {
            console.log('Successfully wrote file')
        }
    })
}
