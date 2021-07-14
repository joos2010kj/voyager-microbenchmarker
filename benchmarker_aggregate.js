// Reference: https://github.com/vega/vega/blob/master/packages/vega-transforms/test/aggregate-test.js

const util = require('vega-util'),
      vega = require('vega-dataflow'),
      tx = require('vega-transforms'),
      assert = require('assert'),
      changeset = vega.changeset,
      Collect = tx.collect,
      Aggregate = tx.aggregate,
      fetch = require('node-fetch'),
      seedrandom = require('seedrandom'),
      { Transform } = require('./transform.js'),
      { STAT, generate_examples } = require('./example_generator.js'),
      { String } = require('./utils.js');

fetch("https://vega.github.io/vega-datasets/data/cars.json")
  .then(res => res.json())
  .then(data => {
    const key = util.field('k'),
          val = util.field('v'),
          df = new vega.Dataflow(),
          col = df.add(Collect),
          agg = df.add(Aggregate, {
            groupby: [key],
            fields: [val, val, val, val, val],
            ops: ['count', 'sum', 'min', 'max', 'product'],
            pulse: col
          }),
          out = df.add(Collect, {pulse: agg});

    const cloneData = JSON.parse(JSON.stringify(data));
    const sample_count = 1000;
    const seed = "3";
    const rng = seedrandom(seed);

    const getSampleIndex = (count) => Math.round(count * rng());
    const convertToHashCode = (array) => array.map(each => JSON.stringify(each)).sort((a, b) => a.localeCompare(b)).toString().hashCode()
    async function measure(count, type) {
      console.time(`Benchmark Test ${count} (${type})`);
      df.runAsync().then(() => console.timeEnd(`Benchmark Test ${count} (${type})`));
    }

    // Examples
    const Miles_per_Gallon = generate_examples(STAT['Miles_per_Gallon'], sample_count, false).sort((a, b) => a.toString().localeCompare(b.toString()));
    const Cylinders = generate_examples(STAT["Cylinders"], sample_count, true).sort((a, b) => a.toString().localeCompare(b.toString()));
    const Displacement = generate_examples(STAT["Displacement"], sample_count, true).sort((a, b) => a.toString().localeCompare(b.toString()));
    const Horsepower = generate_examples(STAT['Horsepower'], sample_count, true).sort((a, b) => a.toString().localeCompare(b.toString()));
    const Weight_in_lbs = generate_examples(STAT['Weight_in_lbs'], sample_count, true).sort((a, b) => a.toString().localeCompare(b.toString()));
    const Acceleration = generate_examples(STAT['Acceleration'], sample_count, false).sort((a, b) => a.toString().localeCompare(b.toString()));
    const storage = {
      Miles_per_Gallon, Cylinders, Displacement, Horsepower, Weight_in_lbs, Acceleration
    };

    let attempt = 1;

    let valid = Transform.Aggregate.valid("hi")
    let prod = Transform.Aggregate.groupby("pro")

    function merge(obj1, obj2) {
      let child = {}

      function bothParentsHave(attr) {
        console.log("hi")
        let mom = attr in obj1;
        let dad = attr in obj2;

        if (mom && dad) {
          if (obj1[attr] == obj2[attr]) {
            return 3;
          } else {
            return 2;
          }
        } else if (mom || dad) {
          if (mom) {
            return 1.25
          } else {
            return 1.75
          }
        } else {
          return 0;
        }
      }

      function mix(attr) {
        const score = bothParentsHave(attr);

        if (score == 1.25) {
          child[attr] = obj1[attr]
        } else if (score == 1.75) {
          child[attr] = obj2[attr]
        } else if (score >= 2) {
          child[attr] = [...obj1[attr], ...obj2[attr]]
        }
      }

      if (bothParentsHave("type") == 3) {
        child['type'] = obj1['type']
      }

      mix("fields")
      mix("ops")
      mix("groupby")

      return child;
    }

    let child = merge(valid, prod);
    console.log(child)

    console.log(valid, prod)
    

    // // -- test adds
    // let names = Array.from(new Set(data.map(elm => elm['Name']))).sort((a, b) => a.localeCompare(b));
    // let name1 = names[getSampleIndex(names.length)];
    // let name2 = names[getSampleIndex(names.length)];
    // let name3 = names[getSampleIndex(names.length)];

    // name1 = data.filter(elm => elm['Name'] == name1); // 1
    // name2 = data.filter(elm => elm['Name'] == name2); // 2
    // name3 = data.filter(elm => elm['Name'] == name3); // 5

    // // console.log(name1, name2, name3)

    // const subset = [...name1, ...name2, ...name3];
    // let processed_subset = subset.map(elm => {
    //   return {
    //     'k': elm['Name'],
    //     'v': elm['Miles_per_Gallon']
    //   }
    // })  

    // console.log(processed_subset)
    
    // df.pulse(col, changeset().insert(processed_subset)).run();
    // console.time("Benchmark Test 1");
    // promise = df.runAsync();
    // promise.then(() => console.timeEnd("Benchmark Test 1"));
    // let d = out.value;
    // console.log(d)
    
    // const nameSet = new Set(subset.map(elm => elm['Name']));
    // assert.deepStrictEqual(d.length, 3);
    // assert.ok(nameSet.has(d[0].k));
    // assert.ok(nameSet.has(d[1].k));
    // assert.ok(nameSet.has(d[2].k));

    // function investigate(samples, k, v, d) {
    //   const k_set = new Set(samples.map(elm => elm[k]))
    //   const v_set = new Set(samples.map(elm => elm[v]))

    //   assert.deepStrictEqual(d.length, samples.length)

    //   d.forEach(elm => {
    //     assert.ok(k_set.has(elm[k]))
    //   })
    // }

    // assert.deepStrictEqual(d[0].count_v, 2);
    // assert.deepStrictEqual(d[0].sum_v, 3);
    // assert.deepStrictEqual(d[0].min_v, 1);
    // assert.deepStrictEqual(d[0].max_v, 2);
    // assert.deepStrictEqual(d[0].product_v, 2);
    
    // assert.deepStrictEqual(d[1].count_v, 2);
    // assert.deepStrictEqual(d[1].sum_v, 7);
    // assert.deepStrictEqual(d[1].min_v, 3);
    // assert.deepStrictEqual(d[1].max_v, 4);
    // assert.deepStrictEqual(d[1].product_v, 12);
  });


