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
                    if (rule.type === "always_include") {
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

    _evalExpressionRule(lineItemRule, lineItem) {
        var valueMap = {
            a: 0,
            b: 0
        };
        valueMap.a = Helpers.confirmNumber(
            lineItem.bid.relations.getDependencyValue(lineItemRule.dependencies.a),
            0,
            true
        );
        valueMap.b = Helpers.confirmNumber(
            lineItem.bid.relations.getDependencyValue(lineItemRule.dependencies.b),
            0,
            true
        );

        var results = Helpers.evalExpression(lineItemRule.expression, valueMap);

        if (!_.isNaN(results) && _.isBoolean(results)) {
            return lineItemRule.activate_on ? results : !results;
        } else return false;
    }

    _evalToggleFieldRule(lineItemRule, lineItem) {
        var toggleValue = lineItem.bid.relations.getDependencyValue(lineItemRule.dependencies.toggle_field);
        toggleValue = _.isUndefined(toggleValue) || _.isNull(toggleValue) ? false : toggleValue;
        toggleValue = toggleValue === "0" || toggleValue === "1" ? Boolean(parseInt(toggleValue)) : toggleValue;

        if (!_.isNaN(toggleValue) && _.isBoolean(toggleValue)) {
            return lineItemRule.activate_on ? toggleValue : !toggleValue;
        } else return false;
    }

    _evalListSelectRule(lineItemRule, lineItem) {
        var listField = lineItem.bid.relations.getDependency(lineItemRule.dependencies.list_field);

        var hasSelected = false;

        hasSelected = _.includes(lineItemRule.list_options, listField.value);

        return lineItemRule.activate_on ? hasSelected : !hasSelected;
    }
}
