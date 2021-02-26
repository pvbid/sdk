import cloneDeep from "lodash/cloneDeep";
import round from "lodash/round";
import xor from "lodash/xor";
import each from "lodash/each";
import isEqual from "lodash/isEqual";
import {waitForFinalEvent} from "@/utils/WaitForFinalEvent";
import Helpers from "@/utils/Helpers";
import BidEntity from "./BidEntity";
import LineItemGroupEntityHelper from "./services/LineItemGroupEntityHelper";

/**
 * Component Class
 */
export default class Component extends BidEntity {
  /**
   * Creates an instance of Component.
   * @param {object} componentData - structured component data
   * @param {Bid} bid - The bid in which the component belongs to.
   */
  constructor(componentData, bid) {
    super();
    /**
     * Reference to the bid that the component belongs to.
     * @type {Bid}
     */
    this.bid = bid;
    this._original = cloneDeep(componentData);
    this._data = componentData;
  }

  /**
   * The summed cost from the nested line items.
   *
   * @type {number}
   */
  get cost() {
    return this._data.cost;
  }

  /**
   * @type {number}
   */
  set cost(val) {
    if (Helpers.isNumber(val) && Helpers.confirmNumber(val) !== this._data.cost) {
      this._applyComponentValue("cost", this._data.cost, val, false);
      this.dirty();
      this.emit("updated");
    }
  }

  /**
   * The summed taxable cost from the nested line items.
   *
   * @type {number}
   */
  get taxableCost() {
    return this._data.taxable_cost;
  }

  /**
   * The average tax percentage from the nested line items.
   *
   * @type {number}
   */
  get taxPercent() {
    return this._data.tax_percent;
  }

  /**
   * @type {number}
   */
  set taxPercent(val) {
    if (Helpers.isNumber(val) && Helpers.confirmNumber(val) !== this._data.tax_percent) {
      this._applyComponentValue("taxPercent", this._data.tax_percent, val, false);
      this.dirty();
      this.emit("updated");
    }
  }

  /**
   * @type {number}
   */
  get tax() {
    return this._data.tax;
  }

  /**
   * @type {number}
   */
  set tax(val) {
    if (Helpers.isNumber(val) && Helpers.confirmNumber(val) !== this._data.tax_percent) {
      this._applyComponentValue("taxPercent", this._data.tax_percent, val, false);
      this.dirty();
      this.emit("updated");
    }
  }

  /**
   * Cost With Tax
   * @type {number}
   */
  get costWithTax() {
    return this.tax + this.cost;
  }

  /**
   * Cost With Markup
   * @type {number}
   */
  get costWithMarkup() {
    return this.markup + this.cost;
  }

  /**
   * @type {number}
   */
  get markup() {
    return this._data.markup;
  }

  /**
   * @type {number}
   */
  set markup(val) {
    LineItemGroupEntityHelper.applyMarkup(this, val);
  }

  /**
   * @type {number}
   */
  get markupPercent() {
    return this._data.markup_percent;
  }

  /**
   * @type {number}
   */
  set markupPercent(val) {
    LineItemGroupEntityHelper.applyMarkupPercent(this, val);
  }

  /**
   * @type {number}
   */
  get laborHours() {
    return this._data.labor_hours;
  }

  /**
   * @type {number}
   */
  set laborHours(val) {
    if (Helpers.isNumber(val) && Helpers.confirmNumber(val) !== this._data.labor_hours) {
      this._applyComponentValue("laborHours", this._data.labor_hours, val, false);
      this.dirty();
      this.emit("updated");
    }
  }

  /**
   * @type {number}
   */
  get laborCost() {
    return this._data.labor_cost;
  }

  /**
   * @type {number}
   */
  get nonLaborCost() {
    return this._data.non_labor_cost;
  }

  /**
   * Price Property
   * @type {number}
   */
  get price() {
    return this._data.price;
  }

  /**
   * @type {number}
   */
  set price(val) {
    LineItemGroupEntityHelper.applyPrice(this, val);
  }

  /**
   * Price per watt
   * @type {number}
   */
  get priceWatt() {
    if (this.bid.watts > 0) {
      return Helpers.confirmNumber(this.price / this.bid.watts);
    }
    return this.price;
  }

