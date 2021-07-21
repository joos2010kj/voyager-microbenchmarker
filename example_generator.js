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

const cat_col = { "origin": ['USA', 'Europe', 'Japan'] }


function random_choice(array, cnt = 1) {
  let res = [];
  var t = array[Math.floor(rng() * array.length) % array.length];
  while (!res.includes(t) && res.length < cnt) {
    res.push(t)
    t = array[Math.floor(Math.random() * array.length) % array.length];
  }
  return res;
}
function randn(min = 0, max = 1) {
  var u = 0;
  while (u === 1) u = rng()
  return rng() * (max - min + 1) + min;
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

  return [expression, sqlString]

}

let res = []
let iter = 10;
for (var i = 0; i < iter; i++) {
  res.push(filter_params())
}
console.log(res)




module.exports = { quan_col_stat, generate_examples };
