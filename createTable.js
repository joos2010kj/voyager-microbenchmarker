const fs = require('fs')
const { Pool, Client } = require('pg')
var format = require('pg-format');



async function createTable(data_file, name) {

  let data = [];
  try {
    data = fs.readFileSync(data_file, 'utf8')
    //console.log(data)
  } catch (err) {
    console.error(err)
  }

  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'scalable_vega',
    password: 'postgres',
    port: 5432,
  });
  let client;
  var exists = false;
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
    await client.query(createTableQueryStr);

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
    const queryStr = format('insert into ' + name + ' (' + attrNamesStr + ') values %L', rows);
    console.log('running insert queries for ' + name);
    await client.query(queryStr);
  }


}

function postgresTypeFor(value) {
  // FixMe: want to use INTs too, if possible.
  // Client needs to send more type data in this case.
  const type = typeof value;
  if (type === 'string') {
    return 'VARCHAR(256)';
  } else if (type === 'number') {
    return 'FLOAT';
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


createTable('json_data_1m.json', 'car_1m')

module.exports = {
  createTable
};