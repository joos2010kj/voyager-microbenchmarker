module.exports = {
    // Fisher-Yates (aka Knuth) Shuffle
    shuffle: array => {     
        let currentIndex = array.length,  randomIndex;
      
        // While there remain elements to shuffle...
        while (currentIndex != 0) {
      
          // Pick a remaining element...
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
      
          // And swap it with the current element.
          [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
        }
      
        return array;
    },

    crossvalidation: (fold, len) => {
        let interval = Math.ceil(len / fold);
        let folds = [];

        for (let i = 0; i < fold; i++) {
            if (i == fold - 1) {
                folds.push([i * interval, Math.min((i + 1) * interval - 1, len - 1)])
            } else {
                folds.push([i * interval, (i + 1) * interval - 1])
            }
        }

        return folds;
    },
}
