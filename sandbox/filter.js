const seedrandom = require('seedrandom'),
      assert = require('assert'),
      fs = require('fs'),
      { Transform } = require('../transform.js'),
      { generate } = require("../param_generator.js"),
      { STAT, generate_examples } = require('../example_generator.js');

const methods = ["between", "not_between", "equal", "not_equal", "is_null", "is_not_null"];
const attributes = ["Miles_per_Gallon", "Cylinders", "Displacement", "Horsepower", "Weight_in_lbs", "Acceleration"]; 
const batch_size = 10; // How many examples of each method do you want?

const combiner = [];

methods.forEach(method => {
    attributes.forEach(attribute => {
        let output = generate(batch_size, attribute, method);
        combiner.push(...output);
    })
})

const uniqueCombiner = [...new Set(combiner)].sort((a, b) => a.localeCompare(b));

// Displays hundreds of possible filter expressions, using all methods.
console.log(uniqueCombiner);
