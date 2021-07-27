const { Transform } = require('../transform.js');
const assert = require("assert")

let child1 = Transform.Extent.extent("value");

console.log(child1)

let child2 = Transform.Extent.extent("value", "extent");

console.log(child2)