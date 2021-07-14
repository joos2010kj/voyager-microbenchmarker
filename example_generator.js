/**
 *                    Mean                  STD                 Min     MAX     StrictInt
 * Miles_per_Gallon : 23.514572864321607	7.815984312565783	9	    46.6    False
 * Cylinders        : 5.475369458128076	    1.7121596315485292	3	    8       True
 * Displacement     : 194.77955665024618	104.92245837948867	68	    455     True
 * Horsepower       : 105.08250000000002	38.768779183105224	46	    230     True
 * Weight_in_lbs    : 2979.4137931034484	847.0043282393514	1613	5140    True
 * Acceleration     : 15.51970443349754	    2.8033588163425462	8	    24.8    False
 */

const seedrandom = require('seedrandom');
const rng = seedrandom('rng');      // SEED (If you don't want seed, replace all rng with Math.random())

const STAT = {
    "Miles_per_Gallon": [23.514572864321607,    7.815984312565783,	9,	    46.6],
    "Cylinders"       : [5.475369458128076,	    1.7121596315485292,	3,	    8   ],
    "Displacement"    : [194.77955665024618,	104.92245837948867,	68,	    455 ],
    "Horsepower"      : [105.08250000000002,	38.768779183105224,	46,	    230 ],
    "Weight_in_lbs"   : [2979.4137931034484,	847.0043282393514,	1613,	5140],
    "Acceleration"    : [15.51970443349754,	    2.8033588163425462,	8,	    24.8]
}

function generate_examples(stats, count, strictInt) {
    let ranges = [];
    let [ mean, std, min, max ] = stats;

    function randn_bm() {
        var u = 0, v = 0;
        while(u === 0) u = rng();
        while(v === 0) v = rng();

        return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    }

    function generate_example() {
        let range = [randn_bm(), randn_bm()].map(each => {
            return each * std + mean
        })

        range = range.sort((a, b) => a - b)

        range[0] = Math.max(min, range[0])
        range[1] = Math.min(max, range[1])

        return strictInt ? range.map(each => Math.round(each)) : range;        
    }

    for(let i = 0; i < count; i++) {
        ranges.push(generate_example());
    }

    return ranges;
}

let sample_count = 10;

let miles_per_gallon = generate_examples(STAT['Miles_per_Gallon'], sample_count, false)
let cylinders = generate_examples(STAT["Cylinders"], sample_count, true)
let displacement = generate_examples(STAT["Displacement"], sample_count, true);
let horsepower = generate_examples(STAT['Horsepower'], sample_count, true)
let weight_in_lbs = generate_examples(STAT['Weight_in_lbs'], sample_count, true)
let acceleration = generate_examples(STAT['Acceleration'], sample_count, false)

// console.log(acceleration)

module.exports = { STAT, generate_examples };
