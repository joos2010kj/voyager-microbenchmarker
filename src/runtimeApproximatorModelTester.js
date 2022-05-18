const DataFrame = require('./utils/DataFrame.js');
const op = "bin"
const path = `../example/cars/generated/normalized_ops/${op}.json`
const fs = require("fs")
const tf = require("@tensorflow/tfjs-node");

const modelLoadPath = `file://../example/cars/model/norm_${op}`

async function main() {
    /*
    * Create a dataframe
    */
    const metadata = JSON.parse(fs.readFileSync(path, 'utf-8'));
    const outputAttribute = [ "time" ]
    let inputAttribute = [ "sampleCount", "groupby", "len" ]
    const onehot = [ "type", "ops" ]
    let df = new DataFrame(metadata);
    let merged = df.getColumns([...inputAttribute, ...outputAttribute])

    if (onehot.length != 0) {
        inputAttribute = inputAttribute.filter(f => !onehot.includes(f))

        for (let elm of onehot) {
            const dummies = df.getDummies(elm);
            inputAttribute = [...inputAttribute, ...dummies.columns]
            merged = merged.concatenate(dummies)
        }
    }

    df = merged.shuffle()

    /*
    * Create a neural network 
    */
    const model = await tf.loadLayersModel(modelLoadPath + "/model.json");

    /*
    * Create datasets
    */    
    const [ _, testset ] = df.crossvalidation(5, true)[0];

    let testX = testset.getColumns([ ...inputAttribute ])
    let testY = testset.getColumns([ ...outputAttribute ])

    const clone = testX.vectorize()

    testX = tf.tensor(testX.vectorize())
    testY = tf.tensor(testY.vectorize())

   /*
   * Test
   */
    let [ y_gt, y_pred, mse ] = await test([testX, testY], model)

    let avgerr = 0;

    for (let i = 0; i < y_gt.length; i++) {
        avgerr += Math.abs(y_gt[i] - y_pred[i]);
        console.log(y_gt[i], y_pred[i])
    }

    avgerr /= y_gt.length;
    console.log("average error:", avgerr);
}

async function test(testDataset, model) {
    const [ input, output ] = testDataset
    const pred = model.predict(input)
    const mse = tf.losses.meanSquaredError(output, pred)

    mse.print()

    return [ output.dataSync(), pred.dataSync(), mse ]
}

main()