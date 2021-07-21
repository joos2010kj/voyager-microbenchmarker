const util = require('vega-util'),
  vega = require('vega-dataflow'),
  tx = require('vega-transforms'),
  assert = require('assert'),
  changeset = vega.changeset,
  Collect = tx.collect,
  Filter = tx.filter,
  fetch = require('node-fetch'),
  seedrandom = require('seedrandom'),
  { Transform } = require('./VegaTemplate.js'),
  { STAT, generate_examples } = require('./example_generator.js'),
  { String } = require('./utils.js');

const { Pool, Client } = require('pg')
var format = require('pg-format');
var sqlTemplate = require('./SQLtemplate')
const benchmark = require('./runner')
const fs = require('fs')

let data = [];
try {
  data = fs.readFileSync('car_1m.json', 'utf8')
  data = JSON.parse(data);
  // console.log(data)
} catch (err) {
  console.error(err)
}


const df = new vega.Dataflow(),
  e0 = df.add(null),
  c0 = df.add(Collect),
  f0 = df.add(Filter, { expr: e0, pulse: c0 }),
  c1 = df.add(Collect, { pulse: f0 });

const sample_count = 1000;
const seed = "rng";
const rng = seedrandom(seed);

const getSampleIndex = () => Math.round(sample_count * rng());
const convertToHashCode = (array) => array.map(each => JSON.stringify(each)).sort((a, b) => a.localeCompare(b)).toString().hashCode()

async function vg_measure(count, type) {
  // console.time(`Benchmark Test ${count} (${type})`);
  // df.runAsync().then(() => console.timeEnd(`Benchmark Test ${count} (${type})`));
  df.runAsync()
  return c1.value.length;
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

async function filter_test(category, count, table_name) {
  const [min, max] = storage[category][getSampleIndex()];
  const [inclusive1, inclusive2] = [rng() > 0.5, rng() > 0.5];
  const expression = Transform.Filter.between(category, min, inclusive1, max, inclusive2)['expr'];

  df.update(e0, util.accessor(datum => eval(expression), [category])).run();
  // measure(count, 'between')



  // String for the PostgreSQL table name
  const tableName = 'car_1m'

  //let sqlString = transform.Transform.Bin.maxbins("Miles_per_gallon", 0, 5, 10);
  let sqlString = sqlTemplate.Transform.Filter.between(category, min, inclusive1, max, inclusive2);
  // sqlString = 'select count(*) from car_1m group by miles_per_gallon'
  console.log(sqlString);
  let sqlQuery = format(sqlString, tableName, tableName);
  const pool = new Pool({
    user: "yangjunran",
    host: "localhost",
    database: "scalable_vega",
    password: "1234",
    port: "5432"
  })
  const query = async (sqlQuery) => {

    try {
      const client = await pool.connect();
      const res = await client.query(sqlQuery);
      client.release();
      return res.rows.length
      //console.log('SELECT pool.query():', res)
    } catch (err) {
      console.error(err);
    }

  }


  const fn2 = async () => {
    await benchmark.benchmarkPromise(vg_measure, count, 'between');
    await benchmark.benchmarkPromise(query, sqlQuery);
    //pool.end()
    //benchmark.show();
  };

  //fn();
  await fn2();


}

(async () => {
  const init = Date.now();

  await filter_test("Miles_per_Gallon", attempt++);
  await filter_test("Cylinders", attempt++);
  await filter_test("Horsepower", attempt++);
  await filter_test("Displacement", attempt++);
  await filter_test("Weight_in_lbs", attempt++);
  await filter_test("Acceleration", attempt++);
  benchmark.show();

  console.log(Date.now() - init, "ms");

})();
// filter_test("Miles_per_Gallon", attempt++);
// filter_test("Cylinders", attempt++);
// filter_test("Horsepower", attempt++);
// filter_test("Displacement", attempt++);
// filter_test("Weight_in_lbs", attempt++);
// filter_test("Acceleration", attempt++, 'car_1m');