// const data = [
//   {k:'a', v:1}, {k:'b', v:3},
//   {k:'a', v:2}, {k:'b', v:4}
// ];

// var key = util.field('k'),
//     val = util.field('v'),
//     df = new vega.Dataflow(),
//     col = df.add(Collect),
//     agg = df.add(Aggregate, {
//       groupby: [key],
//       fields: [val, val, val, val, val],
//       ops: ['count', 'sum', 'min', 'max', 'product'],
//       pulse: col
//     }),
//     out = df.add(Collect, {pulse: agg});

// // -- test adds
// df.pulse(col, changeset().insert(data)).run();
// console.time("Collect benchmarking 1");
// promise = df.runAsync();
// promise.then(() => console.timeEnd("Collect benchmarking 1"));
// let d = out.value;
// assert.deepStrictEqual(d.length, 2);
// assert.deepStrictEqual(d[0].k, 'a');
// assert.deepStrictEqual(d[0].count_v, 2);
// assert.deepStrictEqual(d[0].sum_v, 3);
// assert.deepStrictEqual(d[0].min_v, 1);
// assert.deepStrictEqual(d[0].max_v, 2);
// assert.deepStrictEqual(d[0].product_v, 2);
// assert.deepStrictEqual(d[1].k, 'b');
// assert.deepStrictEqual(d[1].count_v, 2);
// assert.deepStrictEqual(d[1].sum_v, 7);
// assert.deepStrictEqual(d[1].min_v, 3);
// assert.deepStrictEqual(d[1].max_v, 4);
// assert.deepStrictEqual(d[1].product_v, 12);

