const DataFrame = require('./utils/DataFrame.js');
const path = "../example/cars/generated/project_record_1500.json"
const fs = require("fs")
const tf = require("@tensorflow/tfjs-node");

const modelLoadPath = "file://../example/cars/model/project"

async function main() {
    /*
    * Create a dataframe
    */
    const metadata = JSON.parse(fs.readFileSync(path, 'utf-8'));
    const df = new DataFrame(metadata);
    const inputAttribute = [ "sampleCount", "len" ]
    const outputAttribute = [ "time" ]

    /*
    * Create a neural network 
    */
    const model = await tf.loadLayersModel(modelLoadPath + "/model.json");

    /*
    * Create datasets
    */    
    const [ trainset, testset ] = df.crossvalidation(5, true)[0];

    let trainX = trainset.getColumns([ ...inputAttribute ])
    let trainY = trainset.getColumns([ ...outputAttribute ])

    let testX = testset.getColumns([ ...inputAttribute ])
    let testY = testset.getColumns([ ...outputAttribute ])

    trainX = tf.tensor(trainX.vectorize())
    trainY = tf.tensor(trainY.vectorize())

    const clone = testX.vectorize()

    testX = tf.tensor(testX.vectorize())
    testY = tf.tensor(testY.vectorize())

   /*
   * Test
   */
    let [ y_gt, y_pred, mse ] = await test([testX, testY], model)

    let avgerr = 0;

    for (let i = 0; i < y_gt.length; i++) {
        // avgerr += Math.abs(y_gt[i] - y_pred[i]);
        console.log(clone[i], y_gt[i], y_pred[i])
    }

    // avgerr /= y_gt.length;
    // console.log(avgerr);
}

async function test(testDataset, model) {
    const [ input, output ] = testDataset
    const pred = model.predict(input)
    const mse = tf.losses.meanSquaredError(output, pred)

    mse.print()

    return [ output.dataSync(), pred.dataSync(), mse ]
}

main()