  /**
   * @type {number}
   */
  set priceWatt(val) {
    if (Helpers.isNumber(val) && this.priceWatt !== Helpers.confirmNumber(val)) {
      this.price = Helpers.confirmNumber(val * this.bid.watts);
    }
  }

  /**
   * Cost per watt
   * @type {number}
   */
  get costWatt() {
    if (this.bid.watts > 0) {
      return Helpers.confirmNumber(this.cost / this.bid.watts);
    }

    return this.cost;
  }

  /**
   * @type {number}
   */
  set costWatt(val) {
    if (Helpers.isNumber(val) && this.costWatt !== Helpers.confirmNumber(val)) {
      this.cost = Helpers.confirmNumber(val * this.bid.watts);
    }
  }

  /**
   * @type {object}
   */
  get config() {
    return this._data.config;
  }

  /**
   * @type {number}
   */
  get actualCost() {
    return this._data.actual_cost;
  }

  /**
   * @type {number}
   */
  set actualCost(val) {
    this._data.actual_cost = val;

    // Note: API should handle responsibility of setting confidence. Remove once when api is updated
    if (val === null || val === "" || val === undefined) {
      this._data.actual_cost_confidence_factor = null;
    } else {
      this._data.actual_cost_confidence_factor = 1;
    }

    this.dirty();
  }

  get actualCostConfidenceFactor() {
    return this._data.actual_cost_confidence_factor;
  }

  /**
   * @type {number}
   */
  get actualHours() {
    return this._data.actual_hours;
  }

  /**
   * @type {number}
   */
  set actualHours(val) {
    this._data.actual_hours = val;

    // Note: API should handle responsibility of setting confidence. Remove once when api is updated
    if (val === null || val === "" || val === undefined) {
      this._data.actual_hours_confidence_factor = null;
    } else {
      this._data.actual_hours_confidence_factor = 1;
    }

    this.dirty();
  }

  get actualHoursConfidenceFactor() {
    return this._data.actual_hours_confidence_factor;
  }

  /**
   * @type {number}
   */
  get baseAvg() {
    return this.getVirtualPropertyValue("base_avg");
  }

  /**
   * @type {number}
   */
  get wageAvg() {
    return this.getVirtualPropertyValue("wage_avg");
  }

  /**
   * @type {number}
   */
  get burdenAvg() {
    return this.getVirtualPropertyValue("burden_avg");
  }

  /**
   * @type {number}
   */
  get quantityAvg() {
    return this.getVirtualPropertyValue("quantity_avg");
  }

  /**
   * @type {number}
   */
  get perQuantityAvg() {
    return this.getVirtualPropertyValue("per_quantity_avg");
  }

  /**
   * Gets the component's group id.
   *
   * @type {number}
   */
  get componentGroupId() {
    return this.config.component_group_id;
  }

  /**
   * Gets the component's definition id.
   *
   * @type {number}
   * @deprecated Definition ids will become obsolete in planned data structure upgrade.
   */
  get definitionId() {
    return this._data.definition_id;
  }

  /**
   * Gets the included status of the component.
   * A component is included if it has included line items.
   *
   * @type {boolean}
   */
  get isIncluded() {
    return this.getVirtualPropertyValue("included_count") > 0;
  }

  /**
   * Applies a new value to the component and assesses if there is a change.
   *
   * @param {string} property
   * @param {number} value
   * @returns {boolean} Returns true if there is a change.
   */
  _apply(property, value) {
    const oldValue = round(this._data[property], 4);
    const newValue = round(Helpers.confirmNumber(value), 4);
    if (oldValue !== newValue) {
      this._data[property] = Helpers.confirmNumber(value);
      this.dirty();

      return true;
    }
    return false;
  }

  /**
   * Applies a new virtual property value to the component and returns true if there is a change.
   *
   * @param {string} property
   * @param {number} value
   * @returns {boolean}
   */
  _applyVirtualProperty(property, value) {
    // Must check if config.properties exists due to not existing in legacy bids.
    if (this._data.properties === undefined || this._data.properties === null) {
      this._data.properties = {};
    }

    if (this._data.properties[property] === undefined) {
      this._data.properties[property] = {
        value: 0,
        config: {
          data_type: "number",
        },
      };
    }

    const oldValue = round(this.getVirtualPropertyValue(property), 4);
    const newValue = round(Helpers.confirmNumber(value), 4);
    if (oldValue !== newValue) {
      this._data.properties[property].value = newValue;
      this.dirty();

      return true;
    }
    return false;
  }

