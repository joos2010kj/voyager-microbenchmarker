const fs = require('fs')
const data = require('./runtime.json');
// const data = [
//   {"vega": "1", "transformation": "filter", "runtime": 110, "size": "5k"}, 
//   {"vega": "2", "transformation": "filter", "runtime": 130, "size": "5k"}, 
//   {"vega": "1", "transformation": "aggregate", "runtime": 150, "size": "5k"},
//   {"vega": "2", "transformation": "aggregate", "runtime": 120, "size": "5k"},
//   {"vega": "1", "transformation": "bin", "runtime": 100, "size": "5k"},
//   {"vega": "2", "transformation": "bin", "runtime": 170, "size": "5k"},
//   {"vega": "1", "transformation": "extent", "runtime": 110, "size": "5k"},
//   {"vega": "2", "transformation": "extent", "runtime": 110, "size": "5k"},
//   {"vega": "1", "transformation": "filter", "runtime": 200, "size": "10k"}, 
//   {"vega": "2", "transformation": "filter", "runtime": 230, "size": "10k"}, 
//   {"vega": "1", "transformation": "aggregate", "runtime": 250, "size": "10k"},
//   {"vega": "2", "transformation": "aggregate", "runtime": 220, "size": "10k"},
//   {"vega": "1", "transformation": "bin", "runtime": 200, "size": "10k"},
//   {"vega": "2", "transformation": "bin", "runtime": 370, "size": "10k"},
//   {"vega": "1", "transformation": "extent", "runtime": 310, "size": "10k"},
//   {"vega": "2", "transformation": "extent", "runtime": 210, "size": "10k"}
// ];

const spec = {
    "data": {
      "values": data
    },
    "transform": [
      {"calculate": "datum.vega == 1 ? 'Vega' : 'Postgres'", "as": "application"}
    ],
    "facet": {"column": {"field": "size", "title": "Dataset Size"}},
    "spec": {
      "mark": "bar",
      "encoding": {
        "x": {
          "field": "application",
          "axis": {"title": ""}
        },
        "y": {
          "aggregate": "sum", 
          "field": "runtime",
          "title": "Runtime(ms)",
          "axis": {"grid": false}
        },
        "column": {
          "field": "transformation", "type": "nominal", 
          "spacing": 10, "title": "Transformation"
        },
        "color": {
          "field": "application"
        }
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