const { Transform } = require('./utils/transform')
const _ = require('lodash');
const fs = require('fs');

class ExampleGenerator {
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
                        const field = _.sampleSize(Object.keys(STATS['quantitative']), sampleSize) // only numbers, and repetition allowed
                        const ops = []
                        const as = [];
                        
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
                        const sampleSize = Math.ceil(Math.random() * QUANT_COUNT) // only quant for now
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
                            console.log(attribute)
                            let lower = STATS["quantitative"][attribute][0] - STATS["quantitative"][attribute][1] * Math.random() * 2.5;
                            let upper = STATS["quantitative"][attribute][0] + STATS["quantitative"][attribute][1] * Math.random() * 2.5;
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
                                command = Transform.Filter.is_null(
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
                            const child = Template('aggregate', expr, null);            
            
                            return [STRINGIFY ? JSON.stringify(child) : child, sampleSize];
                        } else {
                            return [STRINGIFY ? JSON.stringify(expr) : expr, sampleSize];
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