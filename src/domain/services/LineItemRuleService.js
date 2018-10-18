import _ from "lodash";
import Helpers from "../../utils/Helpers";

export default class LineItemRuleService {
    isIncluded(lineItem) {
        var includeStatues = [];

        if (lineItem.config.rules.length > 0) {
            for (let rule of Object.values(lineItem.config.rules)) {
                if (
                    lineItem.config.rule_inclusion === "all" ||
                    (lineItem.config.rule_inclusion === "any" && !_.includes(includeStatues, true))
                ) {
                    if (this._isUsingUndefinedDependencies(rule, lineItem)) {
                        // For predictive pricing, undefined rule references default to true because
                        //  it is better for the predicted cost to come out high than low.
                        if (lineItem.bid.entities.variables().predictive_pricing.value) {
                            includeStatues.push(true);
                        } else {
                            includeStatues.push(false);
                        }
                    } else if (rule.type === "always_include") {
                        includeStatues.push(true);
                    } else if (rule.type === "value_expression") {
                        includeStatues.push(this._evalExpressionRule(rule, lineItem));
                    } else if (rule.type === "toggle_field") {
                        includeStatues.push(this._evalToggleFieldRule(rule, lineItem));
                    } else if (rule.type === "list_field") {
                        includeStatues.push(this._evalListSelectRule(rule, lineItem));
                    }
                }
            }

            return lineItem.config.rule_inclusion === "all"
                ? !_.includes(includeStatues, false)
                : _.includes(includeStatues, true);
        } else return false;
    }

    /**
     * Determine if the line item should be weighted by examining the rules
     * A line item will be weighted if predictive pricing is enabled AND a rule dependency is not defined
     *
     * @param {BidEntity} lineItem
     * @return {boolean}
     */
    isWeighted(lineItem) {
        if (lineItem.bid.entities.variables().predictive_pricing.value) {
            if (lineItem.config.rules.length > 0) {
                for (let rule of Object.values(lineItem.config.rules)) {
                    if (this._isUsingUndefinedDependencies(rule, lineItem)) {
                        return true;
                    }
                }
            }
            return false;
        }
        return false;
    }

    /**
     * Determine if a rule is relying on any undefined dependency values
     *
     * @param {object} rule The line item rule
     * @param {object} lineItem The line item
     * @return {boolean}
     */
    _isUsingUndefinedDependencies(rule, lineItem) {
        // handle special cases
        if (rule.type === "always_include") return false;
        if (rule.type === "list_field") {
            const dep = lineItem.bid.entities.getDependency(rule.dependencies.list_field);
            return !dep.value;
        }

        // get dependencies
        let dependencies = [];
        if (rule.type === "value_expression") {
            if (rule.dependencies.a.type) dependencies.push(rule.dependencies.a);
            if (rule.dependencies.b.type) dependencies.push(rule.dependencies.b);
        } else if (rule.type === "toggle_field") {
            dependencies.push(rule.dependencies.toggle_field);
        }

        // check dependencies
        for (let i = 0; i < dependencies.length; i += 1) {
            const isFullyDefined = lineItem.bid.entities.isDependencyFullyDefined(dependencies[i]);
            const isValidValue = !_.isNil(lineItem.bid.entities.getDependencyValue(dependencies[i]))
            if (!isFullyDefined || !isValidValue) {
                return true;
            }
        }
        return false;
    }

    _evalExpressionRule(lineItemRule, lineItem) {
        const a = lineItem.bid.entities.getDependencyValue(lineItemRule.dependencies.a);
        const b = lineItem.bid.entities.getDependencyValue(lineItemRule.dependencies.b);

        const valueMap = {
            a: Helpers.confirmNumber(a, 0),
            b: Helpers.confirmNumber(b, 0),
        };

        const results = Helpers.evalExpression(lineItemRule.expression, valueMap);

        if (!_.isNaN(results) && _.isBoolean(results)) {
            return lineItemRule.activate_on ? results : !results;
        } else return false;
    }

    _evalToggleFieldRule(lineItemRule, lineItem) {
        let toggleValue = lineItem.bid.entities.getDependencyValue(lineItemRule.dependencies.toggle_field);

        toggleValue = toggleValue === "0" || toggleValue === "1" ? Boolean(parseInt(toggleValue)) : toggleValue;

        if (!_.isNaN(toggleValue) && _.isBoolean(toggleValue)) {
            return lineItemRule.activate_on ? toggleValue : !toggleValue;
        } else return false;
    }

    _evalListSelectRule(lineItemRule, lineItem) {
        const listField = lineItem.bid.entities.getDependency(lineItemRule.dependencies.list_field);
        const hasSelected = _.includes(lineItemRule.list_options, listField.value);

        return lineItemRule.activate_on ? hasSelected : !hasSelected;
    }
}