  /**
   * Get the value for the key in the component's properties object
   *
   * @param {string} key
   * @return {number}
   */
  getVirtualPropertyValue(key) {
    const properties = this._data.properties;
    const hasProperty = properties && properties[key];
    return hasProperty ? Helpers.confirmNumber(properties[key].value) : 0;
  }

  /**
   * Applies any changes to a config flag set
   *
   * @param {string} configProp config property name
   * @param {string[]} newFlags flags to be set true
   * @return {boolean} If there was a change or not
   */
  _applyConfigFlags(configProp, newFlags) {
    if (!this.config[configProp] || xor(newFlags, this.config[configProp]).length > 0) {
      this.config[configProp] = [...newFlags];
      return true;
    }
    return false;
  }

  /**
   * Sets the override status for any props in the given array
   *
   * @param {string[]} newOverrideProps Overridden props from the assessment
   * @return {boolean} Whether or not the overrides have changed
   */
  _applyOverrides(newOverrideProps) {
    const currentOverrides = this.config.overrides
      ? Object.keys(this.config.overrides).filter(o => this.config.overrides[o] === true)
      : [];

    if (!this.config.overrides || xor(newOverrideProps, currentOverrides).length > 0) {
      this.config.overrides = {};
      newOverrideProps.forEach(prop => {
        this.config.overrides[prop] = true;
      });
      return true;
    }
    return false;
  }

