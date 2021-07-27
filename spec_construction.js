const fs = require('fs')
const data = require('./runtime.json');
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

const spec = {
    "data": {
      "values": data
    },
    "transform": [
      {"calculate": "datum.vega == 1 ? 'Vega' : 'Postgres'", "as": "application"}
    ],
    "width": {"step": 12},
    "mark": "bar",
    "encoding": {
      "column": {
        "field": "transformation", "type": "nominal", 
        "spacing": 10, "title": "Transformation"
      },
      "y": {
        "aggregate": "sum", 
        "field": "runtime",
        "title": "Runtime(ms)",
        "axis": {"grid": false}
      },
      "x": {
        "field": "application",
        "axis": {"title": ""}
      },
      "color": {
        "field": "application"
      }
    },
    "config": {
      "view": {"stroke": "transparent"},
      "axis": {"domainWidth": 1}
    }
  };

fs.writeFile("spec.json", JSON.stringify(spec), function(err) {
    if (err) {
        console.log(err);
    }
});