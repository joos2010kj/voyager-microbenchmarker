const seedrandom = require('seedrandom'),
      assert = require('assert'),
      fs = require('fs'),
      { Transform } = require('./transform.js'),
      { STAT, generate_examples } = require('./example_generator.js');

const sample_count = 1000;
const seed = "rng";
const rng = seedrandom(seed);

const getSampleIndex = () => Math.round(sample_count * rng());

const Miles_per_Gallon = generate_examples(STAT['Miles_per_Gallon'], sample_count, false).sort((a, b) => a.toString().localeCompare(b.toString()));
const Cylinders = generate_examples(STAT["Cylinders"], sample_count, true).sort((a, b) => a.toString().localeCompare(b.toString()));
const Displacement = generate_examples(STAT["Displacement"], sample_count, true).sort((a, b) => a.toString().localeCompare(b.toString()));
const Horsepower = generate_examples(STAT['Horsepower'], sample_count, true).sort((a, b) => a.toString().localeCompare(b.toString()));
const Weight_in_lbs = generate_examples(STAT['Weight_in_lbs'], sample_count, true).sort((a, b) => a.toString().localeCompare(b.toString()));
const Acceleration = generate_examples(STAT['Acceleration'], sample_count, false).sort((a, b) => a.toString().localeCompare(b.toString()));
const storage = {
    Miles_per_Gallon, Cylinders, Displacement, Horsepower, Weight_in_lbs, Acceleration
};

function generate(count, field, command) {
    assert.ok(["between", "not_between", "equal", "not_equal", "is_null", "is_not_null"].includes(command))
    let holder = []

    for (let attr in storage) {
        if (field == attr || field == 'all') {
            for (let repeat = 0; repeat < count; repeat++) {
                const [ min, max ] = storage[attr][getSampleIndex()];
                const [ inclusive1, inclusive2 ] = [ rng() > 0.5, rng() > 0.5 ];

                let expression;

                if (command == "between")
                    expression = Transform.Filter.between(attr, min, inclusive1, max, inclusive2)['expr'];
                else if (command == "not_between")
                    expression = Transform.Filter.not_between(attr, min, inclusive1, max, inclusive2)['expr'];
                else if (command == "equal")
                    expression = Transform.Filter.equal(attr, min)['expr'];
                else if (command == "not_equal")
                    expression = Transform.Filter.not_equal(attr, min)['expr'];
                else if (command == "is_null")
                    expression = Transform.Filter.is_null(attr, min)['expr'];
                else if (command == "is_not_null")
                    expression = Transform.Filter.is_not_null(attr, min)['expr'];

                holder.push(expression)
            }
        }
    }
        
    return holder;
}

const COUNT = 10;
const ATTRIBUTE = "Weight_in_lbs";
const FUNC = "between";
const STORE_IN_JSON = false;
const OUTPUT_FILE = "./output.json"

let output = generate(COUNT, ATTRIBUTE, FUNC)

// console.log(output);

if (STORE_IN_JSON) {
    fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, '\t'), err => {
        if (err) {
            console.log('Error writing file', err)
        } else {
            console.log('Successfully wrote file')
        }
    })
}

module.exports = { generate };