// // -- test rems
// df.pulse(col, changeset().remove(data.slice(0, 2))).run();
// console.time("Collect benchmarking 2");
// promise = df.runAsync();
// promise.then(() => console.timeEnd("Collect benchmarking 2"));
// d = out.value;
// assert.deepStrictEqual(d.length, 2);
// assert.deepStrictEqual(d[0].k, 'a');
// assert.deepStrictEqual(d[0].count_v, 1);
// assert.deepStrictEqual(d[0].sum_v, 2);
// assert.deepStrictEqual(d[0].min_v, 2);
// assert.deepStrictEqual(d[0].max_v, 2);
// assert.deepStrictEqual(d[0].product_v, 2);
// assert.deepStrictEqual(d[1].k, 'b');
// assert.deepStrictEqual(d[1].count_v, 1);
// assert.deepStrictEqual(d[1].sum_v, 4);
// assert.deepStrictEqual(d[1].min_v, 4);
// assert.deepStrictEqual(d[1].max_v, 4);
// assert.deepStrictEqual(d[1].product_v, 4);

// // -- test mods, no groupby change
// df.pulse(col, changeset().modify(data[2], 'v', 3)).run();
// console.time("Collect benchmarking 3");
// promise = df.runAsync();
// promise.then(() => console.timeEnd("Collect benchmarking 3"));
// d = out.value;
// assert.deepStrictEqual(d.length, 2);
// assert.deepStrictEqual(d[0].k, 'a');
// assert.deepStrictEqual(d[0].count_v, 1);
// assert.deepStrictEqual(d[0].sum_v, 3);
// assert.deepStrictEqual(d[0].min_v, 3);
// assert.deepStrictEqual(d[0].max_v, 3);
// assert.deepStrictEqual(d[0].product_v, 3);
// assert.deepStrictEqual(d[1].k, 'b');
// assert.deepStrictEqual(d[1].count_v, 1);
// assert.deepStrictEqual(d[1].sum_v, 4);
// assert.deepStrictEqual(d[1].min_v, 4);
// assert.deepStrictEqual(d[1].max_v, 4);
// assert.deepStrictEqual(d[1].product_v, 4);

