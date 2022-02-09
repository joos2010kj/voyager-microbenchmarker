var util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('vega-transforms'),
    assert = require('assert'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Project = tx.project;

// Data coule be varied
const data = [{'id': 0, 'foo': 'a'}, {'id': 1, 'foo': 'b'}];

var id = util.field('id'),
    df = new vega.Dataflow(),
    c = df.add(Collect),
    r = df.add(Project, {
        fields: [id],
        pulse: c
      }),
    p;

// test initial insert
console.time("benchmarking");
promise = df.pulse(c, changeset().insert(data)).runAsync();
promise.then(() => console.timeEnd("benchmarking"));

// basic testing for transformation output
p = r.pulse;
assert.strictEqual(p.add.length, 2);
assert.strictEqual(p.rem.length, 0);
assert.strictEqual(p.mod.length, 0);
assert.notStrictEqual(p.add[0], data[0]);
assert.notStrictEqual(p.add[1], data[1]);
assert.deepStrictEqual(p.add.map(id), [0, 1]);