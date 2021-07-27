const assert = require('assert')

class Transform {
    static Filter = class {
        static cast_type(value) {
            if (typeof(value) == "string") {
                let match = value.match(/[12][0-9]{3}-[01][0-9]-[0123][0-9]/g)
    
                if (match != null && value.length == 10) {
                    return value;
                } else {
                    return `'${value}'`;
                }
            } else if (typeof(value) == "number") {
                return `${value}`;
            } else {
                return value;
            }
        }
    
        // datum.a >= 10 && datum.a < 20
        static between(item, min, inclusive1, max, inclusive2) {
            min = Transform.Filter.cast_type(min);
            max = Transform.Filter.cast_type(max);
    
            return {
                "type": "filter",
                "expr": ` datum.${item} ${inclusive1 ? ">=" : ">"} ${min} && datum.${item} ${inclusive2 ? "<=" : "<"} ${max}`
            }
        }   
    
        // datum.Miles_per_Gallon < 15 || datum.Miles_per_Gallon > 20
        static not_between(item, min, inclusive1, max, inclusive2) {
            min = Transform.Filter.cast_type(min);
            max = Transform.Filter.cast_type(max);
    
            return {
                "type": "filter",
                "expr": ` datum.${item} ${inclusive1 ? "<=" : "<"} ${min} || datum.${item} ${inclusive2 ? ">=" : ">"} ${max}`
            }
        }   
    
        // datum.Name == 'pontiac catalina brougham'
        static equal(item, value) {
            value = Transform.Filter.cast_type(value);
    
            return {
                "type": "filter",
                "expr": ` datum.${item} == ${value}`
            }
        }   
    
        // datum.Name == 'pontiac catalina brougham'
        static not_equal(item, value) {
            value = Transform.Filter.cast_type(value);
    
            return {
                "type": "filter",
                "expr": ` datum.${item} != ${value}`
            }
        }  
    
        // datum.Miles_per_Gallon == null
        static is_null(item) {
            return {
                "type": "filter",
                "expr": ` datum.${item} == null`
            }
        } 
    
        // datum.Miles_per_Gallon != null
        static is_not_null(item) {
            return {
                "type": "filter",
                "expr": ` datum.${item} != null`
            }
        } 
    
        static sandbox() {
            let obj = "Miles_per_Gallon"
    
            console.log(Transform.Filter.between(obj, 15, true, 20, false))
            console.log(Transform.Filter.not_between(obj, 15, false, 20, false))
            console.log(Transform.Filter.equal("Year", "2021-07-06"))
            console.log(Transform.Filter.is_null(obj))
            console.log(Transform.Filter.is_not_null(obj))
        }

        static commands() {
            return [
                "between(item, min, inclusive1, max, inclusive2)",
                "not_between(item, min, inclusive1, max, inclusive2)",
                "equal(item, value)",
                "not_equal(item, value)",
                "is_null(item)",
                "is_not_null(item)"
            ]
        }
    }

