import pandas as pd
import time
import logging
import json

current_milli_time = lambda: int(round(time.time() * 1000))
logger = logging.getLogger("idebench")

class Normalizer():
    def __init__(self, csv, metadata):
        self.csv = csv

        with open(metadata, "r") as f:
            self.sample_json = json.load(f)

        self.get_statistics()

    def get_statistics(self):
            # load sample data
            df = pd.read_csv(self.csv, header=0)

            fieldtypes = self.sample_json["tables"]["fact"]["fields"]
        
            cat_col_names = [ col["field"] for col in fieldtypes if col["type"] == "categorical" ]
            quant_col_names = [ col["field"] for col in fieldtypes if col["type"] == "quantitative" ]

            for cat_col_name in cat_col_names:
                df[cat_col_name] = df[cat_col_name].astype("category")

            quant_col_types = {
                name: df[name].dtype for name in quant_col_names
            }     

            means = df.mean()
            stdevs = df.std()
            minimum = df.min()
            maximum = df.max()

            fields = [ field['field'] for field in fieldtypes ]

            self.stat_df = pd.DataFrame({
                'field': [ field for field in fields ],
                'mean': [ means[field] if field in means else 'NA' for field in fields ],
                'stdev': [ stdevs[field] if field in stdevs else 'NA' for field in fields ],
                'min': [ minimum[field] if field in quant_col_names else 'NA' for field in fields ],
                'max': [ maximum[field] if field in quant_col_names else 'NA' for field in fields ],
                'type': [ str(quant_col_types[field]) if field in quant_col_names else 'categorical' if field in cat_col_names else 'NA' for field in fields ]
            })

            self.stat_df.set_index('field', inplace=True)

            self.quant_stat_dict = {
                field: list(self.stat_df.loc[field])[:-1] + [ 1 if 'int' in str(self.stat_df.loc[field]['type']) else 0 ] \
                    for field in fields if str(self.stat_df.loc[field]['type']) != 'categorical'
            }
            
            self.cat_stat_dict = {
                field: sorted(list(set(df[field]))) for field in fields if str(self.stat_df.loc[field]['type']) == 'categorical'
            }

    def get_stat_df(self):
        return self.stat_df

    def get_stat_dict(self):
        return self.quant_stat_dict, self.cat_stat_dict

    def save(self, df_output=None, dict_output=None):
        if df_output is not None and df_output.endswith(".json"):
            self.stat_df.transpose().to_json(df_output, indent=4)

        if dict_output is not None and dict_output.endswith(".json"):
            with open(dict_output, 'w') as f:
                json.dump({
                    'quantitative': self.quant_stat_dict,
                    'categorical': self.cat_stat_dict
                }, f, indent=4)



csv_path = "../crossfilter-benchmark/data/cars/cars.csv"
metadata_path = "../crossfilter-benchmark/data/cars/sample.json"
save_path = "quant_and_qual_stat.json"

norm = Normalizer(csv_path, metadata_path)

quant, qual = norm.get_stat_dict()

print(pd.DataFrame(quant).transpose())

norm.save(dict_output=save_path)