  /**
   * Assess the component instance.
   *
   * @emits {assessing}
   * @emits {assessed}
   * @emits {updated}
   */
  assess() {
    if (this.bid.isAssessable()) {
      let isChanged = false;
      let cost = 0;
      let taxableCost = 0;
      let price = 0;
      let markup = 0;
      let tax = 0;
      let base = 0;
      let laborHours = 0;
      let totalLineItems = 0;
      let totalLaborLineItems = 0;
      let wage = 0;
      let wageDividend = 0;
      let burden = 0;
      let burdenDividend = 0;
      let quantity = 0;
      let perQuantity = 0;
      let laborCosts = 0;
      let nonLaborCosts = 0;
      let predictedValues = new Set();
      let hasNullDependencyValues = new Set();
      let overrides = new Set();

      each(this.getLineItems(), lineItem => {
        if (!lineItem) return true;

        if (!lineItem.isIncluded) {
          overrides = new Set([
            ...overrides,
            ...this._checkProperties(["is_included"], lineItem.isOverridden.bind(lineItem)),
          ]);
          return true;
        }

        totalLineItems += 1;
        const dependantValuesMap = []; // track line item values used in component

        if (lineItem.isLabor()) {
          totalLaborLineItems += 1;
          laborCosts += lineItem.cost;
          laborHours += lineItem.laborHours;
          if (this.bid.entities.variables().taxable_labor.value) {
            taxableCost += lineItem.cost;
          }

          dependantValuesMap.push(["cost", "labor_cost"], "labor_hours");
        } else {
          nonLaborCosts += lineItem.cost;
          taxableCost += lineItem.cost;

          dependantValuesMap.push(["cost", "non_labor_cost"], ["cost", "taxable_cost"]);
        }

        cost += lineItem.cost;
        price += lineItem.price;
        markup += lineItem.markup;
        if (this.bid.includeMarkupInTax()) {
          taxableCost += lineItem.markup;
        }
        tax += lineItem.tax;
        base += lineItem.base;
        wage += lineItem.wage;
        wageDividend += lineItem.laborHours * lineItem.wage;
        burden += lineItem.burden;
        burdenDividend += lineItem.laborHours * lineItem.burden;
        quantity += lineItem.quantity;
        perQuantity += lineItem.perQuantity;

        dependantValuesMap.push(
          "cost",
          "price",
          "markup",
          "markup_percent",
          "tax",
          "base",
          "wage",
          "burden",
          "quantity",
          "per_quantity"
        );

        predictedValues = new Set([
          ...predictedValues,
          ...this._checkProperties(dependantValuesMap, lineItem.isPredicted.bind(lineItem)),
        ]);
        hasNullDependencyValues = new Set([
          ...hasNullDependencyValues,
          ...this._checkProperties(dependantValuesMap, lineItem.hasNullDependency.bind(lineItem)),
        ]);
        overrides = new Set([
          ...overrides,
          ...this._checkProperties(
            [...dependantValuesMap, "is_included"],
            lineItem.isOverridden.bind(lineItem)
          ),
        ]);
      });

      each(this.getSubComponents(), subComponent => {
        subComponent.assess();
        cost += Helpers.confirmNumber(subComponent.cost);
        price += Helpers.confirmNumber(subComponent.price);
        markup += Helpers.confirmNumber(subComponent.markup);
        tax += Helpers.confirmNumber(subComponent.tax);
        taxableCost += Helpers.confirmNumber(subComponent.taxableCost);
        laborHours += Helpers.confirmNumber(subComponent.laborHours);
        laborCosts += Helpers.confirmNumber(subComponent.laborCost);
        nonLaborCosts += Helpers.confirmNumber(subComponent.nonLaborCost);
        base += Helpers.confirmNumber(subComponent.getVirtualPropertyValue("base"));
        wage += Helpers.confirmNumber(subComponent.getVirtualPropertyValue("wage"));
        wageDividend += Helpers.confirmNumber(subComponent.getVirtualPropertyValue("wage_dividend"));
        burden += Helpers.confirmNumber(subComponent.getVirtualPropertyValue("burden"));
        burdenDividend += Helpers.confirmNumber(subComponent.getVirtualPropertyValue("burden_dividend"));
        quantity += Helpers.confirmNumber(subComponent.getVirtualPropertyValue("quantity"));
        perQuantity += Helpers.confirmNumber(subComponent.getVirtualPropertyValue("per_quantity"));
        totalLineItems += Helpers.confirmNumber(subComponent.getVirtualPropertyValue("included_count"));
        totalLaborLineItems += Helpers.confirmNumber(
          subComponent.getVirtualPropertyValue("included_labor_count")
        );

        const valuesToCheck = [
          "cost",
          "price",
          "markup",
          "markup_percent",
          "tax",
          "taxable_cost",
          "labor_hours",
          "labor_cost",
          "non_labor_cost",
          "base",
          "wage",
          "burden",
          "quantity",
          "per_quantity",
        ];
        predictedValues = new Set([
          ...predictedValues,
          ...this._checkProperties(valuesToCheck, subComponent.isPredicted.bind(subComponent)),
        ]);
        hasNullDependencyValues = new Set([
          ...hasNullDependencyValues,
          ...this._checkProperties(valuesToCheck, subComponent.hasNullDependency.bind(subComponent)),
        ]);
        overrides = new Set([
          ...overrides,
          ...this._checkProperties(
            [...valuesToCheck, "is_included"],
            subComponent.isOverridden.bind(subComponent)
          ),
        ]);
      });

      let markupPercent = 0;
      if (this.bid.includeTaxInMarkup()) {
        const adjCost = cost + tax;
        markupPercent = adjCost > 0 ? (markup / adjCost) * 100 : 0;
      } else {
        markupPercent = cost > 0 ? (markup / cost) * 100 : 0;
      }

      const taxPercent = taxableCost > 0 ? (tax / taxableCost) * 100 : 0;
      const baseAvg = totalLineItems > 0 ? base / totalLineItems : 0;
      const wageQuotient = totalLaborLineItems > 0 ? wageDividend / laborHours : 0;
      const burdenQuotient = laborHours > 0 ? burdenDividend / laborHours : 0;
      const quantityAvg = totalLineItems > 0 ? quantity / totalLineItems : 0;
      const perQuantityAvg = totalLineItems > 0 ? perQuantity / totalLineItems : 0;

      isChanged = this._apply("cost", cost) || isChanged;
      isChanged = this._apply("price", price) || isChanged;
      isChanged = this._apply("taxable_cost", taxableCost) || isChanged;
      isChanged = this._apply("tax", tax) || isChanged;
      isChanged = this._apply("markup", markup) || isChanged;
      isChanged = this._apply("tax_percent", taxPercent) || isChanged;
      isChanged = this._apply("markup_percent", markupPercent) || isChanged;
      isChanged = this._apply("non_labor_cost", nonLaborCosts) || isChanged;
      isChanged = this._apply("labor_hours", laborHours) || isChanged;
      isChanged = this._apply("labor_cost", laborCosts) || isChanged;

      isChanged = this._applyConfigFlags("predicted_values", [...predictedValues.values()]) || isChanged;
      isChanged =
        this._applyConfigFlags("undefined_prop_flags", [...hasNullDependencyValues.values()]) || isChanged;
      isChanged = this._applyOverrides([...overrides.values()]) || isChanged;

      this._applyVirtualProperty("base", base);
      this._applyVirtualProperty("burden", burden);
      this._applyVirtualProperty("wage", wage);
      this._applyVirtualProperty("quantity", quantity);
      this._applyVirtualProperty("per_quantity", perQuantity);
      this._applyVirtualProperty("included_labor_count", totalLaborLineItems);
      isChanged = this._applyVirtualProperty("included_count", totalLineItems) || isChanged;
      this._applyVirtualProperty("base_avg", baseAvg);
      this._applyVirtualProperty("wage_avg", wageQuotient);
      this._applyVirtualProperty("wage_dividend", wageDividend);
      this._applyVirtualProperty("burden_avg", burdenQuotient);
      this._applyVirtualProperty("burden_dividend", burdenDividend);
      this._applyVirtualProperty("per_quantity_avg", perQuantityAvg);
      this._applyVirtualProperty("quantity_avg", quantityAvg);

      if (isChanged) this.emit("updated");

      this.emit("assessed");
    }
  }

