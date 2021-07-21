const getMs = ar => ar[0] * 1e3 + ar[1] / 1e6;

const runnerPromise = async (func, args) => {

  const init = getMs(process.hrtime());
  const res = await func.apply(null, args);
  let timeElapsed = getMs(process.hrtime()) - init;
  timeElapsed = Math.round((timeElapsed + Number.EPSILON) * 100) / 100
  return {
    name: func.name,
    timeElapsed,
    res
  };
};

function captureArgs(args) {
  const _args = [];
  for (var it = 1; it < args.length; ++it)
    _args.push(args[it]);
  return _args;
}

async function benchmarkPromise(func) {
  const args = captureArgs(arguments);
  for (var idx = 0; idx < iterations; ++idx) {
    const result = await runnerPromise(func, args);
    accumulator.push(result);
  }
}

const calculate = () => {
  const functions = new Set(accumulator.map(el => el.name));
  const functionTotalTime = {};
  for (let name of functions) {
    functionTotalTime[name] = {
      sum: 0,
    };
  }

  for (let timeBench of accumulator) {
    functionTotalTime[timeBench.name].sum += timeBench.timeElapsed
  }

  for (let name of functions) {
    functionTotalTime[name].average = functionTotalTime[name].sum / iterations;
  }

  return functionTotalTime;
};

const show = () => {
  console.log(accumulator, "acc")
  const results = calculate();
  const represent = Object.keys(results)
    .map(key => ({
      name: key,
      ms: results[key].average
    }));

  console.log(represent, "rep")
};

let accumulator = [];
//const iterations = Date.now() % 1000;
const iterations = 1;

module.exports = {
  runnerPromise,
  accumulator,
  iterations,
  benchmarkPromise,
  show
};