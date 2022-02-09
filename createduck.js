const { Connection, DuckDB } = require("node-duckdb");

// let data = [];
// try {
//   data = fs.readFileSync(data_file, 'utf8')
//   //console.log(data)
// } catch (err) {
//   console.error(err)
// }

async function queryDatabaseWithIterator() {
  const db = new DuckDB({ path: './database/scalable-vega.db' });
  const connection = new Connection(db);
  //await connection.executeIterator('drop table car_100k;')
  await connection.executeIterator("create table cars(Name VARCHAR, Miles_per_Gallon DOUBLE, Cylinders DOUBLE, Displacement DOUBLE, Horsepower DOUBLE, Weight_in_lbs DOUBLE, Acceleration DOUBLE, Year VARCHAR, Origin VARCHAR);");

  var sqlQuery = `COPY cars FROM 'crossfilter-benchmark/data/cars/cars.csv' (DELIMITER ',', HEADER);`
  const result = await connection.executeIterator(sqlQuery);
  result.fetchAllRows();
  connection.close();
  db.close();
}

queryDatabaseWithIterator()