  /**
   * Gets a list of bid entities that relies on the component instance.
   *
   * @returns {BidEntity[]}
   */
  dependants() {
    return this.bid.entities.getDependants("component", this.id);
  }

  /**
   * Removes a line item from the component.
   *
   * @param {string|number} lineItemId
   */
  removeLineItem(lineItemId) {
    // is this a numeric string?
    if (!Number.isNaN(+lineItemId)) {
      lineItemId = +lineItemId;
    }

    // remove the first instance of the Line Item
    const index = this.config.line_items.indexOf(lineItemId);
    if (index >= 0) {
      this.config.line_items.splice(index, 1);
      this.dirty();
      this.assess();
    }
  }

  /**
   * Binds the "updated" event for all dependant bid entities.
   */
  bind() {
    for (const lineItemId of this.config.line_items) {
      const lineItem = this.bid.entities.lineItems(lineItemId);
      if (lineItem) {
        lineItem.on("updated", `component.${this.id}`, requesterId => {
          waitForFinalEvent(() => this.assess(), 5, `bid.${this.id}.lineItem.${requesterId}`);
        });
      }
    }

    each(this.getSubComponents(), c => {
      c.onDelay("updated", 5, `component.${this.id}`, requesterId => {
        waitForFinalEvent(() => this.assess(), 5, `bid.${this.id}.${requesterId}`);
      });
    });
  }

  /**
   * Gets an array of nested of subcomponents.
   *
   * @return {Component[]}
   */
  getSubComponents() {
    const components = [];

    each(this.config.components, subComponentId => {
      components.push(this.bid.entities.components(subComponentId));
    });

    return components;
  }

  /**
   * Gets the component's parent component, if exists.
   *
   * @returns {?Component}
   */
  getParent() {
    if (this.config.is_nested) {
      return this.bid.entities.components(this.config.parent_component_id);
    }
    return null;
  }

  /**
   * Gets the level at which the component is nested: 0, 1, 2.
   *
   * @returns {number}
   */
  getNestedLevel() {
    const parent = this.getParent();
    if (parent) {
      return parent.config.is_nested ? 2 : 1;
    }
    return 0;
  }

  /**
   * Determines of component is a top parent component, in which is not nested.
   *
   * @returns {boolean}
   */
  isParent() {
    return !this.config.is_nested;
  }

  /**
   * Determine if any of the components children have been overridden
   *
   * @param {string} [property=null]
   * @return {boolean}
   */
  isOverridden(property = null) {
    if (!this.config.overrides) {
      this.config.overrides = {};
    }

    return property === null
      ? Object.values(this.config.overrides).some(o => o)
      : !!this.config.overrides[property];
  }

  /**
   * Gets an array of nested line items.
   *
   * @param  {boolean} [includeSubComponents=false]
   * @return {array} Returns an array of line items in component.
   */
  getLineItems(includeSubComponents = false) {
    let lines = [];

    for (const lineItemId of this.config.line_items) {
      const lineItem = this.bid.entities.getBidEntity("line_item", lineItemId);

      if (lineItem) lines.push(lineItem);
    }

    if (includeSubComponents) {
      for (const subComponentId of this.config.components) {
        const subComponent = this.bid.entities.components(subComponentId);
        lines = lines.concat(subComponent.getLineItems(includeSubComponents));
      }
    }

    return lines;
  }

