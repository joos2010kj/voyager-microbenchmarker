#!/bin/bash -x

# assuming in the figures/vega-lite-specs/nhanes folder
mkdir -p ./figures
for vname in barchart
do
  rm ./figures/${vname}.pdf
  node_modules/vega-lite/bin/vl2pdf ./${vname}.vl.json > ./figures/${vname}.pdf
done
