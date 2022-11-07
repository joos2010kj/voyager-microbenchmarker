const DataFrame = require('./utils/DataFrame.js');
const fs = require("fs")
const csv = require('fast-csv');

const path = "/Users/hyekangjoo/Desktop/repo/voyager-microbenchmarker/crossfilter-benchmark/data/weather/weather.csv"

/*
* Given the path to a csv dataset, identifies the type of each field
*/
const data = [];
let df;

csv.parseFile(path, { headers: true })
    .on("data", d => {
        data.push(d);
    })
    .on("end", () => {
        console.log(`Completed Loading ${data.length} Rows!`);
        df = new DataFrame(data);
        console.log("Completed Loading DataFrame!");

        let attrs = {}

        for (let col of df.columns) {
            let track = [];
            
            for (let row of df.getColumns([col]).vectorize()) {
                row = row[0]

                if (typeof(row) == "string") {
                    if (["TRUE", "FALSE"].includes(row.toUpperCase())) {
                        track.push("bool")
                    } else if (!isNaN(parseFloat(row)) && isFinite(row)) {                        
                        if (Math.floor(row) == row) {
                            track.push("int/float")
                        } else {
                            track.push("float")
                        }
                    } else if (/^\d{4}-\d{2}-\d{2}$/.test(row) || /^\d{2}-\d{2}-\d{4}$/.test(row)) {
                        track.push("date")
                    } else if (["NAN", "NULL", "UNDEFINED", "NONE"].includes(row.toUpperCase())) {
                        track.push("null")
                    } else {
                        track.push("string")
                    }
                } else {
                    throw Error("Make sure every element is wrapped in string")
                }
            }
            
            if (track[0].includes("float")) {
                if (track.filter(f => f == "int/float").length == track.length) {
                    attrs[col] = "int";
                } else {
                    attrs[col] = "float";
                }
            } else {
                if (track.filter(f => f == track[0]).length == track.length) {
                    attrs[col] = track[0];
                }
            }
        }

        console.log(attrs)
    })