  /**
   * Sets the include status for all nested line items.
   *
   * @param {boolean} isIncluded
   */
  setIncludeStatus(isIncluded) {
    if (this.bid.isAssessable()) {
      const lineItems = this.getLineItems(true);

      each(lineItems, lineItem => {
        lineItem.isIncluded = isIncluded;
      });
    }
  }

  /**
   * Check whether a given value is predicted or not
   *
   * @param {string} value The value to check the prediction status of
   * @return {boolean}
   */
  isPredicted(value) {
    const hasPredictions = !!(this.config.predicted_values && this.config.predicted_values.length);
    if (!value) return hasPredictions;
    return hasPredictions && this.config.predicted_values.indexOf(value) >= 0;
  }

  /**
   *  Returns a integer value indicating which distribution range a lineItem's cost falls
   * Returns 0,1,2,3,4,5,6 or (distributionRanges.length) the value being the percent range that the current cost falls under.
   * Returns -1 if the current cost is out of bounds and above (greater than) the predicted value.
   * Returns -2 if the current cost is out of bounds and below (less than) the predicted value.
   * Returns -3 if the lineItem does not have prediction models, or does not have models with 'standard_deviation' or if the lineItem's cost is currently being predicted.
   * @returns {number}
   * @private
   */
  getStoplightIndicator() {
    let weightedValues, currentWeightedValue, nextWeightedValue, stoplightRange, rawResult;
    if (this.getWeightedNormalValues()) {
      weightedValues = this.getWeightedNormalValues();
    } else {
      return -3;
    }
    /**
     *  Initiate the Stoplight Calculations
     *  For each weighted normal value, determine the stoplight range  based on the current and next weighted value
     */
    for (let nvi = 0, nvx = weightedValues.length; nvi < nvx; nvi++) {
      currentWeightedValue = weightedValues[nvi];
      nextWeightedValue = weightedValues[(nvi + 1) % weightedValues.length];
      rawResult = this.determineStoplightRange(nvi, currentWeightedValue, nextWeightedValue);
      if (rawResult !== null && rawResult !== undefined) {
        stoplightRange = rawResult;
      }
    }
    if (typeof stoplightRange === 'undefined') {
      // If the component's cost is greater than the predicted value
      // set the stoplight range to -1 (out of range on the upper bound)
      if (this.cost > this.getPredictedValue()) {
        stoplightRange = -1;
      }
      // If the component's cost is less than the predicted value
      // set the stoplight range to -2 (out of range on the lower bound)
      if (this.cost < this.getPredictedValue()) {
        stoplightRange = -2;
      }
    }

    return stoplightRange;
  }
  /**
   *  Determines the stoplight range to be used with the indicator.
   * @param currentIndex
   * @param currentWeightedValue
   * @param nextWeightedValue
   * @returns {int} The index that the result falls upon
   */
  determineStoplightRange(currentIndex, currentWeightedValue, nextWeightedValue) {
    // If the normal value falls in the ranges below or equal to 40%
    if (currentIndex < 4) {
      if ((this.cost < currentWeightedValue) && (this.cost >= nextWeightedValue)) {
        return currentIndex;
      }
    }
    // If the normal value falls in the ranges below or equal to 40%
    if (currentIndex >= 4) {
      if ((this.cost <= currentWeightedValue) && (this.cost > nextWeightedValue)) {
        return currentIndex;
      }
    }
  }

  /**
   *  Calculates the weighted normal value given a set of distribution ranges.
   * @returns {array} Array of weighted normal values
   */
  getWeightedNormalValues() {
    let distributionRanges = this.bid.entities.variables().distribution_ranges.value.map(x => {return x.value;});
    let values = [];
    for (let nvi = 0, nvx = distributionRanges.length; nvi < nvx; nvi++) {
      values.push(this.getWeightedNormalValue(nvi));
    }
    return values.every(e => e === null) ? null : values;
  }

