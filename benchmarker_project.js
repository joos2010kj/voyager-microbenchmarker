var util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('vega-transforms'),
    changeset = vega.changeset,
    Project = tx.project;

// Data coule be varied
const data = [
    {'id': 0, 'obj': {'foo': {'bar': 'a'}}, 'abc': {'hi': {'there': 'a'}}, 'how': 'are'},
    {'id': 1, 'obj': {'foo': {'bar': 'b'}}, 'abc': {'hi': {'there': 'b'}}, 'how': 'you'}
  ];

var fieldOne = 'id',
    fieldTwo = 'how',
    nestedFieldOne = 'obj.foo.bar',
    nestedFieldTwo = 'abc.hi.there',
    df,
    r;
    
const one = util.field(fieldOne),
    two = util.field(fieldTwo),
    nestedOne = util.field(nestedFieldOne),
    nestedTwo = util.field(nestedFieldTwo);

df = new vega.Dataflow();
r = df.add(Project, {
        fields: [one],
        as: ['one'],
    });
df.pulse(r, changeset().insert(data));
console.time("Project benchmarking 1");
promise = df.runAsync();
promise.then(() => console.timeEnd("Project benchmarking 1"));


df = new vega.Dataflow();
r = df.add(Project, {
    fields: [one, two],
    as: ['one', 'two'],
  });
df.pulse(r, changeset().insert(data));
console.time("Project benchmarking 2");
promise = df.runAsync();
promise.then(() => console.timeEnd("Project benchmarking 2"));


df = new vega.Dataflow();
r = df.add(Project, {
    fields: [nestedOne],
    as: ['nestedOne'],
  });
df.pulse(r, changeset().insert(data));
console.time("Project benchmarking 3");
promise = df.runAsync();
promise.then(() => console.timeEnd("Project benchmarking 3"));


df = new vega.Dataflow();
r = df.add(Project, {
    fields: [nestedOne, nestedTwo],
    as: ['nestedOne', 'nestedTwo'],
  });
df.pulse(r, changeset().insert(data));
console.time("Project benchmarking 4");
promise = df.runAsync();
promise.then(() => console.timeEnd("Project benchmarking 4"));


df = new vega.Dataflow();
r = df.add(Project, {
    fields: [one, nestedOne],
    as: ['one', 'nestedOne'],
  });
df.pulse(r, changeset().insert(data));
console.time("Project benchmarking 5");
promise = df.runAsync();
promise.then(() => console.timeEnd("Project benchmarking 5"));

df = new vega.Dataflow();
r = df.add(Project, {
    fields: [one, two, nestedOne, nestedTwo],
    as: ['one', 'two', 'nestedOne', 'nestedTwo'],
  });
df.pulse(r, changeset().insert(data));
console.time("Project benchmarking 6");
promise = df.runAsync();
promise.then(() => console.timeEnd("Project benchmarking 6"));
