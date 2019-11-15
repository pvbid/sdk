import isNil from "lodash/isNil";
import Helpers from "@/utils/Helpers";

export default class LineItemRuleService {
  isIncluded(lineItem) {
    var includeStatuses = [];

    if (lineItem.config.rules.length > 0) {
      for (let rule of Object.values(lineItem.config.rules)) {
        if (
          lineItem.config.rule_inclusion === "all" ||
          (lineItem.config.rule_inclusion === "any" && !includeStatuses.includes(true))
        ) {
          if (
            this._isUsingUndefinedDependencies(rule, lineItem) &&
            lineItem.bid.entities.variables().predictive_pricing.value
          ) {
            // For predictive pricing, undefined rule references default to true because
            //  it is better for the predicted cost to come out high than low.
            includeStatuses.push(true);
          } else if (rule.type === "always_include") {
            includeStatuses.push(true);
          } else if (rule.type === "value_expression") {
            includeStatuses.push(this._evalExpressionRule(rule, lineItem));
          } else if (rule.type === "toggle_field") {
            includeStatuses.push(this._evalToggleFieldRule(rule, lineItem));
          } else if (rule.type === "list_field") {
            includeStatuses.push(this._evalListSelectRule(rule, lineItem));
          }
        }
      }

      return lineItem.config.rule_inclusion === "all"
        ? !includeStatuses.includes(false)
        : includeStatuses.includes(true);
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
      const args = Helpers.parseFormulaArguments(rule.expression);
      if (rule.dependencies.a.type && args.includes("a")) dependencies.push(rule.dependencies.a);
      if (rule.dependencies.b.type && args.includes("b")) dependencies.push(rule.dependencies.b);
    } else if (rule.type === "toggle_field") {
      dependencies.push(rule.dependencies.toggle_field);
    }

    // check dependencies
    for (let i = 0; i < dependencies.length; i += 1) {
      const isFullyDefined = lineItem.bid.entities.isDependencyFullyDefined(dependencies[i]);
      const isValidValue = !isNil(lineItem.bid.entities.getDependencyValue(dependencies[i]));
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

    if (!Number.isNaN(results) && typeof results === "boolean") {
      return lineItemRule.activate_on ? results : !results;
    } else return false;
  }

  _evalToggleFieldRule(lineItemRule, lineItem) {
    let toggleValue = lineItem.bid.entities.getDependencyValue(lineItemRule.dependencies.toggle_field);

    toggleValue = toggleValue === "0" || toggleValue === "1" ? Boolean(parseInt(toggleValue)) : toggleValue;

    if (!Number.isNaN(toggleValue) && typeof toggleValue === "boolean") {
      return lineItemRule.activate_on ? toggleValue : !toggleValue;
    } else return false;
  }

  _evalListSelectRule(lineItemRule, lineItem) {
    const listField = lineItem.bid.entities.getDependency(lineItemRule.dependencies.list_field);
    const hasSelected = lineItemRule.list_options.includes(listField.value);

    return lineItemRule.activate_on ? hasSelected : !hasSelected;
  }
}
