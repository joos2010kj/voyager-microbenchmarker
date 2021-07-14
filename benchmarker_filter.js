// Reference: https://github.com/vega/vega/blob/master/packages/vega-transforms/test/filter-test.js

const util = require('vega-util'),
      vega = require('vega-dataflow'),
      tx = require('vega-transforms'),
      assert = require('assert'),
      changeset = vega.changeset,
      Collect = tx.collect,
      Filter = tx.filter,
      fetch = require('node-fetch'),
      seedrandom = require('seedrandom'),
      { Transform } = require('./transform.js'),
      { STAT, generate_examples } = require('./example_generator.js'),
      { String } = require('./utils.js');
        
fetch("https://vega.github.io/vega-datasets/data/cars.json")
  .then(res => res.json())
  .then(data => {
    const df = new vega.Dataflow(),
          e0 = df.add(null),
          c0 = df.add(Collect),
          f0 = df.add(Filter, {expr: e0, pulse: c0}),
          c1 = df.add(Collect, {pulse: f0});

    const cloneData = JSON.parse(JSON.stringify(data));
    const sample_count = 1000;
    const seed = "rng";
    const rng = seedrandom(seed);

    const getSampleIndex = () => Math.round(sample_count * rng());
    const convertToHashCode = (array) => array.map(each => JSON.stringify(each)).sort((a, b) => a.localeCompare(b)).toString().hashCode()
    async function measure(count, type) {
      console.time(`Benchmark Test ${count} (${type})`);
      df.runAsync().then(() => console.timeEnd(`Benchmark Test ${count} (${type})`));
    }

    df.pulse(c0, changeset().insert(data));

    // Examples
    const Miles_per_Gallon = generate_examples(STAT['Miles_per_Gallon'], sample_count, false).sort((a, b) => a.toString().localeCompare(b.toString()));
    const Cylinders = generate_examples(STAT["Cylinders"], sample_count, true).sort((a, b) => a.toString().localeCompare(b.toString()));
    const Displacement = generate_examples(STAT["Displacement"], sample_count, true).sort((a, b) => a.toString().localeCompare(b.toString()));
    const Horsepower = generate_examples(STAT['Horsepower'], sample_count, true).sort((a, b) => a.toString().localeCompare(b.toString()));
    const Weight_in_lbs = generate_examples(STAT['Weight_in_lbs'], sample_count, true).sort((a, b) => a.toString().localeCompare(b.toString()));
    const Acceleration = generate_examples(STAT['Acceleration'], sample_count, false).sort((a, b) => a.toString().localeCompare(b.toString()));
    const storage = {
      Miles_per_Gallon, Cylinders, Displacement, Horsepower, Weight_in_lbs, Acceleration
    };

    let attempt = 1;

    // Between
    async function between_test(category, count, print) {
      const [ min, max ] = storage[category][getSampleIndex()];
      const [ inclusive1, inclusive2 ] = [ rng() > 0.5, rng() > 0.5 ];
      const expression = Transform.Filter.between(category, min, inclusive1, max, inclusive2)['expr'];
      
      df.update(e0, util.accessor(datum => eval(expression), [category])).run();
      measure(count, 'between')
      const res1 = c1.value;
      const res2 = cloneData.filter(datum => eval(expression));
      assert.strictEqual(res1.length, res2.length);
      assert.strictEqual(convertToHashCode(res1), convertToHashCode(res2));

      if (print) {
        console.log({
          inclusive1,
          inclusive2,
          min,
          max,
          expression
        });
      }
    }

    between_test("Miles_per_Gallon", attempt++);
    between_test("Cylinders", attempt++);
    between_test("Horsepower", attempt++);
    between_test("Displacement", attempt++);
    between_test("Weight_in_lbs", attempt++);
    between_test("Acceleration", attempt++);
    

    // Not Between
    async function not_between_test(category, count, print) {
      const [ min, max ] = storage[category][getSampleIndex()];
      const [ inclusive1, inclusive2 ] = [ rng() > 0.5, rng() > 0.5 ];
      const expression = Transform.Filter.not_between(category, min, inclusive1, max, inclusive2)['expr'];
      
      df.update(e0, util.accessor(datum => eval(expression), [category])).run();
      measure(count, "not_between")
      const res1 = c1.value;
      const res2 = cloneData.filter(datum => eval(expression));
      assert.strictEqual(res1.length, res2.length);
      assert.strictEqual(convertToHashCode(res1), convertToHashCode(res2));

      if (print) {
        console.log({
          inclusive1,
          inclusive2,
          min,
          max,
          expression
        });
      }
    }

    not_between_test("Miles_per_Gallon", attempt++);
    not_between_test("Cylinders", attempt++);
    not_between_test("Horsepower", attempt++);
    not_between_test("Displacement", attempt++);
    not_between_test("Weight_in_lbs", attempt++);
    not_between_test("Acceleration", attempt++);


    // Equal
    async function equal_test(category, count, print) {
      const [ min, max ] = storage[category][getSampleIndex()];
      const expression = Transform.Filter.equal(category, min)['expr'];
      
      df.update(e0, util.accessor(datum => eval(expression), [category])).run();
      measure(count, "equal")
      const res1 = c1.value;
      const res2 = cloneData.filter(datum => eval(expression));
      assert.strictEqual(res1.length, res2.length);
      assert.strictEqual(convertToHashCode(res1), convertToHashCode(res2));

      if (print) {
        console.log({
          inclusive1,
          inclusive2,
          min,
          max,
          expression
        });
      }
    }

    equal_test("Miles_per_Gallon", attempt++);
    equal_test("Cylinders", attempt++);
    equal_test("Horsepower", attempt++);
    equal_test("Displacement", attempt++);
    equal_test("Weight_in_lbs", attempt++);
    equal_test("Acceleration", attempt++);

    // Not Equal
    async function not_equal_test(category, count, print) {
      const [ min, max ] = storage[category][getSampleIndex()];
      const expression = Transform.Filter.not_equal(category, min)['expr'];
      
      df.update(e0, util.accessor(datum => eval(expression), [category])).run();
      measure(count, "not_equal")
      const res1 = c1.value;
      const res2 = cloneData.filter(datum => eval(expression));
      assert.strictEqual(res1.length, res2.length);
      assert.strictEqual(convertToHashCode(res1), convertToHashCode(res2));

      if (print) {
        console.log({
          inclusive1,
          inclusive2,
          min,
          max,
          expression
        });
      }
    }

    not_equal_test("Miles_per_Gallon", attempt++);
    not_equal_test("Cylinders", attempt++);
    not_equal_test("Horsepower", attempt++);
    not_equal_test("Displacement", attempt++);
    not_equal_test("Weight_in_lbs", attempt++);
    not_equal_test("Acceleration", attempt++);

    // is null
    async function is_null_test(category, count, print) {
      const [ min, max ] = storage[category][getSampleIndex()];
      const expression = Transform.Filter.is_null(category, min)['expr'];
      
      df.update(e0, util.accessor(datum => eval(expression), [category])).run();
      measure(count, "is_null")
      const res1 = c1.value;
      const res2 = cloneData.filter(datum => eval(expression));
      assert.strictEqual(res1.length, res2.length);
      assert.strictEqual(convertToHashCode(res1), convertToHashCode(res2));

      if (print) {
        console.log({
          inclusive1,
          inclusive2,
          min,
          max,
          expression
        });
      }
    }

    is_null_test("Miles_per_Gallon", attempt++);
    is_null_test("Cylinders", attempt++);
    is_null_test("Horsepower", attempt++);
    is_null_test("Displacement", attempt++);
    is_null_test("Weight_in_lbs", attempt++);
    is_null_test("Acceleration", attempt++);

    // is not null
    async function is_not_null_test(category, count, print) {
      const [ min, max ] = storage[category][getSampleIndex()];
      const expression = Transform.Filter.is_not_null(category, min)['expr'];
      
      df.update(e0, util.accessor(datum => eval(expression), [category])).run();
      measure(count, "is_not_null")
      const res1 = c1.value;
      const res2 = cloneData.filter(datum => eval(expression));
      assert.strictEqual(res1.length, res2.length);
      assert.strictEqual(convertToHashCode(res1), convertToHashCode(res2));

      if (print) {
        console.log({
          inclusive1,
          inclusive2,
          min,
          max,
          expression
        });
      }
    }

    is_not_null_test("Miles_per_Gallon", attempt++);
    is_not_null_test("Cylinders", attempt++);
    is_not_null_test("Horsepower", attempt++);
    is_not_null_test("Displacement", attempt++);
    is_not_null_test("Weight_in_lbs", attempt++);
    is_not_null_test("Acceleration", attempt++);
  });
