const DataFrame = require('./utils/DataFrame.js');
const op = "all"
const path = `../example/cars/generated/normalized_ops/${op}.json`
const fs = require("fs")
const tf = require("@tensorflow/tfjs-node");
const sk = require('scikitjs')

sk.setBackend(tf)

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
    * Create datasets
    */    
    const [ trainset, testset ] = df.crossvalidation(5, true)[0];

    let trainX = trainset.getColumns([ ...inputAttribute ])
    let trainY = trainset.getColumns([ ...outputAttribute ])

    let testX = testset.getColumns([ ...inputAttribute ])
    let testY = testset.getColumns([ ...outputAttribute ])

    trainX = tf.tensor(trainX.vectorize())
    trainY = tf.tensor(trainY.vectorize())

    testX = tf.tensor(testX.vectorize())
    testY = tf.tensor(testY.vectorize())

    async function run(model, squeeze, save) {
        if (save != true) {
            save = false;
        }

        /*
        * Train
        */
        const lr = model
        const X = trainX // 2D Matrix with a single column vector
        const y = trainY
    
        if (squeeze) {
            trainX = (trainY).arraySync()
            testX = (testY).arraySync()
            trainY = tf.squeeze(trainY).arraySync()
            testY = tf.squeeze(testY).arraySync()
        }
        
        await lr.fit(X, y)
    
        /*
       * Test
       */
        let y_pred = lr.predict(testX).arraySync()
        let y_gt = testY.arraySync()
    
        let avgerr = 0;
    
        for (let i = 0; i < y_gt.length; i++) {
            avgerr += Math.abs(y_gt[i] - y_pred[i]);
            // console.log(y_gt[i], y_pred[i])
        }
    
        avgerr /= y_gt.length;

        console.log(avgerr)

        if (save) {
            await model.save(modelSavePath)
        
            console.log("Model successfully saved")
        }
    }

    // await run(new sk.LogisticRegression({ penalty: 'none' }), true)
    // await run(new sk.LinearSVC(), true)
    // await run(new sk.DecisionTreeRegressor())
    await run(new sk.LinearSVR())
    await run(new sk.RidgeRegression())
    await run(new sk.LinearRegression())
    
}

main()