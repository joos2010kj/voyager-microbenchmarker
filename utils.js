
/**
 * Convert String to Hash Code
 *
 * @see http://stackoverflow.com/q/7616461/940217
 * @return {number}
 */
String.prototype.hashCode = function () {
  if (Array.prototype.reduce) {
    return this.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
  }
  var hash = 0;
  if (this.length === 0) return hash;
  for (var i = 0; i < this.length; i++) {
    var character = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

const fs = require("fs");
const csv2json = require('csvjson-csv2json');


function csvjson(path) {
  csv = fs.readFileSync(path, "utf8")
  const json = csv2json(csv, { parseNumbers: true });

  // var array = csv.toString().split("\n");
  // let result = [];
  // let headers = array[0].split(",")

  // for (let i = 1; i < array.length - 1; i++) {
  //   let obj = {}
  //   let str = array[i]
  //   let s = ''

  //   let flag = 0
  //   for (let ch of str) {
  //     if (ch === '"' && flag === 0) {
  //       flag = 1
  //     }
  //     else if (ch === '"' && flag == 1) flag = 0
  //     if (ch === ',' && flag === 0) ch = '|'
  //     if (ch !== '"') s += ch
  //   }

  //   let properties = s.split("|")
  //   for (let j in headers) {
  //     if (properties[j].includes(", ")) {
  //       obj[headers[j]] = properties[j]
  //         .split(", ").map(item => item.trim())
  //     }
  //     else obj[headers[j]] = properties[j]
  //   }

  //   // Add the generated object to our
  //   // result array
  //   result.push(obj)
  //   console.log(obj)
  // }

  return json;
}

module.exports = { String, csvjson };

// console.log(csvjson("CSV_file.csv"))