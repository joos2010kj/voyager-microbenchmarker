var binning = require("./bin")
const stat = require('vega-statistics')

/**
 * Filter
 * - between
 * - not_between
 * - equal
 * - is_null
 * - is_not_null
 */

class Transform {
  static Filter = class {
    static cast_type(value) {
      if (typeof (value) == "string") {
        let match = value.match(/[12][0-9]{3}-[01][0-9]-[0123][0-9]/g)

        if (match != null && value.length == 10) {
          return value;
        } else {
          return `'${value}'`;
        }
      } else if (typeof (value) == "number") {
        return `${value}`;
      } else {
        return value;
      }
    }

    // datum.a >= 10 && datum.a < 20
    static between(item, min, inclusive1, max, inclusive2) {
      min = Transform.Filter.cast_type(min);
      max = Transform.Filter.cast_type(max);

      return `
      SELECT *
      FROM %I
      WHERE ${item} ${inclusive1 ? ">=" : ">"} ${min} AND ${item} ${inclusive2 ? "<=" : "<"} ${max}
      `
    }

    // datum.Miles_per_Gallon < 15 || datum.Miles_per_Gallon > 20
    static not_between(item, min, inclusive1, max, inclusive2) {
      min = Transform.Filter.cast_type(min);
      max = Transform.Filter.cast_type(max);

      return `
      SELECT *
      FROM %I
      WHERE ${item} ${inclusive1 ? "<=" : "<"} ${min} OR ${item} ${inclusive2 ? ">=" : ">"} ${max}
      `
    }

    // datum.Name == 'pontiac catalina brougham'
    static equal(item, value) {
      value = Transform.Filter.cast_type(value);

      return `
      SELECT *
      FROM %I
      WHERE ${item} == ${value}
      `
    }

    // datum.Name == 'pontiac catalina brougham'
    static not_equal(item, value) {
      value = Transform.Filter.cast_type(value);

      return `
      SELECT *
      FROM %I
      WHERE ${item} <> ${value}
      `
    }

    // datum.Miles_per_Gallon == null
    static is_null(item) {
      return `
      SELECT *
      FROM %I
      WHERE ${item} IS NULL
      `
    }

    // datum.Miles_per_Gallon != null
    static is_not_null(item) {
      return `
      SELECT *
      FROM %I
      WHERE ${item} IS NOT NULL
      `
    }

    static sandbox() {
      let obj = "Miles_per_Gallon"

      console.log(Transform.Filter.between(obj, 15, true, 20, false))
      console.log(Transform.Filter.not_between(obj, 15, false, 20, false))
      console.log(Transform.Filter.equal("Year", "2021-07-06"))
      console.log(Transform.Filter.is_null(obj))
      console.log(Transform.Filter.is_not_null(obj))
    }
  }

