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
      {
        "calculate": "datum.name == 'vg' ? 'Vega' : datum.name == 'duck'?'duckdb':'Postgres'",
        "as": "application"
      }
    ],
    "mark": "bar",
    "encoding": {
      "x": {
        "field": "application",
        "axis": {
          "title": ""
        }
      },
      "y": {
        "aggregate": "average",
        "field": "runtime",
        "title": "Runtime(ms)",
        "axis": {
          "grid": false
        },
        "scale": {
          "type": "log"
        }
      },
      "column": {
        "field": "transform",
        "type": "nominal",
        "spacing": 10,
        "title": "Transform"
      },
      "row": {
        "field": "dataset",
        "title": "Dataset Size"
      },
      "color": {
        "field": "application"
      }
    },
    "config": {
      "view": {
        "stroke": "transparent"
      },
      "axis": {
        "domainWidth": 1
      }
    }
  };



  fs.writeFile(dest, JSON.stringify(spec), function (err) {
    if (err) {
      console.log(err);
    }
  });
}
module.exports = { save_chart }
