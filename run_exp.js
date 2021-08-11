const util = require('vega-util'),
  vega = require('vega-dataflow'),
  tx = require('vega-transforms'),
  changeset = vega.changeset,
  Collect = tx.collect,
  Filter = tx.filter,
  Aggregate = tx.aggregate,
  Extent = tx.extent,
  Project = tx.project,
  Bin = tx.bin
const encode = require('vega-encode'),
  Stack = encode.stack,
  { filter_params, aggregate_params, bin_params, stack_params } = require('./example_generator.js'),
  { save_chart } = require('./bar_chart'),
  { String } = require('./utils.js'),
  { ExampleGenerator } = require('./ExampleGenerator.js');
const { createWriteStream } = require("fs");
const { Transform } = require("stream");
const { loader, read } = require('vega-loader')
const vg = require('vega')
const { csvjson } = require('./utils.js');




const { Pool, Client } = require('pg')
const Cursor = require('pg-cursor')

const duckdb = require('duckdb');
var format = require('pg-format');
const benchmark = require('./runner')
const fs = require('fs')
const { Connection, DuckDB, RowResultFormat } = require("node-duckdb");
const { group } = require('console');


class Example {
  constructor(expl_json, data, table) {
    this.expr = expl_json.expr;
    this.sql = expl_json.sql;
    this.transform = expl_json.transform;
    this.data = data;
    this.table = table;
  }

  async run() {
    // String for the PostgreSQL table name
    const tableName = this.table;
    console.log(tableName, "namemmmmm")


    //let sqlQuery = format(this.sql, tableName, tableName);
    let pg_sql, duck_sql;
    if (typeof this.sql !== "string") {
      pg_sql = format(this.sql.pg, tableName, tableName);
      duck_sql = format(this.sql.duck, tableName, tableName);
    } else {
      pg_sql = duck_sql = format(this.sql, tableName, tableName);
    }
    const pool = new Pool({
      user: "yangjunran",
      host: "localhost",
      database: "scalable_vega",
      password: "1234",
      port: "5432"
    })
    const pg_client = await pool.connect();

    //var db = new duckdb.Database('./database/scalable-vega3.db');


    const postgres = async (sqlQuery) => {

      try {
        const res = await pg_client.query(sqlQuery);
        pg_client.release();
        return res.rows.length
        //console.log('SELECT pool.query():', res)
      } catch (err) {
        console.error(err);
      }

    }
    var db = new DuckDB({ path: './database/scalable-vega.db' });
    const connection = new Connection(db);
    //var duck_client = await db.connect();

    const duck = async (sqlQuery) => {
      let res;

      const result = await connection.executeIterator(sqlQuery, { rowResultFormat: RowResultFormat.Array });
      //console.log(result)
      res = result.fetchAllRows();

      connection.close();
      db.close();

      return res.length;
    }

    await benchmark.benchmarkPromise(this.vg, this, this.transform, this.table);
    await benchmark.benchmarkPromise(postgres, pg_sql, this.transform, this.table);
    await pool.end();

    await benchmark.benchmarkPromise(duck, duck_sql, this.transform, this.table);


  }
}

