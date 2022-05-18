const DataFrame = require('./utils/DataFrame.js');
const op = "all"
const path = `../example/cars/generated/normalized_ops/${op}.json`
const fs = require("fs")
const tf = require("@tensorflow/tfjs-node");

const modelSavePath = `file://../example/cars/model/norm_${op}`

// type, sampleCount, len, groupby, onehot_ops, time

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
    const model = tf.sequential({
        layers: [
            tf.layers.dense({
                inputShape: [ inputAttribute.length ],
                units: 64,
                activation: "relu",
            }),
            tf.layers.dense({
                inputShape: [ inputAttribute.length ],
                units: 64,
                activation: "relu",
            }),
            tf.layers.dense({
                units: 1,
            })
        ]
    })

    model.compile({
        optimizer: tf.train.adam(0.01),
        loss: "meanSquaredError",
    })

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
    * Train
    */
    await train([trainX, trainY], model)

   /*
   * Test
   */
    let [ y_gt, y_pred, mse ] = await test([testX, testY], model)

    let avgerr = 0;

    for (let i = 0; i < y_gt.length; i++) {
        avgerr += Math.abs(y_gt[i] - y_pred[i]);
        // console.log(clone[i], y_gt[i], y_pred[i])
    }

    avgerr /= y_gt.length;
    console.log(avgerr);

    await model.save(modelSavePath)

    console.log("Model successfully saved")
}

async function train(trainDataset, model) {
    const [ input, output ] = trainDataset

    await model.fit(input, output, {
        epochs: 50,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            if (epoch % 1 === 0) {
              console.log(`Epoch ${epoch}: error: ${logs.loss}`)
            }
          },
        },
    })

    return model
}

async function test(testDataset, model) {
    const [ input, output ] = testDataset
    const pred = model.predict(input)
    const mse = tf.losses.meanSquaredError(output, pred)

    mse.print()

    return [ output.dataSync(), pred.dataSync(), mse ]
}

main()