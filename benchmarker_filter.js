// Reference: https://github.com/vega/vega/blob/master/packages/vega-transforms/test/filter-test.js

var util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('vega-transforms'),
    assert = require('assert'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Filter = tx.filter;

const data = [
  {'id': 1, 'value': 'foo'},
  {'id': 3, 'value': 'bar'},
  {'id': 5, 'value': 'baz'}
];

var df = new vega.Dataflow(),
    e0 = df.add(null),
    c0 = df.add(Collect),
    f0 = df.add(Filter, {expr: e0, pulse: c0}),
    c1 = df.add(Collect, {pulse: f0});

df.pulse(c0, changeset().insert(data));

df.update(e0, util.truthy).run();
console.time("Collect benchmarking 1");
promise = df.runAsync();
promise.then(() => console.timeEnd("Collect benchmarking 1"));
assert.deepStrictEqual(c1.value, data);

df.update(e0, util.falsy).run();
console.time("Collect benchmarking 2");
promise = df.runAsync();
promise.then(() => console.timeEnd("Collect benchmarking 2"));
assert.deepStrictEqual(c1.value.length, 0);

df.update(e0, util.accessor(d => d.id < 3, ['id'])).run();
console.time("Collect benchmarking 3");
promise = df.runAsync();
promise.then(() => console.timeEnd("Collect benchmarking 3"));
assert.deepStrictEqual(c1.value, [data[0]]);

df.update(e0, util.accessor(d => d.value === 'baz', ['value'])).run();
console.time("Collect benchmarking 4");
promise = df.runAsync();
promise.then(() => console.timeEnd("Collect benchmarking 4"));
assert.deepStrictEqual(c1.value, [data[2]]);

df.pulse(c0, changeset().modify(data[0], 'value', 'baz')).run();
console.time("Collect benchmarking 5");
promise = df.runAsync();
promise.then(() => console.timeEnd("Collect benchmarking 5"));
assert.deepStrictEqual(c1.value, [data[2], data[0]]);

df.pulse(c0, changeset().modify(data[2], 'value', 'foo')).run();
console.time("Collect benchmarking 6");
promise = df.runAsync();
promise.then(() => console.timeEnd("Collect benchmarking 6"));
assert.deepStrictEqual(c1.value, [data[0]]);

df.pulse(c0, changeset().modify(data[1], 'id', 4)).run();
console.time("Collect benchmarking 7");
promise = df.runAsync();
promise.then(() => console.timeEnd("Collect benchmarking 7"));
assert.deepStrictEqual(c1.value, [data[0]]);
