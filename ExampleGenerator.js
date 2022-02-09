const { Transform } = require('./transform')
const _ = require('lodash');
const fs = require('fs');
var sqlTemplate = require('./SQLtemplate')


class ExampleGenerator {
  static init = (path, stringify) => {
    const STATISTICS = path;
    const STATS = JSON.parse(fs.readFileSync(STATISTICS, 'utf-8'));
    const STRINGIFY = stringify;
    const Template = (cls, expr, sql) => {
      return {
        transform: cls,
        expr: expr,
        sql: sql
      }
    }

    return class {
      static Project = class {
        static generate(count) {
          const exprFactory = (field, renamed) => _.sample([Transform.Project.as(field, renamed), Transform.Project.fields(field)]);
          const sqlFactory = (param, expr) => {                   // SQL Factory for Project

          };

          return Array.from(Array(count).keys()).map(index => {
            const field = _.sample(Object.keys({ ...STATS['quantitative'], ...STATS['categorical'] }))
            const renamed = `name_${index}`;

            const expr = exprFactory(field, renamed);
            //const sql = sqlFactory(undefined, expr);           // Missing arg
            const sql = sqlTemplate.Transform.Project.fields([field], [renamed])

            const child = Template('project', expr, sql);

            return STRINGIFY ? JSON.stringify(child) : child;
          })
        }
      }

      static Collect = class {
        static generate(count) {
          const exprFactory = (field, order) => Transform.Collect.sort(field, order)
          const sqlFactory = (param, expr) => {                   // SQL Factory for Collect

          };

          return Array.from(Array(count).keys()).map(index => {
            const field = _.sample(Object.keys({ ...STATS['quantitative'], ...STATS['categorical'] }))
            const order = _.sample(['ascending', 'descending'])

            const expr = exprFactory(field, order);
            const sql = sqlTemplate.Transform.Collect.sort(field, order)          // Missing arg

            const child = Template('collect', expr, sql);

            return STRINGIFY ? JSON.stringify(child) : child;
          })
        }
      }

      static Extent = class {
        static generate(count) {
          const exprFactory = (field, signal) => Transform.Extent.extent(field, signal)
          const sqlFactory = (param, expr) => {                   // SQL Factory for Collect

          };

          return Array.from(Array(count).keys()).map(index => {
            const field = _.sample(Object.keys(STATS['quantitative']))
            const signal = _.sample(['extent', undefined])

            const expr = exprFactory(field, signal);
            //const sql = sqlFactory(undefined, expr);            // Missing args
            const sql = sqlTemplate.Transform.Extent.field(field)

            const child = Template('extent', expr, sql);

            return STRINGIFY ? JSON.stringify(child) : child;
          })
        }
      }
    }
  }
}

// const path = "quant_and_qual_stat.json";
// const stringify = true;

// const Generator = ExampleGenerator.init(path, stringify);

// const result = _.sample([Generator.Extent.generate(2), Generator.Collect.generate(2), Generator.Project.generate(2)]);

// console.log(result)
module.exports = { ExampleGenerator }
