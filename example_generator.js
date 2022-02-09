/**
 *                    Mean                  STD                 Min     MAX     StrictInt
 * Miles_per_Gallon : 23.514572864321607	7.815984312565783	9	    46.6    False
 * Cylinders        : 5.475369458128076	    1.7121596315485292	3	    8       True
 * Displacement     : 194.77955665024618	104.92245837948867	68	    455     True
 * Horsepower       : 105.08250000000002	38.768779183105224	46	    230     True
 * Weight_in_lbs    : 2979.4137931034484	847.0043282393514	1613	5140    True
 * Acceleration     : 15.51970443349754	    2.8033588163425462	8	    24.8    False
 */
const { Transform } = require('./VegaTemplate.js')
var sqlTemplate = require('./SQLtemplate')
const seedrandom = require('seedrandom');
const rng = seedrandom('rng');      // SEED (If you don't want seed, replace all rng with Math.random())

const quan_col_stat = {
  "Miles_per_Gallon": [23.514572864321607, 7.815984312565783, 9, 46.6, 0],
  "Cylinders": [5.475369458128076, 1.7121596315485292, 3, 8, 1],
  "Displacement": [194.77955665024618, 104.92245837948867, 68, 455, 1],
  "Horsepower": [105.08250000000002, 38.768779183105224, 46, 230, 1],
  "Weight_in_lbs": [2979.4137931034484, 847.0043282393514, 1613, 5140, 1],
  "Acceleration": [15.51970443349754, 2.8033588163425462, 8, 24.8, 0]
}

const cat_col = { "Origin": ['USA', 'Europe', 'Japan'] }


function random_choice(array, cnt = 1) {
  let res = [];
  // console.log(array)
  //console.log(getRandomInteger(0, array.length - 1))
  var t = array[getRandomInteger(0, array.length - 1)];
  console.log(t, "undefine?")

  while (res.length < cnt) {
    if (!res.includes(t)) res.push(t)
    t = array[getRandomInteger(0, array.length - 1)];
  }
  return res;
}
function getRandomInteger(min, max) {

  return Math.floor(min + randn() * (max + 1 - min))
}

function randn(min = 0, max = 1) {
  var u = 0;
  while (u === 1) u = rng()
  return rng() * (max - min) + min;
}

function generate_examples(stats) {
  let ranges = [];
  let [mean, std, min, max, strictInt] = stats;

  function randn_bm() {
    var u = 0, v = 0;
    while (u === 1) u = rng();
    while (v === 1) v = rng();

    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }




  function generate_example_normal() {
    let range = [randn_bm(), randn_bm()].map(each => {
      return each * std + mean
    })

    range = range.sort((a, b) => a - b)

    range[0] = Math.max(min, range[0])
    range[1] = Math.min(max, range[1])

    return strictInt ? range.map(each => Math.round(each)) : range;
  }



  ranges.push(generate_example_uniform());

  return ranges;
}

function generate_example_uniform(attr) {
  let [mean, std, min, max, strictInt] = attr;
  let range = [randn(min, max), randn(min, max)]

  range = range.sort((a, b) => a - b)

  return strictInt ? range.map(each => Math.floor(each)) : range;
}

function filter_params() {

  const col_choice = Math.floor(rng() * (Object.keys(quan_col_stat).length + Object.keys(cat_col).length));
  const op = random_choice(["between", "not_between", "equal", "not_equal", "is_null", "is_not_null"]);

  const [inclusive1, inclusive2] = [rng() > 0.5, rng() > 0.5];
  let attr, extent;

  if (col_choice < Object.keys(quan_col_stat).length) {
    attr = Object.keys(quan_col_stat)[col_choice]
    extent = generate_example_uniform(quan_col_stat[[Object.keys(quan_col_stat)[col_choice]]]);

  } else {
    attr = Object.keys(cat_col)[col_choice % Object.keys(cat_col).length]
    const cat_choice = cat_col[attr]
    extent = random_choice(cat_choice, 2).sort()
  }

  let expression, sqlString, [min, max] = extent;

  if (op == "between") {
    expression = Transform.Filter.between(attr, min, inclusive1, max, inclusive2)['expr'];
    sqlString = sqlTemplate.Transform.Filter.between(attr, min, inclusive1, max, inclusive2);
  } else if (op == "not_between") {
    expression = Transform.Filter.not_between(attr, min, inclusive1, max, inclusive2)['expr'];
    sqlString = sqlTemplate.Transform.Filter.not_between(attr, min, inclusive1, max, inclusive2)
  } else if (op == "equal") {
    expression = Transform.Filter.equal(attr, min)['expr'];
    sqlString = sqlTemplate.Transform.Filter.equal(attr, min, inclusive1, max, inclusive2)
  } else if (op == "not_equal") {
    expression = Transform.Filter.not_equal(attr, min)['expr'];
    sqlString = sqlTemplate.Transform.Filter.not_equal(attr, min, inclusive1, max, inclusive2)

  } else if (op == "is_null") {
    expression = Transform.Filter.is_null(attr, min)['expr'];
    sqlString = sqlTemplate.Transform.Filter.is_null(attr, min, inclusive1, max, inclusive2)

  } else if (op == "is_not_null") {
    expression = Transform.Filter.is_not_null(attr, min)['expr'];
    sqlString = sqlTemplate.Transform.Filter.is_not_null(attr, min, inclusive1, max, inclusive2)
  }

  return { transform: 'filter', attr, expr: expression, sql: sqlString }

}

