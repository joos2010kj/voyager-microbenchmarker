const util = require('vega-util'),
  vega = require('vega-dataflow'),
  tx = require('vega-transforms'),
  changeset = vega.changeset,
  Collect = tx.collect,
  Filter = tx.filter,
  Aggregate = tx.aggregate,
  { filter_params, aggregate_params } = require('./example_generator.js'),
  { save_chart } = require('./bar_chart'),
  { String } = require('./utils.js');

const { Pool, Client } = require('pg')
var format = require('pg-format');
const benchmark = require('./runner')
const fs = require('fs')

class Example {
  constructor(expl_json) {
    this.expr = expl_json.expr;
    this.sql = expl_json.sql;
    this.transform = expl_json.transform;
    this.data;
  }

  init(path) {
    let data = [];
    try {
      data = fs.readFileSync(path, 'utf8')
      data = JSON.parse(data);
      //console.log(data)
    } catch (err) {
      console.error(err)
    }
    this.data = data;
  }

  async run() {
    // String for the PostgreSQL table name
    const tableName = 'car_50k'

    let sqlQuery = format(this.sql, tableName, tableName);
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
    await benchmark.benchmarkPromise(this.vg, this, this.transform);
    await benchmark.benchmarkPromise(query, sqlQuery, this.transform);

  }
}

class Filter_Example extends Example {
  constructor(expl_json) {
    super(expl_json);
    this.attr = expl_json.attr;
    this.df = new vega.Dataflow()
    this.e0 = this.df.add(null)
    this.c0 = this.df.add(Collect)
    this.f0 = this.df.add(Filter, { expr: this.e0, pulse: this.c0 })
    this.c1 = this.df.add(Collect, { pulse: this.f0 });
  }

  async vg(self) {
    self.df.pulse(self.c0, changeset().insert(self.data));
    self.df.update(self.e0, util.accessor(datum => eval(self.expr), [self.attr])).runAsync();
    //self.df.runAsync()
    return self.c1.value.length;
  }
}

class Aggregate_Example extends Example {
  constructor(expl_json) {
    super(expl_json);
    console.log(this)
    this.df = new vega.Dataflow();
    this.col = this.df.add(Collect)
    const property = {
      fields: this.expr.field.map(e => util.field(e)),
      ops: this.expr.op,
      pulse: this.col
    }
    if (this.expr.hasOwnProperty('groupby')) {
      property.groupby = this.expr.groupby.map(e => util.field(e))
    }
    const agg = this.df.add(Aggregate, property);

    this.out = this.df.add(Collect, { pulse: agg });
  }

  async vg(self) {
    self.df.pulse(self.col, changeset().insert(self.data)).runAsync();

    //self.df.runAsync()
    //console.log(self.out.value)
    return self.out.value.length;
  }
}



(async () => {
  let examples = []
  let iter = 10;
  for (var i = 0; i < iter; i++) {
    examples.push(filter_params())
  }

  for (var ind in examples) {
    console.log(examples[ind])
    let ex = new Filter_Example(examples[ind]);
    ex.init('generated_cars.json');
    await ex.run();
  }

  examples = []
  for (var i = 0; i < iter; i++) {
    examples.push(aggregate_params())
  }
  for (var ind in examples) {
    console.log(examples[ind])
    let ex = new Aggregate_Example(examples[ind]);
    ex.init('generated_cars.json');
    await ex.run();
  }

  const runtime = benchmark.show();
  console.log(runtime)
  save_chart(runtime, './barchart.vl.json')
})();

// for (var i = 0; i < iter; i++) {
//   examples.push(aggregate_params())
// }

// (async () => {
//   for (var ind in examples) {
//     console.log(examples[ind])
//     let ex = new Aggregate_Example(examples[ind]);
//     ex.init('generated_cars.json');
//     await ex.run();

//     //await run_example(examples[ind]);

//   }
//   const runtime = benchmark.show();
//   console.log(runtime)
//   save_chart(runtime, './barchart.vl.json')

// })();