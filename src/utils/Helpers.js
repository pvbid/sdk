import _ from "lodash";
import core from "mathjs/core";
var math = core.create();
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
    static confirmNumber(val, dflt) {
        if (_.isFinite(val)) return val;

        dflt = _.isUndefined(dflt) || _.isNull(dflt) ? 0 : dflt;
        if (_.isUndefined(val) || _.isNull(val)) return dflt;

        if (_.isBoolean(val) || val === "true" || val === "false") {
            return val === true || val == "true" ? 1 : 0;
        }

        if (_.isNaN(val)) return dflt;

        val = _.replace(val, new RegExp(",", "g"), "");
        val = _.toNumber(val);
        return _.isNumber(val) && _.isFinite(val) ? val : dflt;
    }

    /**
     * Determines if value is a finite number.
     * 
     * @static
     * @param {(string|number)} val 
     * @returns {boolean} 
     */
    static isNumber(val) {
        if (_.isFinite(val)) return true;
        val = _.replace(val, new RegExp(",", "g"), "");
        return _.isFinite(_.toNumber(val));
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
        const mathjsConstants = ['Infinity', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'NaN', 'null', 'phi', 'pi', 'PI', 'SQRT1_2', 'SQRT2', 'tau', 'undefined'];
        if (formula) {
            const node = math.parse(this._clean(formula.toString().toLowerCase()));
            const args = node.filter((n) => n.isSymbolNode && !mathjsConstants.includes(n.name));
            return args.map(arg => arg.name);
        }
        return [];
    }

    static calculateFormula(formula, valuesMap) {
        var result;
        if (!formula || formula === "") {
            formula = "1";
            return;
        }
        formula = formula.toString().toLowerCase();
        try {
            _.each(valuesMap, function(val, key) {
                if (_.isNull(val)) {
                    valuesMap[key.toLowerCase()] = 1;
                } else if (_.isBoolean(val) || val === "true" || val === "false") {
                    valuesMap[key.toLowerCase()] = val === true || val === "true" ? 1 : 0;
                } else if (!_.isNaN(parseFloat(val))) {
                    valuesMap[key.toLowerCase()] = parseFloat(val);
                } else {
                    valuesMap[key.toLowerCase()] = val.replace(/#/g, "pound_sign");
                }
            });
            if (_.isUndefined(valuesMap) || _.isNull(valuesMap)) {
                valuesMap = [];
            }

            result = math.eval(this._clean(formula), valuesMap);
            result = math.typeof(result) == "boolean" ? Number(result) : result;
            result = math.isNumeric(result) && result != Infinity ? result : null;
        } catch (e) {
            console.log(e, formula, valuesMap);
            // FIXME - do something?
        }
        return result;
    }
    static _clean(formula) {
        return formula
            .replace(/[\[\]]/g, "") // what is this?
            .toLowerCase() // make everything lowercase
            .replace(/roundup/g, "ceil") // change roundup to ceil
            .replace(/rounddown/g, "floor") // change rowndown to floor
            .replace(/<=/g, "smallerEq") // temp hold the smallerEq val
            .replace(/>=/g, "largerEq") // temp hold the largerEq val
            .replace(/=/g, "==") // change equals to the js version of equal to
            .replace(/smallerEq/g, "<=") // revert back to smaller than equal to
            .replace(/largerEq/g, ">=") // revert back to smaller than equal to
            .replace(/#/g, "pound_sign"); // replace pound sign
    }
    /**
     * FIXME
     * don't think there is a good way to validate without just eval'ing
     * with the variables substituted in.
     */
    static validateFormula(formula, valuesMap) {
        var val = null;
        try {
            val = this.calculateFormula(formula, valuesMap);
        } catch (exception) {
            return false;
        }
        return !_.isNaN(parseInt(val));
    }
    static evalExpression(formula, valueMap) {
        var results = this.calculateFormula(formula, valueMap);
        return results == 1 ? true : false;
    }
}
