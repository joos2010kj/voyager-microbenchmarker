var util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('vega-transforms'),
    changeset = vega.changeset,
    Bin = tx.bin,
    Collect = tx.collect;

// Data coule be varied
const data = [
    {'x': 0, 'y': 28, 'z': {'a': {'b': 6}}}, 
    {'x': 3, 'y': 43, 'z': {'a': {'b': 123}}},
    {'x': 0, 'y': 55, 'z': {'a': {'b': 0}}},
    {'x': 1, 'y': 72, 'z': {'a': {'b': 9}}}
];

var field = util.field('x'),
    min = 0,
    max = 3,
    bins = 10,
    df,
    r;

var df = new vega.Dataflow(),
    c = df.add(Collect),
    b = df.add(Bin, {
        field:    field,
        interval: 'true',
        extent:   [min, max],
        pulse:    c
    });
df.pulse(c, changeset().insert(data));
console.time("Bin benchmarking 1");
promise = df.runAsync();
promise.then(() => console.timeEnd("Bin benchmarking 1"));
console.log(b.value);