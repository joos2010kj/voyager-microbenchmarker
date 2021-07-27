const { Transform } = require('../transform.js');
const assert = require("assert")

let child1 = Transform.Collect.sort("a");

console.log(child1)

let child2 = Transform.Collect.sort("b", "descending");

console.log(child2)

assert.throws(() => Transform.Collect.sort("b", "hi"), Error)

let child3 = Transform.Collect.Merge(
    Transform.Collect.sort("a", "descending"),
    Transform.Collect.sort("b", "ascending")
)

console.log(child3)