  /**
   *  For each line item, get all of its weightedNormalValues
   *  return the sum of all line item's weightedNormalValues at distributionIndex
   * @returns {T|null} weighted normal value
   * @param distributionIndex
   */
  getWeightedNormalValue(distributionIndex) {
    let weightArray = [];
    let lineItem, weightedCost;
    let lineItems = this.getLineItems(true);
    for (let li = 0, lx = lineItems.length; li < lx; li++) {
      if (!lineItems[li].isPredicted() && lineItems[li].isIncluded && lineItems[li]._predictionService.hasPredictionModels()) {
        lineItem = lineItems[li];
        if (lineItem.isLabor()) {
          weightedCost = lineItem.getWeightedLaborHourCost();
          weightArray.push(weightedCost !== null ? weightedCost : null);
        } else {
          weightedCost = (lineItem.getPredictedValue() === 0 || typeof lineItem.getPredictedValue() === 'undefined') ?
            Array.from({length:this.bid.entities.variables()
              .distribution_ranges.value.length}).map(x => lineItem.getValue())
            : lineItem.getWeightedNormalValues();
          weightArray.push(weightedCost !== null ? weightedCost : null);
        }
      }
    }
    return (weightArray.length > 0 && !weightArray.every(e => e === null)) ?
      weightArray.map(x => x[distributionIndex]).reduce((z, y) => z + y)
      : null;
  }

  /**
   * Gets the predicted value of the component by calculating the sum total of the predicted values for all line items
   * @returns {sum|null}
   */
  getPredictedValue() {
    let predictedValues = [];
    let lineItems = this.getLineItems(true);
    for (let li = 0, lx = lineItems.length; li < lx; li++) {
      if (!lineItems[li].isPredicted() && lineItems[li].isIncluded) {
        let item = lineItems[li];
        let predictedValue = item.getPredictedValue();
        predictedValues.push(predictedValue)
      }
    }
    return predictedValues.length > 0 ? predictedValues.reduce((z, y) => z + y) : null;
  }

  /**
   * Checks if a component property relied on a null dependency at any point in calculation
   *
   * @param {string} value The property to check
   * @return {boolean}
   */
  hasNullDependency(value) {
    const hasUndefinedProps = !!(this.config.undefined_prop_flags && this.config.undefined_prop_flags.length);
    if (!value) return hasUndefinedProps;
    return hasUndefinedProps && this.config.undefined_prop_flags.indexOf(value) >= 0;
  }

  /**
   * Resets all nested line items.
   */
  reset() {
    if (this.bid.isAssessable()) {
      const lineItems = this.getLineItems(true);

      each(lineItems, lineItem => {
        lineItem.reset();
      });
    }
  }

  /**
   * Applies the component value change to the nested line items.
   *
   * @param {string} property
   * @param {number} oldValue
   * @param {number} newValue
   * @param {boolean} overrideAllLineItems
   */
  _applyComponentValue(property, oldValue, newValue, overrideAllLineItems) {
    newValue = Helpers.confirmNumber(newValue);

    let lineItems = this.getLineItems(true);
    const includedLineItemsOnly = lineItems.filter(li => li.isIncluded);

    lineItems =
      includedLineItemsOnly.length === 0 || overrideAllLineItems ? lineItems : includedLineItemsOnly;

    for (let i = 0; i < lineItems.length; i += 1) {
      if (["markupPercent", "taxPercent"].indexOf(property) >= 0 && parseFloat(oldValue) === 0) {
        lineItems[i][property] = newValue;
      } else if (Helpers.confirmNumber(oldValue) !== 0) {
        const ratio = newValue / Helpers.confirmNumber(oldValue);
        lineItems[i][property] = Helpers.confirmNumber(parseFloat(lineItems[i][property]) * ratio);
      } else {
        lineItems[i][property] = newValue / lineItems.length;
      }
    }
  }

  /**
   * Exports component internal data structure.
   *
   * @param {boolean} [alwaysIncludeConfig=false] Will include config object in export regardless of changed status.
   * @return {object}
   */
  exportData(alwaysIncludeConfig = false) {
    const data = cloneDeep(this._data);
    if (!alwaysIncludeConfig && isEqual(data.config, this._original.config)) delete data.config;

    return data;
  }

  /**
   * Flags the component and corresponding bid as dirty and to be saved.
   */
  dirty() {
    this.bid.dirty();
    super.dirty();
  }
}
