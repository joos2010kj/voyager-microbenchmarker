const fs = require('fs')
const { Pool, Client } = require('pg')
var format = require('pg-format');
const duckdb = require('duckdb');




var myArgs = process.argv;
if (myArgs.length > 2 && myArgs[2] == 'pg') {
  var flag = 1;
}
else {
  var flag = 0;
}

async function createTable(data_file, name) {

  let data = [];
  try {
    data = fs.readFileSync(data_file, 'utf8')
    //console.log(data)
  } catch (err) {
    console.error(err)
  }

  let client;
  var exists = false;

  try {
    if (flag == 0) {
      var db = new duckdb.Database('./database/scalable-vega3.db');

      client = await db.connect();
      await client.all('select * from ' + name.toLowerCase(), function (err, results) {
        if (err) {
          console.log("doesn't exist but error inserting", err)
          exists = false;
          console.log('table ' + name + ' does not exist');
        }
        else {
          exists = true;
          console.log('table ' + name + ' already exists');
          //client.run("drop table" + name);
          // client.all('drop table' + name, function (err, res) {
          //   if (err) {
          //     throw err;
          //   }
          //   console.log(res)
          // });
        }
        console.log('select * from ' + name.toLowerCase());
        insert(data, name, client, exists);
        console.log('Created Table');
      });



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
      insert(data, name, client, exists);
    }
  } catch (err) {
    console.log(err, "entire")
  } finally {
    console.log("Final");
  }


};

async function insert(data, name, client, exists) {
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
      await client.run(createTableQueryStr);
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
    queryStr = `\COPY ${name} FROM '/Users/yangjunran/Desktop/github/sv-microbenckmark/voyager-microbenchmarker/crossfilter-benchmark/data/cars/cars_1m.csv' DELIMITER ',' CSV HEADER;`
    await client.query(queryStr);

  }
  else {
    // //console.log("inserting....", queryStr)
    // let values, attr_strs = [];
    // for (var i = 0; i < rows.length; i++) {
    //   let attr_str;
    //   for (var j = 0; j < rows[0].length; j++) {
    //     rows[i][j] = typeof rows[i][j] == "string" ? '\"' + rows[i][j].replace(/'/g, "\\'") + '\"' : rows[i][j]
    //   }
    //   attr_strs.push(rows[i].join(","))

    // }
    // values = attr_strs.join("),(")
    // var querysql = "insert into " + name + " (" + attrNamesStr + ") values (" + values + ")"
    // //console.log(querysql)

    var querysql = `COPY ${name} FROM './crossfilter-benchmark/data/cars/cars_1m.csv' (DELIMITER ',', HEADER);`

    await client.all(querysql, function (err, res) {
      if (err) {
        console.log("error insering rows", err)
        //console.log(queryStr)

        throw err;
      }
      console.log(res[0])
    });
    //await client.run(queryStr);

    // var stmt = client.prepare("INSERT INTO " + name + " (" + attrNamesStr + ") VALUES (?)");
    // for (var i = 0; i < rows.length; i++) {
    //   let attr_str;
    //   for (var j = 0; j < rows[0].length; j++) {
    //     rows[i][j] = typeof rows[i][j] == "string" ? '\'' + rows[i][j] + '\'' : rows[i][j]
    //   }
    //   attr_str = rows[i].join(",")
    //   console.log(attr_str)
    //   await stmt.run(attr_str);
    // }
    // stmt.finalize();
    await client.all('SELECT count(*) FROM ' + name, function (err, res) {
      if (err) {
        throw err;
      }
      console.log(res)
    });

    // var stmt = client.prepare('INSERT INTO ' + name + ' (' + attrNamesStr + ') VALUES (?)', function (err, stmt) {
    //   for (var i = 0; i < rows.length; i++) {
    //     stmt.all(rows[i], function (err, res) {
    //       if (err) {
    //         throw err;
    //       }
    //     });
    //   }

    // });
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
  let out = 'create table ' + tableName + '('
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


createTable('generated_cars.json', 'car_1m')

module.exports = {
  createTable
};