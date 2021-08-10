#!/bin/bash

input='data/cars/cars.csv'
metadata='data/cars/sample.json'
output='result.csv'
seed=41001
size=10000

python datagen.py -x $input -y $metadata -o $output -r $seed -s $size
