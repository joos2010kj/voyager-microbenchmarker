const util = require('vega-util'),
  vega = require('vega-dataflow'),
  tx = require('vega-transforms'),
  changeset = vega.changeset,
  Collect = tx.collect,
  Filter = tx.filter,
  { filter_params } = require('./example_generator.js'),
  { save_chart } = require('./bar_chart'),
  { String } = require('./utils.js');

const { Pool, Client } = require('pg')
var format = require('pg-format');
const benchmark = require('./runner')
const fs = require('fs')

let data = [];
try {
  data = fs.readFileSync('generated_cars.json', 'utf8')
  data = JSON.parse(data);
  //console.log(data)
} catch (err) {
  console.error(err)
}


const df = new vega.Dataflow(),
  e0 = df.add(null),
  c0 = df.add(Collect),
  f0 = df.add(Filter, { expr: e0, pulse: c0 }),
  c1 = df.add(Collect, { pulse: f0 });

async function vg(expression, attr) {
  df.update(e0, util.accessor(datum => eval(expression), [attr])).run();
  df.runAsync()
  // console.log(c1.value)
  return c1.value.length;
}

df.pulse(c0, changeset().insert(data));

async function run_example(example, table_name) {

  // String for the PostgreSQL table name
  const tableName = 'car_50k'

  let sqlQuery = format(example.sql, tableName, tableName);
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


  const fn = async () => {
    await benchmark.benchmarkPromise(vg, example.expr, example.attr, example.transform);
    await benchmark.benchmarkPromise(query, sqlQuery, example.transform);
    pool.end()
  };

  await fn();


}



let examples = []
let iter = 10;
for (var i = 0; i < iter; i++) {
  examples.push(filter_params())
}
// console.log(examples);


(async () => {
  for (var ind in examples) {

    await run_example(examples[ind]);

  }
  const runtime = benchmark.show();
  save_chart(runtime, './barchart.vl.json')

})();

