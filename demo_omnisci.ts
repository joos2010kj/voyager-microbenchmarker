import * as vega from "vega";
import QueryCore from "vega-transform-omnisci-core";
var MapdCon = require("@mapd/connector/dist/browser-connector");
import { specRewrite } from "./spec_rewrite"

var startTime, endTime;

const connection = new MapdCon()
  .protocol("https")
  .host("metis.mapd.com")
  .port("443")
  .dbName("mapd")
  .user("mapd")
  .password("HyperInteractive");

connection.connectAsync().then(session => {
  // assign session to OmniSci Core transform
  QueryCore.session(session);
  const newspec = specRewrite(spec)
  rename(newspec.data, "querycore")

  vega.transforms["querycore"] = QueryCore;

  console.log(newspec, "rewrite");


  const runtime = vega.parse(newspec);
  console.log(runtime, "runtime");

  const view = new vega.View(runtime)
    .logLevel(vega.Info)
    .renderer("svg")
    .initialize(document.querySelector("#view"));
  console.log(view, "runtime");

  startTime = performance.now();
  view.runAsync();
  view.runAfter(view => {
    endTime = performance.now();
    console.log(`Transformation time: ${endTime - startTime}`);
  })

});


function rename(dataSpec, type) {
  for (var i = 0; i < dataSpec.length; i++) {
    var spec = dataSpec[i]
    for (const transform of spec.transform) {
      if (transform.type === "dbtransform") transform.type = type

    }
  }
}

const spec: vega.Spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "autosize": "pad",
  "padding": 5,
  "width": 600,
  "height": 250,
  "signals": [
    {
      "name": "field",
      "value": "airtime",
      "bind": {
        "input": "select",
        "options": [
          "deptime",
          "crsdeptime",
          "arrtime",
          "crsarrtime",
          "flightnum",
          "actualelapsedtime",
          "crselapsedtime",
          "airtime",
          "arrdelay",
          "depdelay",
          "distance",
          "taxiin",
          "taxiout",
          "carrierdelay",
          "weatherdelay",
          "nasdelay",
          "securitydelay",
          "lateaircraftdelay",
          "plane_year"
        ]
      }
    },
    {
      "name": "maxbins",
      "value": 20,
      "bind": {
        "input": "range",
        "min": 1,
        "max": 300,
        "debounce": 100
      }
    }
  ],
  "data": [
    {
      "name": "flights",
      "transform": [
        {
          "type": "dbtransform",
          "relation": "flights_donotmodify"
        }
      ]
    },
    {
      "name": "table",
      "source": "flights",
      "transform": [
        {
          "type": "extent",
          "field": {
            "signal": "field"
          },
          "signal": "extent"
        },
        {
          "type": "bin",
          "signal": "bins",
          "field": {
            "signal": "field"
          },
          "extent": {
            "signal": "extent"
          },
          "maxbins": {
            "signal": "maxbins"
          }
        },
        {
          "type": "aggregate",
          "key": "bin0",
          "groupby": [
            "bin0",
            "bin1"
          ],
          "fields": [
            "bin0"
          ],
          "ops": [
            "count"
          ],
          "as": [
            "count"
          ]
        }
      ]
    }
  ],
  "marks": [
    {
      "name": "marks",
      "type": "rect",
      "from": {
        "data": "table"
      },
      "encode": {
        "update": {
          "fill": {
            "value": "steelblue"
          },
          "x2": {
            "scale": "x",
            "field": "bin0",
            "offset": {
              "signal": "(bins.stop - bins.start)/bins.step > 150 ? 0 : 1"
            }
          },
          "x": {
            "scale": "x",
            "field": "bin1"
          },
          "y": {
            "scale": "y",
            "field": "count"
          },
          "y2": {
            "scale": "y",
            "value": 0
          }
        }
      }
    }
  ],
  "scales": [
    {
      "name": "x",
      "type": "linear",
      "domain": {
        "signal": "[bins.start, bins.stop]"
      },
      "range": [
        0,
        {
          "signal": "width"
        }
      ],
      "zero": false,
      "bins": {
        "signal": "bins"
      }
    },
    {
      "name": "y",
      "type": "linear",
      "domain": {
        "data": "table",
        "field": "count"
      },
      "range": [
        {
          "signal": "height"
        },
        0
      ],
      "nice": true,
      "zero": true
    }
  ],
  "axes": [
    {
      "scale": "x",
      "orient": "bottom",
      "grid": false,
      "title": {
        "signal": "field"
      },
      "labelFlush": true,
      "labelOverlap": true
    },
    {
      "scale": "y",
      "orient": "left",
      "grid": true,
      "title": "Count of Records",
      "labelOverlap": true,
      "gridOpacity": 0.7
    }
  ],
  "config": {
    "axisY": {
      "minExtent": 30
    }
  }
};
