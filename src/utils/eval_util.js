let mse = require('mse');
let ss = require('simple-statistics');

module.exports = {
    mse: (gt, pred) => {
        return mse(gt, pred);
    },

    relativeError: (gt, pred) => {
        let score = 0;

        for (let i = 0; i < gt.length; i++) {
            let err = ss.relativeError(gt[i], pred[i])
            score += err;
        }

        return score / gt.length
    },

    rSquared: (gt, pred) => {
        let newData = [];

        for (let i = 0; i < gt.length; i++) {
            newData.push([
                gt[i], pred[i]
            ])
        }

        return ss.rSquared(newData, x => x)
    }
}
