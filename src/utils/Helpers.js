import core from "mathjs/core";

const math = core.create();
math.import(require("mathjs/lib/type/number"));
math.import(require("mathjs/lib/type/complex"));
math.import(require("mathjs/lib/function/utils"));
math.import(require("mathjs/lib/expression"));
math.import(require("mathjs/lib/function/arithmetic"));
math.import(require("mathjs/lib/function/trigonometry"));
math.import(require("mathjs/lib/function/logical"));
math.import(require("mathjs/lib/function/relational"));
math.import(require("mathjs/lib/function/statistics"));
math.import(require("mathjs/lib/constants"));

export default class Helpers {
  constructor() {}

  /**
   * Converts any value to a finite number.  If the value can not
   * be converted it will use the default value.  Booleans are converted to 1 or 0.
   *
   * @static
   * @param {(number|string|boolean)} val
   * @param {number} [dflt=0]
   * @returns {number}
   */
  static confirmNumber(val, dflt = 0) {
    if (Number.isFinite(val)) return val;

    if (val === undefined || val === null) return dflt;

    if (typeof val === "boolean" || val === "true" || val === "false") {
      return val === true || val === "true" ? 1 : 0;
    }

    if (Number.isNaN(val)) return dflt;

    const clean = +val.toString().replace(new RegExp(",", "g"), "");
    return Number.isFinite(clean) ? clean : dflt;
  }

  /**
   * Determines if value is a finite number.
   *
   * @static
   * @param {(string|number)} val
   * @returns {boolean}
   */
  static isNumber(val) {
    if (typeof val !== "number" && typeof val !== "string") return false;
    if (Number.isFinite(val)) return true;

    const cleaned = +val.toString().replace(new RegExp(",", "g"), "");
    return Number.isFinite(cleaned);
  }

  /**
   * Parse the variables referenced in a formula
   *
   * @param {string} formula
   * @return {string[]} Array of variables referenced in the formula
   */
  static parseFormulaArguments(formula) {
    // math js has several constants that need to be blacklisted because they look like variables when the formula is parsed
    // NOTE: 'E', 'e', and 'i' have not been included because they are actively being used as variables by pvbid users
    const mathjsConstants = [
      "Infinity",
      "LN2",
      "LN10",
      "LOG2E",
      "LOG10E",
      "NaN",
      "null",
      "phi",
      "pi",
      "PI",
      "SQRT1_2",
      "SQRT2",
      "tau",
      "undefined",
    ];
    if (formula) {
      const node = math.parse(this._cleanFormula(formula.toString()));
      const args = node.filter(n => n.isSymbolNode && !mathjsConstants.includes(n.name));
      return args.map(arg => arg.name.toLowerCase());
    }
    return [];
  }

  /**
   * Calculate the value of the given formula
   *
   * @param {string} formula formula to evaluate
   * @param {Object.<string, number|boolean|string>} valuesMap
   * @param {object} options
   * @param {boolean} [options.castValuesToNumbers=true] flag forces all non-number values to be treated as numbers
   * @return {number|boolean|string} the calculated value of the formula
   */
  static calculateFormula(formula, valuesMap, options = { castValuesToNumbers: true }) {
    if (!formula || formula === "") {
      formula = "1";
      return;
    }
    const cleanFormula = this._cleanFormula(formula);
    const cleanValues = this._cleanValues(valuesMap, options.castValuesToNumbers);

    let result;
    try {
      result = math.eval(cleanFormula, cleanValues);
      if (options.castValuesToNumbers) {
        result = math.typeof(result) == "boolean" ? Number(result) : result;
        result = math.isNumeric(result) && result != Infinity ? result : null;
      }
    } catch (e) {
      console.log(e, cleanFormula, cleanValues);
    }
    return result;
  }

  static _cleanFormula(formula) {
    if (!formula) return "1";
    return formula
      .toString()
      .toLowerCase()
      .replace(/[\[\]]/g, "") // what is this?
      .replace(/roundup/gi, "ceil") // change roundup to ceil
      .replace(/rounddown/gi, "floor") // change rowndown to floor
      .replace(/<=/g, "smallerEq") // temp hold the smallerEq val
      .replace(/>=/g, "largerEq") // temp hold the largerEq val
      .replace(/=/g, "==") // change equals to the js version of equal to
      .replace(/smallerEq/gi, "<=") // revert back to smaller than equal to
      .replace(/largerEq/gi, ">=") // revert back to smaller than equal to
      .replace(/#/g, "pound_sign"); // replace pound sign
  }

  static _cleanValues(valuesMap, castAsNumbers = true) {
    if (valuesMap === undefined || valuesMap === null) return {};
    const map = { ...valuesMap };
    Object.keys(map).forEach(key => {
      const val = map[key];
      if (val === null && castAsNumbers) {
        map[key.toLowerCase()] = 1;
      } else if (typeof val === "boolean" || val === "true" || val === "false") {
        if (castAsNumbers) {
          map[key.toLowerCase()] = val === true || val === "true" ? 1 : 0;
        } else {
          map[key.toLowerCase()] = val === true || val === "true";
        }
      } else if (this.isNumber(val)) {
        map[key.toLowerCase()] = this.confirmNumber(val);
      } else {
        map[key.toLowerCase()] = val ? val.replace(/#/g, "pound_sign") : val;
      }
    });
    return map;
  }

  /**
   * FIXME
   * don't think there is a good way to validate without just eval'ing
   * with the variables substituted in.
   */
  static validateFormula(formula, valuesMap) {
    let val = null;
    try {
      val = this.calculateFormula(formula, valuesMap);
    } catch (exception) {
      return false;
    }
    return !Number.isNaN(parseInt(val));
  }

  /**
   * Evaluate the logical expression
   *
   * @param {string} formula
   * @param {object} valueMap
   * @return {boolean}
   */
  static evalExpression(formula, valueMap) {
    const cleanFormula = this._cleanFormula(formula);
    const cleanValues = this._cleanValues(valueMap, false);

    let result;
    try {
      result = !!math.eval(cleanFormula, cleanValues);
    } catch (e) {
      console.log(e, cleanFormula, cleanValues);
    }
    return result;
  }

  static union(...iterables) {
    const set = new Set();

    for (let iterable of iterables) {
      for (let item of iterable) {
        set.add(item);
      }
    }

    return set;
  }
}
