# Microbenchmarker for Scalable Voyager

### Generating Data

In this project, we used [Crossfilter Benchmark](https://github.com/leibatt/crossfilter-benchmark-public) (2020) produced by [Battle et al.](http://www.cs.umd.edu/~leilani/static/papers/battle2020database.pdf) for generating data.  If you go to crossfilter-benchmark folder, you will be able to see the files we borrowed from the repository.

#### Requirements
- Quantitative values in the input file must not have nan values
- Input file should be in a csv format
- You must have a metadata file in [this format](https://github.com/leibatt/crossfilter-benchmark-public/blob/master/data/crossfilter/sample.json)

#### Steps
1. cd into root/crossfilter-benchmark
2. open run.sh
3. replace these three variables with your own paths:
   - input
     - Input CSV file (default: cars dataset)
   - metadata
     - JSON file specifying the type of each attribute (default: cars dataset's metadata)
   - output
     - Where you want the generated csv file to be saved, including the file name (default: root/crossfilter-benchmark/result.csv)
   - seed
     - Random seed in integer (default: 41001)
   - size
     - Size of the generated output (default: 10000)
4. run ./run.sh

#### Testing with a Sample Input
If you would like to run a small test with sample data, we have [cars.json](https://vega.github.io/vega-datasets/data/cars.json) file provided for you to test in the repository.  The default setting is based on this cars data, so you will not have to modify anything in run.sh before executing run.sh.
