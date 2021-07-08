var util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('vega-transforms'),
    assert = require('assert'),
    changeset = vega.changeset,
    Collect = tx.collect;

// Data coule be varied
const data = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ];

var quantitativeAtt = 'id',
    qualititiveAtt = 'value',
    orderOne = 'ascending',
    orderTwo = 'descending'

var df = new vega.Dataflow(),
    so = df.add(null),
    c0 = df.add(Collect, {sort:so});

df.pulse(c0, changeset().insert(data))

df.update(so, util.compare(quantitativeAtt,orderOne));
console.time("Collect benchmarking 1");
promise = df.runAsync();
promise.then(() => console.timeEnd("Collect benchmarking 1"));
assert.strictEqual(c0.value.length, 3);
assert.strictEqual(c0.value[0], data[0]);
assert.strictEqual(c0.value[1], data[1]);
assert.strictEqual(c0.value[2], data[2]);

df.update(so, util.compare(qualititiveAtt,orderOne));
console.time("Collect benchmarking 2");
promise = df.runAsync();
promise.then(() => console.timeEnd("Collect benchmarking 2"));
assert.strictEqual(c0.value.length, 3);
assert.strictEqual(c0.value[2], data[2]);
assert.strictEqual(c0.value[1], data[1]);
assert.strictEqual(c0.value[0], data[0]);

df.update(so, util.compare([quantitativeAtt, qualititiveAtt],[orderOne, orderTwo]));
console.time("Collect benchmarking 3");
promise = df.runAsync();
promise.then(() => console.timeEnd("Collect benchmarking 3"));
assert.strictEqual(c0.value.length, 3);
assert.strictEqual(c0.value[0], data[0]);
assert.strictEqual(c0.value[1], data[1]);
assert.strictEqual(c0.value[2], data[2]);

df.update(so, util.compare([qualititiveAtt, quantitativeAtt],[orderOne, orderTwo]));
console.time("Collect benchmarking 4");
promise = df.runAsync();
promise.then(() => console.timeEnd("Collect benchmarking 4"));
assert.strictEqual(c0.value.length, 3);
assert.strictEqual(c0.value[2], data[2]);
assert.strictEqual(c0.value[1], data[1]);
assert.strictEqual(c0.value[0], data[0]);