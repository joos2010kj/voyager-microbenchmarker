#!/bin/bash

input='data/cars/cars.csv'
metadata='data/cars/sample.json'
output='result.csv'

python datagen.py -x $input -y $metadata -o $output
