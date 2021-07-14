var util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('vega-transforms'),
    changeset = vega.changeset,
    Extent = tx.extent,
    Collect = tx.collect;

// Data coule be varied
const data = [
    {'x': 0, 'y': 28, 'z': {'a': {'b': 6}}}, 
    {'x': 3, 'y': 43, 'z': {'a': {'b': 123}}},
    {'x': 0, 'y': 55, 'z': {'a': {'b': 0}}},
    {'x': 1, 'y': 72, 'z': {'a': {'b': 9}}}
];

var fieldOne = 'x',
    fieldTwo = 'y',
    nestedFieldOne = 'z.a.b',
    df,
    r;

const one = util.field(fieldOne),
    two = util.field(fieldTwo),
    nestedOne = util.field(nestedFieldOne);

df = new vega.Dataflow(),
c = df.add(Collect),
r = df.add(Extent, {field: one, as: 'one', pulse: c});
df.pulse(c, changeset().insert(data));
console.time("Extent benchmarking 1");
promise = df.runAsync();
promise.then(() => console.timeEnd("Extent benchmarking 1"));
// console.log(r.value);

df = new vega.Dataflow(),
c = df.add(Collect),
r = df.add(Extent, {field: two, as: 'two', pulse: c});
df.pulse(c, changeset().insert(data));
console.time("Extent benchmarking 2");
promise = df.runAsync();
promise.then(() => console.timeEnd("Extent benchmarking 2"));


df = new vega.Dataflow(),
c = df.add(Collect),
r = df.add(Extent, {field: nestedOne, as: 'nestedOne', pulse: c});
df.pulse(c, changeset().insert(data));
console.time("Extent benchmarking 3");
promise = df.runAsync();
promise.then(() => console.timeEnd("Extent benchmarking 3"));