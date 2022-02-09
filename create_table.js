const fs = require('fs')
const { Pool, Client } = require('pg')
var format = require('pg-format');
const duckdb = require('duckdb');
const { Dataflow } = require('vega-dataflow');
const { Connection, DuckDB, RowResultFormat } = require("node-duckdb");




var myArgs = process.argv;
if (myArgs.length > 2 && myArgs[2] == 'pg') {
  var flag = 1;
}
else {
  var flag = 0;
}

async function createTable(json_example, csv_path, name) {

  let data = [];
  try {
    data = fs.readFileSync(json_example, 'utf8')
    //console.log(data)
  } catch (err) {
    console.error(err)
  }

  let client;
  var exists = false;

  try {
    if (flag == 0) {
      // var db = new duckdb.Database('./database/scalable-vega.db');

      // client = await db.connect();
      const db = new DuckDB({ path: './database/scalable-vega.db' });
      client = new Connection(db);

      // await client.execute('select * from ' + name.toLowerCase(), function (err, results) {
      //   if (err) {
      //     console.log("doesn't exist but error inserting", err)
      //     exists = false;
      //     console.log('table ' + name + ' does not exist');
      //   }
      //   else {
      //     exists = true;
      //     console.log('table ' + name + ' already exists');
      //     client.execute(`drop table '${name}';`, function (err, res) {
      //       if (err) {
      //         throw err;
      //       }
      //       console.log(res)
      //     });
      //   }
      //   console.log('select * from ' + name.toLowerCase());
      //   insert(data, csv_path, name, client, exists);
      //   console.log('Created Table');
      // });
      insert(data, csv_path, name, client, exists);



    }
    else {
      const pool = new Pool({
        user: 'yangjunran',
        host: 'localhost',
        database: 'scalable_vega',
        password: 'postgres',
        port: 5432,
      });
      const existsQueryStr = 'select exists(select 1 from information_schema.tables where 		table_name=' +
        '\'' + name.toLowerCase() + '\');'

      client = await pool.connect();
      const response = await client.query(existsQueryStr);
      if (response.rows[0]['exists']) {
        exists = true;
        console.log('table ' + name + ' already exists');
      } else {
        exists = false;
        console.log('table ' + name + ' does not exist');
      }
      insert(data, csv_path, name, client, exists);
    }
  } catch (err) {
    console.log(err, "entire")
  } finally {
    console.log("Final");
  }


};

async function insert(data, csv_path, name, client, exists) {
  data = JSON.parse(data);
  console.log(data[0], "data")
  const schema = postgresSchemaFor(data[0]);
  // Create table if it doesn't exist yet
  if (!exists) {
    console.log('creating table ' + name);
    console.log('built postgres schema: ' + JSON.stringify(schema));
    const createTableQueryStr = createTableQueryStrFor(name, schema);
    console.log('running create query: ' + createTableQueryStr);
    if (flag == 1) {
      await client.query(createTableQueryStr);

    }
    else {
      console.log(createTableQueryStr, "schema")
      await client.execute(createTableQueryStr);
    }
  }
  // Insert values

  // Build attribute list string e.g. (attr1, attr2, attr3)
  let attrNames = [];
  for (const attrName in schema) {
    if (!schema.hasOwnProperty(attrName)) {
      continue;
    }
    attrNames.push(attrName);
  }
  const attrNamesStr = listToSQLTuple(attrNames, false);

  // Transform data from JSON format into a 2d array where each row is a list of attribute values
  // with the same attribute order as the attribute list string above.
  const rows = [];
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const row = [];
    for (let j = 0; j < attrNames.length; j++) {
      row.push(item[attrNames[j]]);
    }
    rows.push(row);
  }

  // Execute the insert queries.

  let queryStr = format("insert into " + name + " (" + attrNamesStr + ") values %L", rows);
  console.log('running insert queries for ' + name);
  console.log(rows[1])
  //console.log(attrNamesStr)
  if (flag == 1) {
    queryStr = `\COPY ${name} FROM '${csv_path}' DELIMITER ',' CSV HEADER;`
    await client.query(queryStr);

  }
  else {

    var querysql = `COPY ${name} FROM '${csv_path}' (DELIMITER ',', HEADER);`

    await client.execute(querysql, function (err, res) {
      if (err) {
        console.log("error insering rows", err)
        //console.log(queryStr)

        throw err;
      }
      console.log(res[0])
    });

    await client.all('SELECT count(*) FROM ' + name, function (err, res) {
      if (err) {
        throw err;
      }
      console.log(res)
    });

  }



}

function postgresTypeFor(value) {
  // FixMe: want to use INTs too, if possible.
  // Client needs to send more type data in this case.
  const type = typeof value;
  if (type === 'string') {
    return flag == 1 ? 'VARCHAR(256)' : 'VARCHAR';
  } else if (type === 'number') {
    return flag == 1 ? 'FLOAT' : 'DOUBLE';
  } else if (type === 'boolean') {
    return 'BOOLEAN';
  } else {
    throw 'undefined type: \'' + type + '\'';
  }
}

function postgresSchemaFor(dataObj) {
  const schema = {};
  console.log(dataObj)
  for (var property in dataObj) {
    if (dataObj.hasOwnProperty(property)) {
      schema[property] = postgresTypeFor(dataObj[property]);
    }
  }
  return schema;
}

function createTableQueryStrFor(tableName, schema) {
  let out = 'create table if not exists ' + tableName + '('
  let first = true;
  for (var attrName in schema) {
    if (!schema.hasOwnProperty(attrName)) {
      continue;
    }
    let attrType = schema[attrName];
    if (first) {
      first = false;
    } else {
      out += ', ';
    }
    out += (attrName + ' ' + attrType)
  }
  out += ');';
  return out;
}

function listToSQLTuple(l, keepQuotes) {
  let out = JSON.stringify(l);
  out = out.substring(1, out.length - 1);
  out = out.replace(/'/g, '\'\'');
  out = out.replace(/"/g, keepQuotes ? '\'' : '');
  return out;
}


createTable('generated_cars.json', '/Users/yangjunran/Desktop/github/sv-microbenckmark/voyager-microbenchmarker/crossfilter-benchmark/data/cars/cars_2m.csv', 'car_2m')

module.exports = {
  createTable
};