const fs = require('fs')
//const data = require('./runtime.json');
// const data = [
//   {"vega": "1", "transformation": "filter", "runtime": 110},
//   {"vega": "2", "transformation": "filter", "runtime": 130},
//   {"vega": "1", "transformation": "aggregate", "runtime": 150},
//   {"vega": "2", "transformation": "aggregate", "runtime": 120},
//   {"vega": "1", "transformation": "bin", "runtime": 100},
//   {"vega": "2", "transformation": "bin", "runtime": 170},
//   {"vega": "1", "transformation": "extent", "runtime": 110},
//   {"vega": "2", "transformation": "extent", "runtime": 110}
// ];

function save_chart(data, dest) {


  const spec = {
    "data": {
      "values": data
    },
    "transform": [
      { "calculate": "datum.name == 'vg' ? 'Vega' : 'Postgres'", "as": "application" }
    ],
    "width": { "step": 12 },
    "mark": "bar",
    "encoding": {
      "column": {
        "field": "transform", "type": "nominal", "spacing": 10
      },
      "y": {
        "aggregate": "average",
        "field": "runtime",
        "title": "runtime",
        "axis": { "grid": false }
      },
      "x": {
        "field": "application",
        "axis": { "title": "" }
      },
      "color": {
        "field": "application",
        "scale": { "range": ["#216d96", "#675193"] }
      }
    },
    "config": {
      "view": { "stroke": "transparent" },
      "axis": { "domainWidth": 1 }
    }
  };

  fs.writeFile(dest, JSON.stringify(spec), function (err) {
    if (err) {
      console.log(err);
    }
  });
}
module.exports = { save_chart }