    static Aggregate = class {    
        static count(item) {
            return {
                "type": "aggregate",
                "fields": [item],
                "ops": ["count"]
            }
        }
    
        static valid(item) {
            return {
                "type": "aggregate",
                "fields": [item],
                "ops": ["valid"]
            }
        }

        static missing(item) {
            return {
                "type": "aggregate",
                "fields": [item],
                "ops": ["missing"]
            }
        }

        static distinct(item) {
            return {
                "type": "aggregate",
                "fields": [item],
                "ops": ["distinct"]
            }
        }
    
        static sum(item) {
            return {
                "type": "aggregate",
                "fields": [item],
                "ops": ["sum"]
            }
        }
    
        static product(item) {
            return {
                "type": "aggregate",
                "fields": [item],
                "ops": ["product"]
            }
        }

        static mean(item) {
            return {
                "type": "aggregate",
                "fields": [item],
                "ops": ["mean"]
            }
        }

        static average(item) {
            return {
                "type": "aggregate",
                "fields": [item],
                "ops": ["average"]
            }
        }
    
        static variance(item) {
            return  {
                "type": "aggregate",
                "fields": [item],
                "ops": ["variance"]
            }
        }
    
        static variancep(item) {
            return  {
                "type": "aggregate",
                "fields": [item],
                "ops": ["variancep"]
            }
        }

        static stdev(item) {
            return {
                "type": "aggregate",
                "fields": [item],
                "ops": ["stdev"]
            }
        }
    
        static stdevp(item) {
            return {
                "type": "aggregate",
                "fields": [item],
                "ops": ["stdevp"]
            }
        }
    
        static median(item) {
            return {
                "type": "aggregate",
                "fields": [item],
                "ops": ["median"]
            }
        }
    
        static min(item) {
            return {
                "type": "aggregate",
                "fields": [item],
                "ops": ["min"]
            }
        }
    
        static max(item) {
            return {
                "type": "aggregate",
                "fields": [item],
                "ops": ["max"]
            }
        }
    
        static groupby(item) {
            return {
                "type": "aggregate", 
                "groupby": [item]
            }
        }

        static Merge(...children) {
            if (children.length == 1) {
                return children[0];
            }

            let child = children[0];

            const primaryAttributes = ['fields', 'ops', 'groupby'];

            for (let i = 1; i < children.length; i++) {
                child = Transform._merge(child, children[i], primaryAttributes);
            }

            return child;
        }

        static sandbox() {
            console.log(Transform.Aggregate.groupby("Miles_per_gallon"))
        }

        static commands() {
            return [
                "count(item)",
                "valid(item)",
                "missing(item)",
                "distinct(item)",
                "sum(item)",
                "product(item)",
                "mean(item)",
                "average(item)",
                "variance(item)",
                "variancep(item)",
                "stdev(item)",
                "stdevp(item)",
                "median(item)",
                "min(item)",
                "max(item)",
                "groupby(item)"
            ]
        }
    }

    static Project = class {
        static fields(item) {
            return {
                "type": "project",
                "fields": [item]
            }
        }

        static as(item, renamed) {
            return {
                "type": "project",
                "fields": [item],
                "as": [renamed]
            }
        }

        static Merge(...children) {
            if (children.length == 1) {
                return children[0];
            }

            let child = children[0];

            const primaryAttributes = ['fields', 'as'];

            for (let i = 1; i < children.length; i++) {
                child = Transform._merge(child, children[i], primaryAttributes);
            }

            return child;
        }

        static commands() {
            return [
                "fields(item)",
                "as(item, renamed)"
            ]
        }
    }

    static Collect = class {

        // ascending order is used by default per documentation
        static sort(item, order) {
            if (order != undefined) {
                assert.ok(['ascending', 'descending'].indexOf(order) > -1);
            }

            return {
                "type": "collect",
                "sort": {
                    "field": [item],
                    "order": [order == undefined ? 'ascending' : order]
                }
            }
        }

        static Merge(...children) {
            if (children.length == 1) {
                return children[0];
            }

            let child = children[0];

            const primaryAttributes = ['field', 'order'];

            for (let i = 1; i < children.length; i++) {
                child = Transform._merge(child["sort"], children[i]["sort"], primaryAttributes);
            }

            return {
                "type": "collect",
                "sort": child
            };
        }
        
        static commands() {
            return [
                "sort(item, order)"
            ]
        }
    }

    static Extent = class {
        static extent(field, signal) {
            return signal == undefined ? {
                "type": "extent",
                "field": field
            } : {
                "type": "extent",
                "field": field,
                "signal": signal
            } 
        }

        static commands() {
            return [
                "extent(field, signal)"
            ]
        }
    }

    static _merge(obj1, obj2, attributes) {
        let child = {}

        function bothParentsHave(attr) {
            let mom = attr in obj1;
            let dad = attr in obj2;

            if (mom && dad) {
                if (obj1[attr] == obj2[attr]) {
                    return 3;
                } else {
                    return 2;
                }
            } else if (mom || dad) {
                if (mom) {
                    return 1.25
                } else {
                    return 1.75
                }
            } else {
                return 0;
            }
        }

        function mix(attr) {
            const score = bothParentsHave(attr);

            if (score == 1.25) {
                child[attr] = obj1[attr]
            } else if (score == 1.75) {
                child[attr] = obj2[attr]
            } else if (score >= 2) {
                child[attr] = [...obj1[attr], ...obj2[attr]]
            }
        }

        if (bothParentsHave("type") == 3) {
            child['type'] = obj1['type']
        }

        attributes.forEach(attr => mix(attr))

        return child;
    }
}

module.exports = { Transform };