// // -- test mods, groupby change
// df.pulse(col, changeset().modify(data[2], 'k', 'b')).run();
// console.time("Collect benchmarking 4");
// promise = df.runAsync();
// promise.then(() => console.timeEnd("Collect benchmarking 4"));
// d = out.value;
// assert.deepStrictEqual(d.length, 1);
// assert.deepStrictEqual(d[0].k, 'b');
// assert.deepStrictEqual(d[0].count_v, 2);
// assert.deepStrictEqual(d[0].sum_v, 7);
// assert.deepStrictEqual(d[0].min_v, 3);
// assert.deepStrictEqual(d[0].max_v, 4);
// assert.deepStrictEqual(d[0].product_v, 12);




















  // const data = [
  //   {foo:0, bar:1},
  //   {foo:2, bar:3},
  //   {foo:4, bar:5}
  // ];

  // var foo = util.field('foo'),
  //     bar = util.field('bar'),
  //     df, col, agg, out, d;

  // // counts only
  // df = new vega.Dataflow();
  // col = df.add(Collect);
  // agg = df.add(Aggregate, {
  //   fields: [null, foo, bar],
  //   ops: ['count', 'count', 'count'],
  //   pulse: col
  // });
  // out = df.add(Collect, {pulse: agg});

  // df.pulse(col, changeset().insert(data)).run();
  // d = out.value;
  // assert.deepStrictEqual(d.length, 1);
  // assert.deepStrictEqual(Object.keys(d[0]).length, 3); // outputs
  // assert.deepStrictEqual(d[0].count, 3);
  // assert.deepStrictEqual(d[0].count_foo, 3);
  // assert.deepStrictEqual(d[0].count_bar, 3);

  // // multiple counts plus other measures
  // df = new vega.Dataflow();
  // col = df.add(Collect);
  // agg = df.add(Aggregate, {
  //   fields: [null, foo, bar, bar],
  //   ops: ['count', 'sum', 'sum', 'count'],
  //   pulse: col
  // });
  // out = df.add(Collect, {pulse: agg});

  // df.pulse(col, changeset().insert(data)).run();
  // d = out.value;
  // assert.deepStrictEqual(d.length, 1);
  // assert.deepStrictEqual(Object.keys(d[0]).length, 4); // outputs
  // assert.deepStrictEqual(d[0].count, 3);
  // assert.deepStrictEqual(d[0].sum_foo, 6);
  // assert.deepStrictEqual(d[0].sum_bar, 9);
  // assert.deepStrictEqual(d[0].count_bar, 3);

  // t.end();

  // const data = [
  //   {k:'a', v:1}, {k:'b', v:3},
  //   {k:'a', v:2}, {k:'b', v:4}
  // ];

  // var key = util.field('k'),
  //     val = util.field('v'),
  //     df = new vega.Dataflow(),
  //     col = df.add(Collect),
  //     agg = df.add(Aggregate, {
  //       groupby: [key],
  //       fields: [val, val, val, val, val],
  //       ops: ['count', 'sum', 'min', 'max', 'product'],
  //       pulse: col
  //     }),
  //     out = df.add(Collect, {pulse: agg});

  // // -- add data
  // df.pulse(col, changeset().insert(data)).run();
  // assert.deepStrictEqual(out.value.length, 2);

  // // -- remove category 'b'
  // df.pulse(col, changeset()
  //   .remove(d => d.k === 'b')).run();
  // assert.deepStrictEqual(out.value.length, 1);

  // // -- modify tuple
  // df.pulse(col, changeset().modify(data[0], 'v', 2)).run();

  // const d = out.value;
  // assert.deepStrictEqual(d.length, 1);
  // assert.deepStrictEqual(d[0].k, 'a');
  // assert.deepStrictEqual(d[0].count_v, 2);
  // assert.deepStrictEqual(d[0].sum_v, 4);
  // assert.deepStrictEqual(d[0].min_v, 2);
  // assert.deepStrictEqual(d[0].max_v, 2);
  // assert.deepStrictEqual(d[0].product_v, 4);

  // t.end();

  // const data = [
  //   {foo:null},
  //   {foo:null},
  //   {foo:undefined},
  //   {foo:undefined},
  //   {foo:NaN},
  //   {foo:NaN},
  //   {foo:0},
  //   {foo:0}
  // ];

  // var foo = util.field('foo'),
  //     df, col, agg, out, d;

  // // counts only
  // df = new vega.Dataflow();
  // col = df.add(Collect);
  // agg = df.add(Aggregate, {
  //   fields: [foo],
  //   ops: ['distinct'],
  //   pulse: col
  // });
  // out = df.add(Collect, {pulse: agg});

  // df.pulse(col, changeset().insert(data)).run();
  // d = out.value;
  // assert.deepStrictEqual(d.length, 1);
  // assert.deepStrictEqual(d[0].distinct_foo, 4);

  // df.pulse(col, changeset().remove(data[0])).run();
  // d = out.value;
  // assert.deepStrictEqual(d.length, 1);
  // assert.deepStrictEqual(d[0].distinct_foo, 4);

  // df.pulse(col, changeset().remove(data[1])).run();
  // d = out.value;
  // assert.deepStrictEqual(d.length, 1);
  // assert.deepStrictEqual(d[0].distinct_foo, 3);

  // t.end();

  // const data = [
  //   {a: 0, b: 2},
  //   {a: 1, b: 3}
  // ];

  // var a = util.field('a'),
  //     b = util.field('b'),
  //     df = new vega.Dataflow(),
  //     col = df.add(Collect),
  //     agg = df.add(Aggregate, {
  //       groupby: [a, b],
  //       cross: true,
  //       pulse: col
  //     }),
  //     out = df.add(Collect, {
  //       sort: function(u, v) { return (u.a - v.a) || (u.b - v.b); },
  //       pulse: agg
  //     });

  // // -- test add
  // df.pulse(col, changeset().insert(data)).run();
  // let d = out.value;
  // assert.deepStrictEqual(d.length, 4);
  // assert.deepStrictEqual(d[0].a, 0);
  // assert.deepStrictEqual(d[0].b, 2);
  // assert.deepStrictEqual(d[0].count, 1);
  // assert.deepStrictEqual(d[1].a, 0);
  // assert.deepStrictEqual(d[1].b, 3);
  // assert.deepStrictEqual(d[1].count, 0);
  // assert.deepStrictEqual(d[2].a, 1);
  // assert.deepStrictEqual(d[2].b, 2);
  // assert.deepStrictEqual(d[2].count, 0);
  // assert.deepStrictEqual(d[3].a, 1);
  // assert.deepStrictEqual(d[3].b, 3);
  // assert.deepStrictEqual(d[3].count, 1);

  // // -- test mod
  // df.pulse(col, changeset().modify(data[0], 'b', 4)).run();
  // d = out.value;
  // assert.deepStrictEqual(d.length, 6);
  // assert.deepStrictEqual(d[0].a, 0);
  // assert.deepStrictEqual(d[0].b, 2);
  // assert.deepStrictEqual(d[0].count, 0);
  // assert.deepStrictEqual(d[1].a, 0);
  // assert.deepStrictEqual(d[1].b, 3);
  // assert.deepStrictEqual(d[1].count, 0);
  // assert.deepStrictEqual(d[2].a, 0);
  // assert.deepStrictEqual(d[2].b, 4);
  // assert.deepStrictEqual(d[2].count, 1);
  // assert.deepStrictEqual(d[3].a, 1);
  // assert.deepStrictEqual(d[3].b, 2);
  // assert.deepStrictEqual(d[3].count, 0);
  // assert.deepStrictEqual(d[4].a, 1);
  // assert.deepStrictEqual(d[4].b, 3);
  // assert.deepStrictEqual(d[4].count, 1);
  // assert.deepStrictEqual(d[5].a, 1);
  // assert.deepStrictEqual(d[5].b, 4);
  // assert.deepStrictEqual(d[5].count, 0);

  // // -- test rem
  // df.pulse(col, changeset().remove(data)).run();
  // d = out.value;
  // assert.deepStrictEqual(d.length, 6);
  // assert.deepStrictEqual(d[0].a, 0);
  // assert.deepStrictEqual(d[0].b, 2);
  // assert.deepStrictEqual(d[0].count, 0);
  // assert.deepStrictEqual(d[1].a, 0);
  // assert.deepStrictEqual(d[1].b, 3);
  // assert.deepStrictEqual(d[1].count, 0);
  // assert.deepStrictEqual(d[2].a, 0);
  // assert.deepStrictEqual(d[2].b, 4);
  // assert.deepStrictEqual(d[2].count, 0);
  // assert.deepStrictEqual(d[3].a, 1);
  // assert.deepStrictEqual(d[3].b, 2);
  // assert.deepStrictEqual(d[3].count, 0);
  // assert.deepStrictEqual(d[4].a, 1);
  // assert.deepStrictEqual(d[4].b, 3);
  // assert.deepStrictEqual(d[4].count, 0);
  // assert.deepStrictEqual(d[5].a, 1);
  // assert.deepStrictEqual(d[5].b, 4);
  // assert.deepStrictEqual(d[5].count, 0);

  // t.end();

  // const ops = [
  //   'count',
  //   'missing',
  //   'valid',
  //   'sum',
  //   'product',
  //   'mean',
  //   'variance',
  //   'stdev',
  //   'min',
  //   'max',
  //   'median'
  // ];
  // const res = [4, 3, 0, 0]; // higher indices 'undefined'

  // var v = util.field('v'),
  //     df = new vega.Dataflow(),
  //     col = df.add(Collect),
  //     agg = df.add(Aggregate, {
  //       fields: ops.map(() => v),
  //       ops: ops,
  //       as: ops,
  //       pulse: col
  //     }),
  //     out = df.add(Collect, {pulse: agg});

  // df.pulse(
  //   col,
  //   changeset().insert([
  //     {v: NaN}, {v: null}, {v: undefined}, {v: ''}
  //   ])
  // ).run();
  // const d = out.value[0];

  // ops.forEach((op, i) => {
  //   assert.deepStrictEqual(d[op], res[i], op);
  // });

  // t.end();