function aggregate_params() {

  const op = random_choice(["count", "valid", "missing", "distinct", "sum", "mean", "average", "variance", "variancep", "stdev", "stdevp", "median", "min", "max"]);
  //const col_choices = random_choice(Object.keys(quan_col_stat).concat(Object.keys(cat_col), ['None']), 2)

  const groupby = random_choice(Object.keys(quan_col_stat).concat(Object.keys(cat_col), ['None']))
  const field = random_choice(Object.keys(quan_col_stat))
  let expr, sqlString;
  //console.log(col_choices, "cols")

  if (groupby == 'None') {
    //let field = col_choices[0] === 'None' ? col_choices[1] : col_choices[0];
    expr = { type: 'aggregate', ops: op, field: field }
    //sqlString = sqlTemplate.Transform.Aggregate.build({ fields: [field], op: op });
    sqlString = { pg: sqlTemplate.Transform.Aggregate.build({ fields: [field], op: op }, "postgres"), duck: sqlTemplate.Transform.Aggregate.build({ fields: [field], op: op }, "duckdb") };
  } else {
    // expr = { type: 'aggregate', ops: op, field: [col_choices[0]], groupby: [col_choices[1]] }
    // console.log([col_choices[1]], 'grou')

    // sqlString = sqlTemplate.Transform.Aggregate.build({ fields: [col_choices[0]], op: op, groupby: [col_choices[1]] });
    expr = { type: 'aggregate', ops: op, field: field, groupby: groupby }
    //console.log([col_choices[1]], 'grou')

    sqlString = { pg: sqlTemplate.Transform.Aggregate.build({ fields: [field], op: op, groupby: [groupby] }, "postgres"), duck: sqlTemplate.Transform.Aggregate.build({ fields: [field], op: op, groupby: [groupby] }, "duckdb") };
  }

  return { transform: 'aggregate', expr: expr, sql: sqlString }

}

function numBins(metric, defaultBins) {
  var h = binWidth(metric), ulim = Math.max.apply(Math, metric), llim = Math.min.apply(Math, metric);
  if (h <= (ulim - llim) / metric.length) {
    return defaultBins || 10; // Fix num bins if binWidth yields too small a value.
  }
  return Math.ceil((ulim - llim) / h);
}

function binWidth(metric) {
  return 2 * iqr(metric) * Math.pow(metric.length, -1 / 3);
}

function iqr(metric) {
  var sorted = metric.slice(0).sort(function (a, b) { return a - b; });
  var q1 = sorted[Math.floor(sorted.length / 4)];
  var q3 = sorted[Math.floor(sorted.length * 3 / 4)];
  return q3 - q1;
}

function bin_params() {
  const field = random_choice(Object.keys(quan_col_stat))
  const extent = [quan_col_stat[field][2], quan_col_stat[field][3]]
  const maxbins = 5 //for now
  expr = { type: 'bin', field: field, extent: extent, maxbins: maxbins }
  sqlString = sqlTemplate.Transform.Bin.maxbins(field, extent[0], extent[1], maxbins)
  return { transform: 'bin', expr: expr, sql: sqlString }
}

function stack_params() {
  const [groupby] = random_choice(Object.keys(quan_col_stat).concat(Object.keys(cat_col)))
  function select_sort(except) {
    var res = random_choice(Object.keys(quan_col_stat).concat(Object.keys(cat_col)));
    while (res == groupby) {
      res = random_choice(Object.keys(quan_col_stat).concat(Object.keys(cat_col)))
    }
    return res;
  }

  function select_field(except) {
    var res = random_choice(Object.keys(quan_col_stat));
    while (res == groupby) {
      res = random_choice(Object.keys(quan_col_stat))
    }
    return res;
  }
  const [sort] = select_sort();
  const [field] = select_field();

  let expr = {
    type: 'stack', field: field, groupby: [groupby], "sort": {
      "field": [sort],
      "order": ["descending"]
    }
  }
  sqlString = sqlTemplate.Transform.Stack.property(expr)
  return { transform: 'stack', expr: expr, sql: sqlString }
}

// let res = []
// let iter = 10;
// for (var i = 0; i < iter; i++) {
//   res.push(aggregate_params())
// }
// console.log(res)




module.exports = { quan_col_stat, generate_examples, filter_params, aggregate_params, bin_params, stack_params };
