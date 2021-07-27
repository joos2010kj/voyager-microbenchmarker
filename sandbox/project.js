const   assert = require('assert'),
        vega = require('vega-dataflow'),
        tx = require('vega-transforms'),
        fetch = require('node-fetch'),
        fs = require('fs'),
        seedrandom = require('seedrandom'),
        util = require('vega-util'),
        { generate } = require("../param_generator.js"),
        { STAT, generate_examples } = require('../example_generator.js'),
        { Transform } = require('../transform.js'),
        { String } = require('../utils.js'),
        changeset = vega.changeset,
        Collect = tx.collect,
        Project = tx.project;
    
let child1 = Transform.Project.Merge(
    Transform.Project.as("foo", "a"),
    Transform.Project.as("bar", "b")
)

console.log(child1)

let child2 = Transform.Project.Merge(
    Transform.Project.fields("foo"),
    Transform.Project.fields("bar")
)

console.log(child2)

let child3 = Transform.Project.Merge(
    Transform.Project.as("bar", "bar"),
    Transform.Project.as("foo.a", "a"),
    Transform.Project.as("foo.b", "b")
)

console.log(child3)