class Filter_Example extends Example {
  constructor(expl_json, data, table) {
    super(expl_json, data, table);
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
  constructor(expl_json, data, table) {
    super(expl_json, data, table);
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

class Bin_Example extends Example {
  constructor(expl_json, data, table) {
    super(expl_json, data, table);
    //this.sql = 'select count(*), bin0 from (select bin0 + 5 as bin1 , * from (select 5 * floor((Acceleration - cast(5 as float))/ 5) as bin0, * from %I where Acceleration between 5 and 25) as sub UNION ALL select NULL as bin0, NULL as bin1, * from %I where Acceleration is null) binning group by bin0';
    this.df = new vega.Dataflow()
    this.c = this.df.add(Collect)
    this.b = this.df.add(Bin, {
      field: util.field(this.expr.field),
      interval: false,
      extent: this.expr.extent,
      //step: 5,
      maxbins: this.expr.maxbins,
      nice: false,
      pulse: this.c
    });

    this.out = this.df.add(Collect, { pulse: this.b });
  }

  async vg(self) {
    self.df.pulse(self.c, changeset().insert(self.data)).runAsync();

    //self.df.runAsync()
    //console.log(self.out.value, "pulse")
    return self.out.value.length;
  }

}

class Stack_Example extends Example {
  constructor(expl_json, data, table) {
    super(expl_json, data, table);
    this.df = new vega.Dataflow()
    this.c0 = this.df.add(Collect)
    var gb = this.df.add(this.expr.groupby.map(e => util.field(e)))
    this.st = this.df.add(Stack, {
      groupby: gb,
      field: util.field(this.expr.field),
      sort: util.compare(this.expr.sort.field[0], this.expr.sort.order[0]),
      pulse: this.c0
    });


    this.out = this.df.add(Collect, { pulse: this.st });
  }

  async vg(self) {
    self.df.pulse(self.c0, changeset().insert(self.data)).runAsync();

    //self.df.runAsync()
    //console.log(self.c0.value, "pulse")
    return self.c0.value.length;
  }
}

class Extent_Example extends Example {
  constructor(expl_json, data, table) {
    super(expl_json, data, table);
    this.df = new vega.Dataflow();
    this.col = this.df.add(Collect)
    const property = {
      pulse: this.col,
      field: util.field(this.expr.field)
    }
    if (this.expr.hasOwnProperty('signal')) {
      property.signal = util.field(this.expr.signal)
    }

    this.out = this.df.add(Extent, property);
  }

  async vg(self) {
    self.df.pulse(self.col, changeset().insert(self.data)).runAsync();

    //self.df.runAsync()
    //console.log(self.out.value)
    return self.out.value.length;
  }
}

class Project_Example extends Example {
  constructor(expl_json, data, table) {
    super(expl_json, data, table);
    this.df = new vega.Dataflow();
    this.col = this.df.add(Collect)
    const property = {
      pulse: this.col,
      fields: this.expr.fields.map(e => util.field(e))
    }

    this.out = this.df.add(Project, property);
  }

  async vg(self) {
    self.df.pulse(self.col, changeset().insert(self.data)).runAsync();

    //self.df.runAsync()
    // console.log(self.out.pulse.add.length)
    return self.out.pulse.add.length;
  }
}

class Collect_Example extends Example {
  constructor(expl_json, data, table) {
    super(expl_json, data, table);
    this.df = new vega.Dataflow();
    this.so = this.df.add(util.compare(this.expr.sort.field[0], this.expr.sort.order[0]));
    this.c0 = this.df.add(Collect, {
      sort: util.compare(this.expr.sort.field[0], this.expr.sort.order[0])
    })
  }

  async vg(self) {
    self.df.pulse(self.c0, changeset().insert(self.data)).runAsync();

    //self.df.runAsync()
    return self.c0.value.length;
  }
}




async function exp_with_size(data, table, iter) {
  let examples = []

  for (var i = 0; i < iter; i++) {
    examples.push(filter_params())
  }

  for (var ind in examples) {
    console.log(examples[ind])
    let ex = new Filter_Example(examples[ind], data, table);
    await ex.run();
  }

  examples = []
  for (var i = 0; i < iter; i++) {
    examples.push(aggregate_params())
  }
  for (var ind in examples) {
    console.log(examples[ind])
    let ex = new Aggregate_Example(examples[ind], data, table);
    await ex.run();
  }

  examples = []
  for (var i = 0; i < iter; i++) {
    examples.push(bin_params())
  }
  for (var ind in examples) {
    console.log(examples[ind])
    let ex = new Bin_Example(examples[ind], data, table);
    await ex.run();
  }

  examples = []
  for (var i = 0; i < iter; i++) {
    examples.push(stack_params())
  }
  for (var ind in examples) {
    console.log(examples[ind])
    let ex = new Stack_Example(examples[ind], data, table);
    await ex.run();
  }

  const path = "quant_and_qual_stat.json";
  const stringify = false;

  const Generator = ExampleGenerator.init(path, stringify);
  examples = []
  examples = Generator.Extent.generate(iter);
  for (var ind in examples) {
    console.log(examples[ind])
    let ex = new Extent_Example(examples[ind], data, table);
    await ex.run();
  }

  examples = Generator.Project.generate(iter);
  for (var ind in examples) {
    console.log(examples[ind])
    let ex = new Project_Example(examples[ind], data, table);
    await ex.run();
  }

  examples = Generator.Collect.generate(iter);
  for (var ind in examples) {
    console.log(examples[ind])
    let ex = new Collect_Example(examples[ind], data, table);
    await ex.run();
  }
}

var data_path = ['./crossfilter-benchmark/data/cars/cars_1m.csv', './crossfilter-benchmark/data/cars/cars_100k.csv', './crossfilter-benchmark/data/cars/cars_50k.csv', './crossfilter-benchmark/data/cars/cars.csv'];
var tables = ['car_1m', 'car_100k', 'car_50k', 'cars'];

// console.log(this.data[0], "this data")

(async () => {
  for (var ind in data_path) {
    var data = csvjson(data_path[ind]);
    console.log(tables[ind])
    await exp_with_size(data, tables[ind], 10);
  }


  const runtime = benchmark.show();
  console.log(runtime, "runnnn")
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