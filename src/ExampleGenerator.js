const { Transform } = require('./utils/transform')
const _ = require('lodash');
const fs = require('fs');

class ExampleGenerator {
    static normal = () => {
        // https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
        // Normal Distribution using Box-Muller transform
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        num = num / 10.0 + 0.5; // Translate to 0 -> 1
        if (num > 1 || num < 0) return randn_bm() // resample between 0 and 1
        return num
    }

    static init = (path, stringify) => {
        const STATISTICS = path;
        const STATS = JSON.parse(fs.readFileSync(STATISTICS, 'utf-8'));
        const STRINGIFY = stringify;
        const useTemplate = false;
        const QUANT_COUNT = Object.keys(STATS["quantitative"]).length;
        const CAT_COUNT = Object.keys(STATS["categorical"]).length;
        const Template = (cls, expr, sql) => {
            return {
                type: cls,
                expr: expr,
                sql: sql
            }
        }
    
        return class {
            static Project = class {
                static generate(count) {
                    const exprFactory = (field, renamed) => Transform.Project.as(field, renamed);  
        
                    return Array.from(Array(count).keys()).map(index => {
                        const sampleSize = Math.ceil(Math.random() * (QUANT_COUNT + CAT_COUNT)) // maxcount quant + cat
                        const field = _.sampleSize(Object.keys({...STATS['quantitative'], ...STATS['categorical']}), sampleSize) // repetition disallowed
                        const renamed = [];
                        
                        for (let i = 0; i < sampleSize; i++) {
                            renamed.push(`name_${i + 1}`)
                        }
        
                        const expr = exprFactory(field, renamed);

                        if (useTemplate) {
                            const child = Template('project', expr, null);
            
                            return [STRINGIFY ? JSON.stringify(child) : child, sampleSize];
                        } else {
                            return [STRINGIFY ? JSON.stringify(expr) : expr, sampleSize];
                        }
                    })
                }
            }
        
            static Collect = class {
                static generate(count) {
                    const exprFactory = (field, order) => Transform.Collect.sort(field, order)
        
                    return Array.from(Array(count).keys()).map(index => {
                        const sampleSize = Math.ceil(Math.random() * (QUANT_COUNT + CAT_COUNT)) // both quant and qual for sorting
                        const field = _.sampleSize(Object.keys({...STATS['quantitative'], ...STATS['categorical']}), sampleSize) // repetition disallowed
                        const order = [];   // repetition allowed

                        for (let i = 0; i < sampleSize; i++) {
                            order.push(_.sample(['ascending', 'descending']))
                        }
        
                        const expr = exprFactory(field, order);
                       
                        if (useTemplate) {
                            const child = Template('collect', expr, null);     
            
                            return [STRINGIFY ? JSON.stringify(child) : child, sampleSize];
                        } else {
                            return [STRINGIFY ? JSON.stringify(expr) : expr, sampleSize];
                        }
                    })
                }
            }
        
            static Extent = class {
                static generate(count) {
                    const exprFactory = (field, signal) => Transform.Extent.extent(field, signal)
        
                    return Array.from(Array(count).keys()).map(index => {
                        const field = _.sample(Object.keys(STATS['quantitative'])) // only quant for extent (min,max)
                        const signal = 'extent'
        
                        const expr = exprFactory(field, signal);
        
                        if (useTemplate) {
                            const child = Template('extent', expr, null);            

                            return [STRINGIFY ? JSON.stringify(child) : child, 1];
                        } else {
                            return [STRINGIFY ? JSON.stringify(expr) : expr, 1];
                        }
                    })
                }
            }

            static Aggregate = class {
                static generate(count) {
                    const exprFactory = (field, ops, as) => Transform.Aggregate.operate(field, ops, as)
        
                    return Array.from(Array(count).keys()).map(index => {
                        const sampleSize = Math.ceil(Math.random() * (QUANT_COUNT + CAT_COUNT)) // can be infinite, but restricted to this
                        const field = []
                        const ops = []
                        const as = [];

                        for (let i = 0; i < sampleSize; i++) {
                            let samp = _.sample(Object.keys(STATS['quantitative'])) // only numbers, and repetition allowed
                            field.push(samp)
                        }
                        
                        for (let i = 0; i < sampleSize; i++) {
                            as.push(`name_${i + 1}`)
                        }

                        for (let i = 0; i < sampleSize; i++) {
                            ops.push(_.sample([
                                'count', 
                                'valid',
                                "missing",
                                "distinct",
                                "sum",
                                "product",
                                "mean",
                                "average",
                                "variance",
                                "variancep",
                                "stdev",
                                "stdevp",
                                "stderr",
                                "median",
                                "q1",
                                "q3",
                                "ci0",
                                "ci1",
                                "argmin",
                                "argmax",
                                "min",
                                "max",
                                "values"
                            ]))
                        }
        
                        const expr = exprFactory(field, ops, as);
        
                        if (useTemplate) {
                            const child = Template('aggregate', expr, null);            
            
                            return [STRINGIFY ? JSON.stringify(child) : child, sampleSize];
                        } else {
                            return [STRINGIFY ? JSON.stringify(expr) : expr, sampleSize];
                        }
                    })
                }
            }

            static Filter = class {
                static generate(count) {        
                    return Array.from(Array(count).keys()).map(index => {
                        const sampleSize = Math.ceil(Math.random() * 1) // only quant for now
                        const field = _.sampleSize(Object.keys({...STATS['quantitative']}), sampleSize) // repetition disallowed
                        const ops = []
                        
                        for (let i = 0; i < sampleSize; i++) {
                            ops.push(_.sample([
                                "between",
                                "not_between",
                                "equal",
                                "not_equal",
                                "is_null",
                                "is_not_null"
                            ]))
                        }

                        const filters = []

                        for (let i = 0; i < sampleSize; i++) {
                            let attribute = field[i];
                            let lower = STATS["quantitative"][attribute][0] - STATS["quantitative"][attribute][1] * ExampleGenerator.normal() * 2.5;
                            let upper = STATS["quantitative"][attribute][0] + STATS["quantitative"][attribute][1] * ExampleGenerator.normal() * 2.5;
                            let command = undefined;

                            if (ops[i] == "between") {
                                command = Transform.Filter.between(
                                    attribute, 
                                    lower,
                                    Math.random() > 0.5 ? true : false,
                                    upper,
                                    Math.random() > 0.5 ? true : false,
                                )
                            } else if (ops[i] == "not_between") {
                                command = Transform.Filter.not_between(
                                    attribute, 
                                    lower,
                                    Math.random() > 0.5 ? true : false,
                                    upper,
                                    Math.random() > 0.5 ? true : false,
                                )
                            } else if (ops[i] == "equal") {
                                command = Transform.Filter.equal(
                                    attribute, 
                                    Math.random() > 0.5 ? lower : upper
                                )
                            } else if (ops[i] == "not_equal") {
                                command = Transform.Filter.not_equal(
                                    attribute, 
                                    Math.random() > 0.5 ? lower : upper
                                )
                            } else if (ops[i] == "is_null") {
                                command = Transform.Filter.is_null(
                                    attribute
                                )
                            } else if (ops[i] == "is_not_null") {
                                command = Transform.Filter.is_not_null(
                                    attribute
                                )
                            }

                            filters.push(command)
                        }
        
                        const expr = {
                            "type": "filter",
                            "expr": filters.map(f => f["expr"])
                        }
        
                        if (useTemplate) {
                            const child = Template('filter', expr, null);            
            
                            return [STRINGIFY ? JSON.stringify(child) : child, [sampleSize, ops]];
                        } else {
                            return [STRINGIFY ? JSON.stringify(expr) : expr, [sampleSize, ops]];
                        }
                    })
                }
            }

            static Bin = class {
                static generate(count) {        
                    return Array.from(Array(count).keys()).map(index => {
                        const sampleSize = Math.ceil(Math.random() * 1) // only quant for now
                        const field = _.sampleSize(Object.keys({...STATS['quantitative']}), sampleSize) // repetition disallowed
                        const ops = [];
                        
                        for (let i = 0; i < sampleSize; i++) {
                            ops.push(_.sample([
                                "interval",
                                "anchor",
                                "maxbins",
                                "base",
                                "step",
                                "minstep",
                                "nice",
                            ]))
                        }

                        let attribute = field[0];
                        let lower = STATS["quantitative"][attribute][0] - STATS["quantitative"][attribute][1] * Math.random() * 2.5;
                        let upper = STATS["quantitative"][attribute][0] + STATS["quantitative"][attribute][1] * Math.random() * 2.5;
                    
                        const bin = new Transform.Bin(attribute, [Math.floor(lower), Math.ceil(upper)]);

                        for (let op of ops) {
                            switch (op) {
                                case "interval":
                                    bin.add(op, Math.random() > 0.5 ? "true" : "false");
                                    break;
                                case "anchor":
                                    bin.add(
                                        op,
                                        lower + Math.min(
                                            (upper - lower) * 0.5, 
                                            Math.random() * (STATS["quantitative"][attribute][3] - lower)
                                        )
                                    )
                                    break;
                                case "maxbins":
                                    bin.add(
                                        op,
                                        5 * Math.ceil(Math.random() * 5)
                                    )
                                    break;
                                case "base":
                                    bin.add(
                                        op,
                                        Math.random() > 0.75 ? 10 : _.sample([2, 4, 8, 16])
                                    )
                                    break;
                                case "step":
                                    bin.add(
                                        op,
                                        5 * Math.ceil(Math.random() * 5)
                                    )
                                    break;
                                case "minstep":
                                    bin.add(
                                        op,
                                        Math.ceil(Math.random() * 25)
                                    )
                                    break;
                                case "nice":
                                    bin.add(op, Math.random() > 0.5 ? "true" : "false");
                                    break;
                                case "as":
                                    bin.add(op, "op1");
                                    break;
                            }
                        }
                    
    
                        const expr = {
                            "type": "bin",
                            ...bin.property
                        }
        
                        if (useTemplate) {
                            const child = Template('bin', expr, null);            
            
                            return [STRINGIFY ? JSON.stringify(child) : child, [sampleSize, ops]];
                        } else {
                            return [STRINGIFY ? JSON.stringify(expr) : expr, [sampleSize, ops]];
                        }
                    })
                }
            }

            static Stack = class {
                static generate(count) {        
                    return Array.from(Array(count).keys()).map(index => {
                        const sampleSize = 2 + Math.floor(Math.random() * (QUANT_COUNT + CAT_COUNT - 1))
                        const fields = _.sampleSize(Object.keys({...STATS['quantitative'], ...STATS['categorical']}), sampleSize)
                        const stack = new Transform.Stack(fields[0]);

                        stack.add(
                            "groupby",
                            fields.slice(1)
                        )
                    
    
                        const expr = {
                            "type": "stack",
                            ...stack.property
                        }
        
                        if (useTemplate) {
                            const child = Template('bin', expr, null);            
            
                            return [STRINGIFY ? JSON.stringify(child) : child, [sampleSize, fields.slice(1).length]];
                        } else {
                            return [STRINGIFY ? JSON.stringify(expr) : expr, [sampleSize, fields.slice(1).length]];
                        }
                    })
                }
            }
        }
    }
}

// const path = "quant_and_qual_stat.json";
// const stringify = true;

// const Generator = ExampleGenerator.init(path, stringify);

// const result = _.sample([Generator.Extent.generate(2), Generator.Collect.generate(2), Generator.Project.generate(2)]);

// console.log(result)

module.exports = { ExampleGenerator };