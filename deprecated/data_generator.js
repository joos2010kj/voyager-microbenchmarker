
const fetch = require('node-fetch'),
      assert = require('assert'),
      seedrandom = require('seedrandom'),
      fs = require('fs');

class DataGenerator {
    constructor(count, json, key, seed) {
        assert.notStrictEqual(json.length, 0)

        let reference = json[0];
        let attrs = {}

        Object.keys(reference).forEach(attr => {
            let txt = reference[attr];

            if (typeof(txt) == 'string' && /[0-9]{4}-[0-9]{2}-[0-9]{2}/g.test(txt)) {
                attrs[attr] = "date";
            } else {
                attrs[attr] = typeof(txt);
            }
        })

        this.rng = seedrandom(seed);

        let uniqueKeys = [...new Set(json.map(elm => elm[key]))].sort((a, b) => a.localeCompare(b));

        let log = {}
        let stats = {}

        uniqueKeys.forEach(name => {
            let objs = json.filter(elm => elm[key] == name);
            log[name] = objs;

            let stat = {}
            
            for (let attr in attrs) {
                let attrArray = objs.map(val => val[attr]);
                let currAttribute = attrs[attr];

                if (attr == key) {
                    stat[attr] = {
                        value: name,
                        dtype: currAttribute,
                        isKey: true
                    }
                } else if (currAttribute == 'number') {    
                    stat[attr] = {
                        mean: attrArray.reduce((a, b) => a + b) / attrArray.length,
                        min: Math.min(...attrArray),
                        max: Math.max(...attrArray),
                        count: attrArray.length,
                        dtype: currAttribute,
                        isKey: false
                    };
                } else if (currAttribute == 'string') {
                    stat[attr] = {
                        value: attrArray.sort((a, b) => a.localeCompare(b)),
                        count: attrArray.length,
                        dtype: currAttribute,
                        isKey: false
                    }
                } else if (currAttribute == 'date') {
                    stat[attr] = {
                        value: attrArray.sort((a, b) => new Date(a) - new Date(b)),
                        count: attrArray.length,
                        dtype: currAttribute,
                        isKey: false
                    }
                } 
            }

            stats[name] = stat
        });

        // generate
        this.holder = []

        for (let i = 0; i < count; i++) {
            let index = Math.floor(this.rng() * uniqueKeys.length);
            let candidateName = uniqueKeys[index];

            let ref = stats[candidateName];
            // console.log(ref)
            let child = {};

            for (let attrName in ref) {
                let attr = ref[attrName]

                if (attr['isKey']) {
                    child[key] = attr['value'];
                } else if (attr['dtype'] == 'number') {
                    if (attr['count'] == 1) {
                        child[attrName] = attr['mean'];
                    } else {
                        let [ min, mean, max ] = [ attr['min'], attr['mean'], attr['max'] ];
                        
                        let difference = max - min;
                        let plus = this.rng() > 0.5;
                        
                        difference = difference / 2 * this.rng();
                        
                        child[attrName] = mean += plus ? difference : -difference;
                    }
                } else if (attr['dtype'] == 'string') {
                    if (attr['count'] == 1) {
                        child[attrName] = attr['value'][0];
                    } else {
                        let ind = Math.floor(attr['count'] * this.rng());

                        child[attrName] = attr['value'][ind];
                    }
                } else if (attr['dtype'] == 'date') {
                    if (attr['count'] == 1) {
                        child[attrName] = attr['value'][0];
                    } else {
                        let ind = Math.floor(attr['count'] * this.rng());

                        child[attrName] = attr['value'][ind];
                    }
                }
            }

            this.holder.push(child);
        }
    }

    getChildren() {
        return this.holder;
    }

    getAllNames() {
        return this.uniqueKeys;
    }

    getPairs() {
        return this.log;
    }

    getAllData() {
        return this.json;
    }
}
      
fetch("https://vega.github.io/vega-datasets/data/cars.json")
  .then(res => res.json())
  .then(data => {
    const seed = 1;
    const dataSize = 5;

    const generator = new DataGenerator(dataSize, data, "Name", seed);

    let output = generator.getChildren();

    fs.writeFile('./json_data.json', JSON.stringify(output, null, '\t'), err => {
        if (err) {
            console.log('Error writing file', err)
        } else {
            console.log('Successfully wrote file')
        }
    })    
  });

module.exports = { DataGenerator }