  static Aggregate = class {
    static build(params) {
      const select = []
      for (const ind in params.fields) {
        if (params.hasOwnProperty('op')) {
          select.push(params.fields[ind] === null ? Transform.Aggregate.aggregateOpToSql(params.op[ind], '*', "postgres") : Transform.Aggregate.aggregateOpToSql(params.op[ind], params.fields[ind], "postgres"))
        }
      }
      if (params.hasOwnProperty('groupby')) {
        select.push(...params.groupby)
        return `
        SELECT ${select.join(", ")}\
        FROM %I\
        GROUP BY ${params.groupby.join(", ")}
        `
      } else {
        return `
        SELECT ${select.join(", ")}\
        FROM %I
        `
      }

    }

    static percentileContSql(field, fraction, db) {
      // creates a percentile predicate for a SQL query
      switch (db.toLowerCase()) {
        case "postgres":
          return `PERCENTILE_CONT(${fraction}) WITHIN GROUP (ORDER BY ${field})`;
        case "duckdb":
          return `QUANTILE(${field}, ${fraction})`;
        default:
          throw Error(`Unsupported database: ${db}`);
      }
    }

    static aggregateOpToSql(op, field, db) {
      // Converts supported Vega operations to SQL
      // for the given field.
      // FixMe: we will need to eventually support the case where
      // the 'field' is actually a vega expression, which would
      // require translating vega expressions into SQL.
      // FixMe: decide what to do for argmax, argmin, and confidence intervals (ci0, ci1).
      switch (op.toLowerCase()) {
        case "average":
          return `AVG(${field})`;
        case "count":
          return `COUNT(*)`;
        case "valid":
          return `SUM(CASE WHEN ${field} IS NULL THEN 0 ELSE 1 END)`;
        case "missing":
          return `SUM(CASE WHEN ${field} IS NULL THEN 1 ELSE 0 END)`;
        case "distinct":
          return `COUNT(DISTINCT ${field}) + COUNT(DISTINCT CASE WHEN ${field} IS NULL THEN 1 END)`;
        case "sum":
          return `SUM(${field})`;
        case "variance":
          return `VAR_SAMP(${field})`;
        case "variancep":
          return `VAR_POP(${field})`;
        case "stdev":
          return `STDDEV_SAMP(${field})`;
        case "stdevp":
          return `STDDEV_POP(${field})`;
        case "stderr":
          return `STDDEV_SAMP(${field})/SQRT(COUNT(${field}))`;
        case "median":
          return Transform.Aggregate.percentileContSql(field, 0.5, db);
        case "q1":
          return Transform.Aggregate.percentileContSql(field, 0.25, db);
        case "q3":
          return Transform.Aggregate.percentileContSql(field, 0.75, db);
        case "min":
          return `MIN(${field})`;
        case "max":
          return `MAX(${field})`;
        default:
          throw Error(`Unsupported aggregate operation: ${op}`);
      }
    }


    static sandbox() {
      console.log(Transform.Aggregate.groupby("Miles_per_gallon"))
    }
  }

  static Bin = class {
    static maxbins(item, min, max, maxbins) {
      // const spec = {
      //   "type": "bin",
      //   "field": item,
      //   "extent": [min, max],
      //   "maxbins": bins
      // }
      // const bin = binning.bin(spec)
      const bin = stat.bin({ extent: [min, max], maxbins: maxbins }
      )

      console.log(bin)
      return `select bin0 + ${bin.step} as bin1 , * from (select ${bin.step} * floor(cast(${item} as float)/ ${bin.step}) as bin0, * from %I where ${item} between ${bin.start} and ${bin.stop}) as sub UNION ALL select NULL as bin0, NULL as bin1, * from %I where ${item} is null`
    }

    static sandbox() {
      console.log(Transform.Bin.maxbins("Miles_per_gallon", 0, 50, 10))
    }
  }

  static Extent = class {
    static field(item) {

      return `select min(${item}), max(${item}) from %I`
    }

    static sandbox() {
      console.log(Transform.Extent.field("Miles_per_gallon"))
    }
  }

  static Project = class {
    static fields(items, as) {
      const list = []
      for (const id in items) {
        list.push(`${fields[id]} as ${as[id]}`)
      }

      return `select ${list.join(",")} from %I`
    }

    static sandbox() {
      console.log(Transform.Project.fields(["Miles_per_gallon"], ["m1"]))
    }
  }

  static Stack = class {
    static property(field, groupby, sort, as) {
      const orderList = []
      for (const [index, field] of sort.entries()) {

        orderList.push(index < order.length ? (order[index] === 'descending' ? `${field} DESC` : `${field}`) : `${field}`)

      }

      return `select *, ${as[1]} - ${field} as ${as[0]} from (select *, sum(${fields}) over (partition by ${groupby.join(",")} order by ${orderList.join(",")}) ${as[1]} from ${from}) t`
    }

    static sandbox() {
      console.log(Transform.Stack.property(["Miles_per_gallon"], ["m1"]))
    }
  }
}

module.exports = { Transform }
// console.log(Transform.Filter.between("Miles_per_Gallon", "15", false, "20", true))

// console.log(Transform.Aggregate.build({ fields: ["Miles_per_Gallon"], op: ["average"], groupby: ["cylinders"] }))

// console.log(Transform.Bin.maxbins("Miles_per_gallon", 0, 50, 10))