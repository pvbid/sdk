import _ from "lodash";
import core from "mathjs/core";
var math = core.create();
math.import(require("mathjs/lib/type/number"));
math.import(require("mathjs/lib/type/complex"));
math.import(require("mathjs/lib/function/utils"));
math.import(require("mathjs/lib/expression"));
math.import(require("mathjs/lib/function/arithmetic"));
math.import(require("mathjs/lib/function/relational"));
math.import(require("mathjs/lib/function/statistics"));

math.import(require("mathjs/lib/constants"));

export default class Helpers {
    constructor() {}
    static confirmNumber(val, dflt, convertBoolean) {
        dflt = _.isUndefined(dflt) || _.isNull(dflt) ? 0 : dflt;
        if (_.isUndefined(val) || _.isNull(val)) return dflt;

        if (convertBoolean) {
            if (_.isBoolean(val) || val === "true" || val === "false") {
                val = val === true || val == "true" ? 1 : 0;
            }
        }
        if (_.isNaN(val)) return dflt;

        val = _.replace(val, new RegExp(",", "g"), "");
        val = _.toNumber(val);
        return _.isNumber(val) && _.isFinite(val) ? val : dflt;
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
