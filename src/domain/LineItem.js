import isBoolean from "lodash/isBoolean";
import each from "lodash/each";
import round from "lodash/round";
import isUndefined from "lodash/isUndefined";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";
import xor from "lodash/xor";
import pickBy from "lodash/pickBy";
import cloneDeep from "lodash/cloneDeep";
import pull from "lodash/pull";
import omit from "lodash/omit";
import BidEntity from "./BidEntity";
import Helpers from "../utils/Helpers";
import PredictionService from "./services/PredictionService";
import LineItemRuleService from "./services/LineItemRuleService";
import {setAssembly, getAssembly} from "./services/BidEntityAssemblyService";
import WorkupService from "./services/WorkupService";
import Workup from "./Workup";
import jStat from "jstat";

/**
 * Represents line item data.
 */
export default class LineItem extends BidEntity {
  /**
   * Creates an instance of LineItem.
   * @param {object} entityData
   * @param {Bid} bid
   */
  constructor(entityData, bid) {
    super();
    /**
     * Reference to the bid that the line item belongs to.
     * @type {Bid}
     */
    this.bid = bid;
    this.maxEvents = 25;
    this._originalConfig = JSON.stringify(entityData.config);
    this._hasConfigEverChanged = false;
    this._data = entityData;
    this._ruleService = new LineItemRuleService(this);
    this.onDelay("property.updated", 5, "self", () => this.assess(this, true));
    this._predictionService = new PredictionService(this);
    this._cacheValues = {};
  }

  /**
   * Base Property
   * @type {number}
   */
  get base() {
    return Helpers.confirmNumber(this._data.base);
  }

  /**
   * @type {number}
   */
  set base(val) {
    if (Helpers.isNumber(val)) {
      this._data.base = Helpers.confirmNumber(val);
      this.override("base", true);
      this.override("cost", false);
      this.override("cost_watt", false);
      this.override("price", false);
      this.override("price_watt", false);
      this.override("markup", false);
      this.override("multiplier", false);
      this.multiplier = 1;
      this.isIncluded = true;
      this.dirty();
      this.emit("property.updated");
    }
  }

  /**
   * Wage Property
   * @type {number}
   */
  get wage() {
    return Helpers.confirmNumber(this._data.wage);
  }

  /**
   * @type {number}
   */
  set wage(val) {
    if (Helpers.isNumber(val)) {
      this._data.wage = Helpers.confirmNumber(val);
      this.override("wage", true);
      this.isIncluded = true;
      this.dirty();
      this.emit("property.updated");
    }
  }

  /**
   * Is Included Property
   * @type {boolean}
   */
  get isIncluded() {
    return this._data.is_included;
  }

  /**
   * @type {boolean}
   */
  set isIncluded(val) {
    if (isBoolean(val) && this._data.is_included != val) {
      this._data.is_included = val;
      this.override("is_included", true);
      this.dirty();
      this.emit("property.updated");
    }
  }

  /**
   * Is Weighted Property - determines whether or not the contribution weight should be applied to the cost
   * @type {boolean}
   */
  get isWeighted() {
    if (!this.isPredicted("cost")) {
      return false;
    }
    return this.config.is_weighted;
  }

  /**
   * @type {boolean}
   */
  set isWeighted(val) {
    if (isBoolean(val) && this._data.config.is_weighted != val) {
      this._data.config.is_weighted = val;
      this.override("is_weighted", true);
      this.dirty();
      this.emit("property.updated");
    }
  }

  /**
   * Labor Hours Property
   * @type {number}
   */
  get laborHours() {
    return Helpers.confirmNumber(this._data.labor_hours);
  }

  /**
   * @type {number}
   */
  set laborHours(val) {
    if (Helpers.isNumber(val) && this._data.labor_hours != Helpers.confirmNumber(val) && this.isLabor()) {
      this._data.labor_hours = Helpers.confirmNumber(val);
      this.override("labor_hours", true);
      this.override("cost", false);
      this.override("cost_watt", false);
      this.override("multiplier", false);

      if (this.subtotal > 0) {
        this._data.multiplier = this._data.labor_hours / this.subtotal;
        this.override("multiplier", true);
      } else {
        this._data.multiplier = 1;
        this.override("multiplier", false);
      }
      this.isIncluded = true;
      this.dirty();
      this.emit("property.updated");
    }
  }

  /**
   * Burden Property
   * @type {number}
   */
  get burden() {
    return Helpers.confirmNumber(this._data.burden);
  }

  /**
   * @type {number}
   */
  set burden(val) {
    if (Helpers.isNumber(val) && this._data.burden != Helpers.confirmNumber(val)) {
      this._data.burden = Helpers.confirmNumber(val);
      this.override("burden", true);
      this.isIncluded = true;
      this.dirty();
      this.emit("property.updated");
    }
  }

  /**
   * @type {number}
   */
  get workup() {
    if (
      this.config.workups[0] &&
      this.config.workups[0].value !== undefined &&
      this.config.workups[0].value !== null
    ) {
      return Helpers.confirmNumber(this.config.workups[0].value);
    }
    return null;
  }

  /**
   * Scalar Property
   * @type {number}
   */
  get scalar() {
    let valueMap = {};
    const formulaArgs = Helpers.parseFormulaArguments(this.config.formula);
    const scalarContracts = this._getExtraScalarDependencies();
    each(scalarContracts, (dependencyContract, key) => {
      // check if dependency is included in formula
      const formulaUsesDependency = formulaArgs.indexOf(key.charAt(7)) >= 0;
      if (formulaUsesDependency) {
        const val = this._evaluateDependency(dependencyContract, "scalar");
        valueMap[key.charAt(7)] = Helpers.confirmNumber(val, 0);
      }
    });

    if (formulaArgs.indexOf("x") >= 0) {
      const val = this._evaluateDependency(this.config.dependencies.scalar, "scalar");
      valueMap.x = Helpers.confirmNumber(val, 1);
    }
    if (formulaArgs.indexOf("workup") >= 0) {
      if (this._getWorkup() && WorkupService.hasNullDependency(this._getWorkup(), this.bid)) {
        this._undefinedPropFlags.push("scalar");
      }
      valueMap.workup = Helpers.confirmNumber(this.workup, 0);
    }
    const results = Helpers.calculateFormula(this.config.formula, valueMap);
    return Helpers.confirmNumber(results, 1);
  }

  /**
   * Per Quantity Property
   * @type {number}
   * @deprecated Please use Scalar instead.
   */
  get perQuantity() {
    return Helpers.confirmNumber(this._data.per_quantity);
  }

  /**
   * @type {number}
   * @deprecated Please use Scalar instead.
   */
  set perQuantity(val) {
    if (Helpers.isNumber(val) && this._data.per_quantity != Helpers.confirmNumber(val)) {
      this._data.per_quantity = Helpers.confirmNumber(val);
      this.override("per_quantity", true);
      this.override("cost", false);
      this.override("cost_watt", false);
      this.override("price", false);
      this.override("price_watt", false);
      this.override("markup", false);

      this.override("multiplier", false);
      this.multiplier = 1;
      this.isIncluded = true;
      this.dirty();
      this.emit("property.updated");
    }
  }

  /**
   * Escalator Property
   * @type {number}
   */
  get escalator() {
    return Helpers.confirmNumber(this._data.escalator, 1);
  }

  /**
   * @type {number}
   */
  set escalator(val) {
    if (Helpers.isNumber(val) && this._data.escalator != Helpers.confirmNumber(val)) {
      this._data.escalator = Helpers.confirmNumber(val);
      this.override("cost", false);
      this.override("cost_watt", false);
      this.override("price", false);
      this.override("price_watt", false);
      this.override("escalator", true);
      this.isIncluded = true;
      this.dirty();
      this.emit("property.updated");
    }
  }

  /**
   * Quantity Property
   * @type {number}
   */
  get quantity() {
    return Helpers.confirmNumber(this._data.quantity);
  }

  /**
   * @type {number}
   */
  set quantity(val) {
    if (Helpers.isNumber(val) && this._data.quantity != Helpers.confirmNumber(val)) {
      this._data.quantity = Helpers.confirmNumber(val);
      this.override("quantity", true);
      this.override("cost", false);
      this.override("cost_watt", false);
      this.override("price", false);
      this.override("price_watt", false);
      this.override("markup", false);

      this.override("multiplier", false);
      this.multiplier = 1;
      this.isIncluded = true;
      this.dirty();
      this.emit("property.updated");
    }
  }

  /**
   * @type {number}
   */
  get multiplier() {
    return this._data.multiplier;
  }

  /**
   * @type {number}
   */
  set multiplier(val) {
    if (Helpers.isNumber(val) && this._data.multiplier != Helpers.confirmNumber(val)) {
      this._data.multiplier = Helpers.confirmNumber(val);
      this.override("multiplier", true);
      this.override("cost", false);
      this.override("cost_watt", false);
      this.override("price", false);
      this.override("price_watt", false);
      this.override("labor_hours", false);
      this.isIncluded = true;
      this.dirty();
      this.emit("property.updated");
    }
  }

  /**
   * Cost Property
   * @type {number}
   */
  get cost() {
    return Helpers.confirmNumber(this._data.cost);
  }

  /**
   * @type {number}
   */
  set cost(val) {
    if (Helpers.isNumber(val) && this._data.cost != Helpers.confirmNumber(val)) {
      this._data.cost = Helpers.confirmNumber(val);
      this._data.escalator = 1;
      this._data.ohp = 1;

      this.override("cost", true);
      this.override("cost_watt", false);
      this.override("escalator", true);
      this.override("ohp", true);
      this.override("price", false);
      this.override("price_watt", false);

      this.isIncluded = true;
      this.dirty();
      this._applyCostChange();
      this.emit("property.updated");
    }
  }

  /**
   * Tax Property
   * @type {number}
   */
  get tax() {
    return Helpers.confirmNumber(this._data.tax);
  }

  /**
   * @type {number}
   */
  set tax(val) {
    if (!Helpers.isNumber(val) || this._data.tax === Helpers.confirmNumber(val)) return;
    this._data.tax = Helpers.confirmNumber(val);
    this.override("tax", true);
    this.override("tax_percent", true);
    this.override("price", false);
    this.override("price_watt", false);
    this.isIncluded = true;
    this.dirty();

    const taxableSubtotal = this._getTaxableSubtotal();
    this._data.tax_percent =
      taxableSubtotal > 0 ? Helpers.confirmNumber(this.tax / taxableSubtotal) * 100 : 0;

    if (this.bid.includeTaxInMarkup()) {
      this.markup = Helpers.confirmNumber(this.cost + this.tax) * (this.markupPercent / 100);
    } else this.assess();
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
   * OH&P Property (overhead and profit)
   * @type {number}
   */
  get ohp() {
    return Helpers.confirmNumber(this._data.ohp, 1);
  }

  /**
   * @type {number}
   */
  set ohp(val) {
    if (Helpers.isNumber(val) && this._data.ohp != Helpers.confirmNumber(val)) {
      this._data.ohp = Helpers.confirmNumber(val);
      this.override("cost", false);
      this.override("cost_watt", false);
      this.override("price", false);
      this.override("price_watt", false);
      this.override("ohp", true);
      this.isIncluded = true;
      this.dirty();
      this.emit("property.updated");
    }
  }

  /**
   * Tax Percent Property
   * @type {number}
   */
  get taxPercent() {
    return Helpers.confirmNumber(this._data.tax_percent);
  }

  /**
   * @type {number}
   */
  set taxPercent(val) {
    if (Helpers.isNumber(val) && this._data.tax_percent != Helpers.confirmNumber(val)) {
      this._data.tax_percent = Helpers.confirmNumber(val);
      this.override("tax_percent", true);
      this.override("price", false);
      this.override("price_watt", false);

      this._applyTaxPercentChange();
      this.isIncluded = true;
      this.dirty();
      this.emit("property.updated");
    }
  }

  /**
   * Markup Property
   * @type {number}
   */
  get markup() {
    return this._data.markup;
  }

  /**
   * @type {number}
   */
  set markup(val) {
    if (Helpers.isNumber(val) && this._data.markup != Helpers.confirmNumber(val)) {
      this._data.markup = round(Helpers.confirmNumber(val), 4);
      //this.override("markup", true);
      this.override("price", false);
      this.override("price_watt", false);
      this._applyMarkupChange();
      this.isIncluded = true;
      this.dirty();
      this.emit("property.updated");
    }
  }

  /**
   * Markup Percent Property
   * @type {number}
   */
  get markupPercent() {
    return round(Helpers.confirmNumber(this._data.markup_percent), 4);
  }

  /**
   * @type {number}
   */
  set markupPercent(val) {
    if (Helpers.isNumber(val) && this._data.markup_percent != Helpers.confirmNumber(val)) {
      this._data.markup_percent = round(Helpers.confirmNumber(val), 4);
      this.override("markup_percent", true);
      this.override("price", false);
      this.override("price_watt", false);
      this._applyMarkupPercent();
      this.isIncluded = true;
      this.dirty();
      this.emit("property.updated");
    }
  }

  /**
   * Price Property
   * @type {number}
   */
  get price() {
    return round(Helpers.confirmNumber(this._data.price), 4);
  }

  /**
   * @type {number}
   */
  set price(val) {
    if (Helpers.isNumber(val) && this._data.price != Helpers.confirmNumber(val)) {
      this._data.price = Helpers.confirmNumber(val);
      this._applyPriceChange();
      this.isIncluded = true;
      this.dirty();
      this.override("price", true);
      this.override("price_watt", false);
      this.emit("property.updated");
    }
  }

  /**
   * Price per watt
   * @type {number}
   */
  get priceWatt() {
    if (this.bid.watts > 0) {
      return Helpers.confirmNumber(this.price / this.bid.watts);
    } else {
      return this.price;
    }
  }

  /**
   * @type {number}
   */
  set priceWatt(val) {
    if (Helpers.isNumber(val) && this.priceWatt !== Helpers.confirmNumber(val)) {
      this.price = Helpers.confirmNumber(val * this.bid.watts);
      this.override("price_watt", true);
    }
  }

  /**
   * Cost per watt
   * @type {number}
   */
  get costWatt() {
    if (this.bid.watts > 0) {
      return Helpers.confirmNumber(this.cost / this.bid.watts);
    } else {
      return this.cost;
    }
  }

  /**
   * @type {number}
   */
  set costWatt(val) {
    if (Helpers.isNumber(val) && this.costWatt !== Helpers.confirmNumber(val)) {
      this.cost = Helpers.confirmNumber(val * this.bid.watts);
      this.override("cost_watt", true);
    }
  }

  /**
   * Gets the line item's definition id.
   *
   * @type {number}
   * @deprecated Definition ids will become obsolete in planned data structure upgrade.
   */
  get definitionId() {
    return this._data.definition_id;
  }

  /**
   * Gets the line items tags array
   *
   * @type {Array<string|number|boolean>}
   */
  get tags() {
    return this._data.config.tags || [];
  }

  /**
   * Config Property
   * @type {object}
   */
  get config() {
    return this._data.config;
  }

  /**
   * Gets Subtotal aka Initial Results.
   *
   * @return {number}
   */
  get subtotal() {
    return Helpers.confirmNumber(
      parseFloat(this.quantity) * parseFloat(this.perQuantity) + parseFloat(this.base)
    );
  }

  /**
   * When using predictive pricing, should the computed value be used if it's available?
   * @type {boolean}
   */
  get useComputedValueWhenAvailable() {
    if (this._data.config.hasOwnProperty("use_computed_when_available")) {
      return this._data.config.use_computed_when_available;
    }
    return this.bid.entities.variables().use_computed.value;
  }

  /**
   * Overrides the bid variable for the line item
   * @type {boolean}
   */
  set useComputedValueWhenAvailable(val) {
    if (isBoolean(val)) {
      if (this._data.config.use_computed_when_available !== val) {
        this._data.config.use_computed_when_available = val;
        this.assess();
      }
    }
  }

  /**
   *
   * @param {string} property
   * @param {(number|string|boolean)} value
   */
  override(property, value) {
    if (!this.bid.isReadOnly()) {
      if (isUndefined(this._data.config.overrides)) {
        this._data.config.overrides = {};
      }

      // If initially empty, the .config can be interpreted as an array.
      // This line converts the array to an object.
      if (Array.isArray(this._data.config.overrides)) {
        this._data.config.overrides = this._data.config.overrides.reduce(
          (o, k) => Object.assign(o, {[k]: true}),
          {}
        );
      }
      this._data.config.overrides[property] = value;
    }
  }

  /**
   * Determine if the line item or one of its properties is overridden
   *
   * @param {string} [property=null]
   * @returns {boolean}
   */
  isOverridden(property = null) {
    if (this._data.config.overrides === undefined) return false;

    return property === null
      ? Object.values(this._data.config.overrides).some(value => value)
      : this._data.config.overrides[property] === true;
  }

  /**
   * Determines if the line item or a property is predicted by recursively checking the
   *  properties calculation dependencies prediction status.
   *
   * @param {string} [property] snake case property name
   * @returns {boolean}
   */
  isPredicted(property) {
    const calcDependencyMap = {
      cost: ["labor_hours"],
      tax: this.isLabor() ? [] : ["cost"],
      markup: this.bid.includeTaxInMarkup() ? ["cost", "tax"] : ["cost"],
      price: ["cost", "tax", "markup"],
      cost_watt: ["cost"],
      price_watt: ["price"],
      cost_with_tax: ["cost", "tax"],
    };
    if (!property) {
      return [...Object.keys(calcDependencyMap), "labor_hours"]
        .map(prop => this.isPredicted(prop))
        .some(val => val);
    }
    if (this.isOverridden(property)) {
      return false;
    }
    if (property === "labor_hours") {
      return this._data.config.is_predicted_labor_hours || false;
    }
    if (property === "cost") {
      return this._data.config.is_predicted_cost || this._data.config.is_predicted_labor_hours || false;
    }
    if (!calcDependencyMap[property] || calcDependencyMap[property].length === 0) {
      return false;
    }
    return calcDependencyMap[property].map(prop => this.isPredicted(prop)).some(val => val);
  }

  /**
   * Resets a specific line item member, remove override value.
   *
   * @param {string} property
   */
  resetProperty(property) {
    if (
      this.bid.isAssessable() &&
      !isUndefined(this._data.config.overrides) &&
      !isUndefined(this._data.config.overrides[property])
    ) {
      delete this._data.config.overrides[property];
      this.dirty();
      this.emit("property.updated", property);
    }
  }

  /**
   * Resets the markup, removing user override inputs for markup and markup percent.
   */
  resetMarkup() {
    if (this.bid.isAssessable()) {
      this.resetProperty("markup");
      this.resetProperty("markup_percent");
      this.resetProperty("price");
    }
  }

  /**
   * Resets the line item, removing all user override inputs.
   */
  reset() {
    if (this.bid.isAssessable()) {
      this.config.overrides = {};
      this._data.multiplier = 1;
      delete this.config.use_computed_when_available;
      this.assess(this, true);
    }
  }

  /**
   * Determines if the line item represents labor costs.
   *
   * @returns {boolean}
   */
  isLabor() {
    return this._data.config.type === "labor";
  }

  /**
   * Bind a field dependency to the workup
   *
   * @param {Field} [field=null] The field entity to bind to the workup. Must be a 'list' type field.
   */
  setWorkupField(field = null) {
    if (field && (field.type !== "field" || field.fieldType !== "list")) {
      throw new Error('Workup field must be a "list" type field');
    }

    const workup = this.getWorkup();
    const currentField = workup.getField();

    workup.field_id = field ? field.id : null;

    if (currentField && field !== currentField) {
      currentField.removeListenerByRequester("updated", `line_item.${this.id}`);
    }

    this.config.workups[0] = workup.getWorkup();
    this._bindWorkupDependencies();
    this.dirty();
    this.assess();
  }

  /**
   * Assess line item for changes.
   *
   * @emits {assessing} fires event before assessement.
   * @emits {assessed}
   * @emits {updated}
   * @param {?BidEntity} [dependency] The calling dependency
   * @param {?boolean} [forceUpdate]
   */
  assess(dependency, forceUpdate) {
    if (this.bid.isAssessable()) {
      this.bid.emit("assessing");
      let isChanged = false;
      this._resetUndefinedPropFlags();
      this._invalidateCachedValues();

      isChanged = this._applyProperty("base", this._getBaseValue()) || isChanged;
      isChanged = this._applyProperty("burden", this._getBurdenValue()) || isChanged;
      isChanged = this._applyProperty("wage", this._getWageValue()) || isChanged;
      isChanged = this._applyProperty("quantity", this._getQuantityValue()) || isChanged;
      isChanged = this._applyProperty("per_quantity", this._getPerQuantityValue()) || isChanged;
      isChanged = this._applyProperty("ohp", this._getOhpValue()) || isChanged;
      isChanged = this._applyProperty("escalator", this._getEscalatorValue()) || isChanged;
      isChanged = this._applyProperty("labor_hours", this._getLaborHoursValue()) || isChanged;
      isChanged = this._applyConfig("is_weighted", this._getIsWeightedValue()) || isChanged;
      isChanged = this._applyProperty("cost", this._getCostValue()) || isChanged;

      if (!this.bid.includeMarkupInTax()) {
        isChanged = this._applyProperty("tax_percent", this._getTaxPercentValue()) || isChanged;
        isChanged = this._applyProperty("tax", this._getTaxValue()) || isChanged;
      }

      isChanged = this._applyProperty("markup_percent", this._getMarkupPercentValue()) || isChanged;
      isChanged = this._applyProperty("markup", this._getMarkupValue()) || isChanged;

      if (this.bid.includeMarkupInTax()) {
        isChanged = this._applyProperty("tax_percent", this._getTaxPercentValue()) || isChanged;
        isChanged = this._applyProperty("tax", this._getTaxValue()) || isChanged;
      }

      isChanged = this._applyProperty("price", this._getPriceValue()) || isChanged;
      isChanged = this._applyProperty("is_included", this._getIsIncludedValue()) || isChanged;
      isChanged = this._applyConfigArray("tags", this._getTagValue()) || isChanged;

      if (this._applyUndefinedPropFlags()) {
        isChanged = true;
      }

      if (isChanged || forceUpdate) {
        this.dirty();
        this.emit("updated");
      }

      this.emit("assessed");
    }
  }

  /**
   * Determines if the line item is has changed for it's original data.
   *
   * @returns {boolean}
   */
  isDirty() {
    return this._is_dirty || JSON.stringify(this._data.config) !== this._originalConfig;
  }

  /**
   * Flags the line item and corresponding bid as dirty and to be saved.
   */
  dirty() {
    const currentConfigJson = JSON.stringify(this._data.config);
    if (currentConfigJson !== this._originalConfig) {
      this._originalConfig = currentConfigJson;
      this._hasConfigEverChanged = true;
    }
    this.bid.dirty();
    super.dirty();
  }

  /**
   * Binds the "updated" event for all dependant bid entities.
   */
  bind() {
    this._bindLineItemDependencies();
    this._bindLineItemRuleDependencies();
    this._bindWorkupDependencies();
    this._bindLineItemPredictionDependencies();
    this._bindPredictionBidVariables();
    this._bindMarkupStrategy();
    this._bindTaxableLabor();
    this._bindTaxProfit();
  }

  getWorkup() {
    return new Workup(this.bid, this._getWorkup());
  }

  _getWorkup() {
    return !this.config.workups || isEmpty(this.config.workups[0]) ? null : this.config.workups[0];
  }

  /**
   * Gets a list of bid entities that the line item instance relies on.
   *
   * @returns {BidEntity[]}
   */
  dependencies() {
    const dependencies = [];
    const contracts = Object.values(this.config.dependencies);

    Object.values(this.config.rules).forEach(rule => {
      if (rule.dependencies) {
        contracts.push(...Object.values(rule.dependencies));
      }
    });

    contracts.forEach(contract => {
      const dependency = this.bid.entities.getDependency(contract);
      if (dependency) {
        dependencies.push(dependency);
      }
    });

    if (this._getWorkup()) {
      const workupField = WorkupService.getDependency(this._getWorkup(), this.bid);
      if (workupField) dependencies.push(workupField);
    }

    return dependencies;
  }

  /**
   * Gets dependant bid entities that rely on line item instance.
   *
   * @returns {BidEntity[]}
   */
  dependants() {
    return this.bid.entities.getDependants("line_item", this.id);
  }

  _bindLineItemDependencies() {
    for (let dependencyContract of Object.values(this.config.dependencies)) {
      if (!isEmpty(dependencyContract)) {
        let dependency = this.bid.entities.getDependency(dependencyContract);
        if (dependency) {
          dependency.on("updated", `line_item.${this.id}`, (requesterId, self) => this.assess(self));
        }
      }
    }
  }

  _bindLineItemRuleDependencies() {
    for (let rule of Object.values(this.config.rules)) {
      if (rule.dependencies) {
        for (let dependencyContract of Object.values(rule.dependencies)) {
          if (!isEmpty(dependencyContract)) {
            let dependency = this.bid.entities.getDependency(dependencyContract);
            if (dependency) {
              dependency.on("updated", `line_item.${this.id}`, (requesterId, self) => this.assess(self));
            }
          }
        }
      }
    }
  }

  _bindWorkupDependencies() {
    const workup = this._getWorkup();
    const dependency = workup ? WorkupService.getDependency(workup, this.bid) : null;
    if (dependency) {
      dependency.on("updated", `line_item.${this.id}`, () => this.assessWorkup());
    }
  }

  /**
   * Bind the dependencies of the prediction models
   */
  _bindLineItemPredictionDependencies() {
    if (!this._predictionService.hasPredictionModels()) {
      return false;
    }

    const dependencies = this._predictionService.getPredictionDependencies();
    for (let dependency of dependencies) {
      dependency.on("updated", `line_item.${this.id}`, (requesterId, self) => this.assess(self));
    }
  }

  /**
   * Predictive pricing bid variable need to be explicitely bound to the line items since they are not
   * included in the entity's dependencies.
   */
  _bindPredictionBidVariables() {
    if (!isNil(this.bid.entities.variables().predictive_pricing)) {
      this.bid.entities
        .variables()
        .predictive_pricing.on("updated", `line_item.${this.id}`, (requesterId, self) => this.assess(self));
    }

    if (
      !isNil(this.bid.entities.variables().use_computed) &&
      isNil(this._data.config.use_computed_when_available)
    ) {
      this.bid.entities
        .variables()
        .use_computed.on("updated", `line_item.${this.id}`, (requesterId, self) => this.assess(self));
    }
  }

  /**
   * Bind to markup strategy variable
   */
  _bindMarkupStrategy() {
    const variable = this.bid.entities.variables().markup_strategy;
    if (!isNil(variable)) {
      variable.on("updated", `line_item.${this.id}`, (requesterId, self) => this.assess(self));
    }
  }

  /**
   * Bind to taxable labor variable
   */
  _bindTaxableLabor() {
    const variable = this.bid.entities.variables().taxable_labor;
    if (!isNil(variable)) {
      variable.on("updated", `line_item.${this.id}`, (requesterId, self) => {
        if (this.isLabor()) this.assess(self);
      });
    }
  }

  _bindTaxProfit() {
    const variable = this.bid.entities.variables().taxable_profit;
    if (!isNil(variable)) {
      variable.on("updated", `line_item.${this.id}`, (requesterId, self) => this.assess(self));
    }
  }

  assessWorkup() {
    const workup = this._getWorkup();
    if (workup) {
      const value = WorkupService.evaluateWorkup(workup, this.bid);
      if (workup.value !== value) {
        workup.value = value;
        this.dirty();
      }
      this.assess();
    }
  }

  /**
   *
   */
  _applyProperty(property, value) {
    let oldValue = !isBoolean(value) ? round(this._data[property], 4) : this._data[property];
    let newValue = !isBoolean(value) ? round(value, 4) : value;

    if (oldValue != newValue) {
      this._data[property] = isBoolean(value) ? value : round(value, 6);
      return true;
    } else return false;
  }

  /**
   * Checks to see if the supplied array is different than the currently assigned value
   * If so, it updates the value
   *
   * @return {boolean} whether the value was updated or not
   */
  _applyConfigArray(property, arr) {
    if (isNil(this._data.config[property]) || xor(arr, this._data.config[property]).length > 0) {
      this._data.config[property] = arr;
      return true;
    } else return false;
  }

  /**
   *
   */
  _applyConfig(property, value) {
    let oldValue = !isBoolean(value) ? round(this._data.config[property], 4) : this._data.config[property];
    let newValue = !isBoolean(value) ? round(value, 4) : value;

    if (oldValue !== newValue) {
      this._data.config[property] = isBoolean(value) ? value : round(value, 6);
      return true;
    } else return false;
  }

  /**
   *
   */
  _applyMarkupChange() {
    this.override("markup_percent", true);

    if (this.bid.includeTaxInMarkup()) {
      this._data.markup_percent = round(Helpers.confirmNumber(this.markup / (this.cost + this.tax)) * 100, 4);
    } else {
      this._data.markup_percent = round(Helpers.confirmNumber(this.markup / this.cost) * 100, 4);
    }
  }

  /**
   *
   */
  _reverseComputeLaborHours(cost, wage, burden) {
    let wageBurden = parseFloat(wage) + parseFloat(burden);
    return Helpers.confirmNumber(parseFloat(cost) / wageBurden);
  }

  /**
   * Internal method to calculate a Unit price change.
   *
   */
  _applyPriceChange() {
    if (this.cost === 0) {
      const taxMarkupRate = (this.taxPercent + this.markupPercent) / 100;
      const newCost = Helpers.confirmNumber(this.price / (1 + taxMarkupRate));

      this.base = this.isLabor() ? this._reverseComputeLaborHours(newCost, this.wage, this.burden) : newCost;
    } else {
      const markupChange = this.price - (this.cost + this.tax + this.markup);
      this.markup = Helpers.confirmNumber(this._data.markup + markupChange);
    }
  }

  /**
   * Internal method that recalculates a line item cost change.
   *
   */
  _applyCostChange() {
    if (this.subtotal > 0) {
      this.override("multiplier", true);
      if (this.isLabor()) {
        this.override("labor_hours", false);
        this._data.multiplier = this.cost / (this.subtotal * (this.wage + this.burden));
      } else {
        this._data.multiplier = this.cost / this.subtotal;
      }
    } else {
      this._data.multiplier = 1;

      if (this.isLabor()) {
        this.override("labor_hours", true);
        this._data.labor_hours = this.cost / (this.wage + this.burden);
      }
    }
  }

  _applyTaxPercentChange() {
    this._data.tax = this._getTaxableSubtotal() * (this.taxPercent / 100);
  }

  _applyMarkupPercent() {
    if (this.bid.includeTaxInMarkup()) {
      this._data.markup = (this.cost + this.tax) * (this.markupPercent / 100);
    } else {
      this._data.markup = this.cost * (this.markupPercent / 100);
    }
  }

  /**
   * Retrieves extra scalar dependency contracts.
   *
   * @return {number}
   */
  _getExtraScalarDependencies() {
    return pickBy(this.config.dependencies, function (el, key) {
      return key.indexOf("scalar_") === 0;
    });
  }

  /**
   * Retrieves extra tag dependency contracts.
   *
   * @return {Array}
   */
  _getExtraTagDependencies() {
    return pickBy(this.config.dependencies, function (el, key) {
      return key.indexOf("tag_") === 0;
    });
  }

  /**
   *
   * @return {number}
   */
  _getBaseValue() {
    if (!this.isOverridden("base")) {
      if (!isUndefined(this._data.config.base)) {
        return round(Helpers.confirmNumber(this._data.config.base), 4);
      } else return 0;
    } else return this._data.base;
  }

  /**
   *
   * @return {number}
   */
  _getWageValue() {
    if (!this.isOverridden("wage")) {
      const dependencyValue = this._evaluateDependency(this.config.dependencies.wage, "wage");
      return round(Helpers.confirmNumber(dependencyValue), 4);
    } else return round(Helpers.confirmNumber(this._data.wage), 4);
  }

  _getTaxableSubtotal() {
    return this.bid.includeMarkupInTax() ? this.cost + this.markup : this.cost;
  }

  /**
   * Internally retrieves the non-cached computed IsIncluded  value.
   *
   * @return {boolean}
   */
  _getIsIncludedValue() {
    if (!this.isOverridden("is_included")) {
      return this._ruleService.isIncluded(this);
    } else return this._data.is_included;
  }

  /**
   * Internally retrieves the non-cached computed IsWeighted value.
   *
   * @return {boolean}
   */
  _getIsWeightedValue() {
    if (!this.isOverridden("is_weighted")) {
      return this._ruleService.isWeighted(this);
    } else return this._data.config.is_weighted;
  }

  /**
   * Internally retrieves the non-cached computed Labor Hours value.
   *
   * @return {number}
   */
  _getLaborHoursValue() {
    if (this.isOverridden("labor_hours")) {
      this._applyConfig("is_predicted_labor_hours", false);
      return round(Helpers.confirmNumber(this._data.labor_hours), 4);
    }

    let hours;
    if (this.isLabor()) {
      if (this._shouldPredict(["quantity", "per_quantity", "base", "multiplier", "scalar"])) {
        hours = this.getPredictedLaborHours();
        this._applyConfig("is_predicted_labor_hours", true);
      } else {
        hours = (this.quantity * this.perQuantity + this.base) * this.multiplier;
        this._applyConfig("is_predicted_labor_hours", false);
        if (this._undefinedPropsIncludes("quantity", "per_quantity", "base", "multiplier")) {
          this._undefinedPropFlags.push("labor_hours");
        }
      }
    } else {
      hours = 0;
      this._applyConfig("is_predicted_labor_hours", false);
    }
    return round(Helpers.confirmNumber(hours), 4);
  }

  /**
   * Internally retrieves the non-cached computed Burden value.
   *
   * @return {number}
   */
  _getBurdenValue() {
    if (!this.isOverridden("burden")) {
      const dependencyValue = this._evaluateDependency(this.config.dependencies.burden, "burden");
      return Helpers.confirmNumber(dependencyValue);
    } else return Helpers.confirmNumber(this._data.burden);
  }

  /**
   * Internally retrieves the non-cached computed Scalar value.
   *
   * @return {number}
   */
  _getScalarValue() {
    const scalarContracts = this._getExtraScalarDependencies();

    let valueMap = {};

    each(scalarContracts, (dependencyContract, key) => {
      const dependencyValue = this._evaluateDependency(dependencyContract, "scalar");
      valueMap[key.charAt(7)] = Helpers.confirmNumber(dependencyValue, 0);
    });

    var xScalarValue = this._evaluateDependency(this.config.dependencies.scalar, "scalar");
    valueMap.x = Helpers.confirmNumber(xScalarValue, 1);

    const results = Helpers.calculateFormula(this.config.formula, valueMap);
    return round(Helpers.confirmNumber(results, 1), 7);
  }

  /**
   * Internally retrieves the non-cached Tag value.
   *
   * @return {(string|number|boolean)[]}
   */
  _getTagValue() {
    const tagContracts = this._getExtraTagDependencies();

    let valueMap = [];

    each(tagContracts, dependencyContract => {
      const dependencyValue = this.bid.entities.getDependencyValue(dependencyContract);
      if (!isNil(dependencyValue)) {
        valueMap.push(dependencyValue);
      }
    });

    return valueMap;
  }

  /**
   * Internally retrieves the non-cached computed Per Quantity value.
   *
   * @return {number}
   */
  _getPerQuantityValue() {
    if (!this.isOverridden("per_quantity")) {
      var val = 0;

      if (this.config.per_quantity.type === "value") {
        val = this.config.per_quantity.value;
      } else {
        val = this._evaluateDependency(this.config.dependencies.per_quantity, "per_quantity");
      }

      var scaledPerQuantity = Helpers.confirmNumber(val) * this.scalar;

      if (this._undefinedPropsIncludes("scalar")) {
        this._undefinedPropFlags.push("per_quantity");
      }

      return round(Helpers.confirmNumber(scaledPerQuantity), 4);
    } else return round(Helpers.confirmNumber(this._data.per_quantity), 4);
  }

  /**
   * Internally retrieves the non-cached computed Escalator value.
   *
   * @return {number}
   */
  _getEscalatorValue() {
    if (!this.isOverridden("escalator")) {
      const dependencyValue = this._evaluateDependency(this.config.dependencies.escalator, "escalator");
      return round(Helpers.confirmNumber(dependencyValue, 1), 4);
    } else return round(Helpers.confirmNumber(this._data.escalator, 1), 4);
  }

  /**
   * Internally retrieves the non-cached computed OH&P value.
   *
   * @return {number}
   */
  _getOhpValue() {
    if (!this.isOverridden("ohp")) {
      const dependencyValue = this._evaluateDependency(this.config.dependencies.ohp, "ohp");
      return round(Helpers.confirmNumber(dependencyValue, 1), 4);
    } else return round(Helpers.confirmNumber(this._data.ohp, 1), 4);
  }

  /**
   * Internally retrieves the non-cached computed Quantity value.
   *
   * @return {number}
   */
  _getQuantityValue() {
    if (!this.isOverridden("quantity")) {
      let val = 0;

      //Must check for quantity property, as legacy bids do not contain this property.
      if (!isUndefined(this.config.quantity) && this.config.quantity.type === "value") {
        val = this.config.quantity.value;
      } else {
        val = this._evaluateDependency(this.config.dependencies.quantity, "quantity");
      }
      return round(Helpers.confirmNumber(val), 4);
    } else return round(Helpers.confirmNumber(this._data.quantity), 4);
  }

  /**
   *
   * @return {number}
   */
  _getCostValue() {
    if (this.isOverridden("cost")) {
      this._applyConfig("is_predicted_cost", false);
      return round(Helpers.confirmNumber(this._data.cost), 4);
    }

    const dependencies = ["escalator", "ohp"];
    let cost = 0;
    if (this.isLabor()) {
      dependencies.push("wage", "burden");
      // use predicted cost only if cost specific dependencies are undefined. Otherwise compute using predicted hours
      if (this._undefinedPropsIncludes(...dependencies) && this._shouldPredict(dependencies)) {
        this._applyConfig("is_predicted_cost", true);
        let cost = this.getPredictedCost();
        return this.isWeighted ? cost * this._predictionService.getContributionWeight() : cost;
      }

      cost = this.laborHours * (this.wage + this.burden);
      this._applyConfig("is_predicted_cost", this.isPredicted("labor_hours"));
    } else {
      dependencies.push("quantity", "per_quantity", "multiplier", "base", "scalar");
      if (this._shouldPredict(dependencies)) {
        this._applyConfig("is_predicted_cost", true);
        let cost = this.getPredictedCost();
        return this.isWeighted ? cost * this._predictionService.getContributionWeight() : cost;
      }

      cost = (this.quantity * this.perQuantity + this.base) * this.multiplier;
      this._applyConfig("is_predicted_cost", false);
    }

    cost = cost * this.escalator * this.ohp;

    if (this._undefinedPropsIncludes(...dependencies)) {
      this._undefinedPropFlags.push("cost");
    }

    return round(Helpers.confirmNumber(cost), 4);
  }

  /**
   *
   * @return {number}
   */
  _getTaxValue() {
    if (this.isOverridden("tax")) return round(Helpers.confirmNumber(this._data.tax));

    const shouldTax = !this.isLabor() || this.bid.entities.variables().taxable_labor.value;
    if (!shouldTax || this.cost <= 0) return 0;

    const dependencies = this.bid.includeMarkupInTax()
      ? ["cost", "tax_percent", "markup"]
      : ["cost", "tax_percent"];
    if (this._undefinedPropsIncludes(...dependencies)) {
      this._undefinedPropFlags.push("tax");
    }

    return round(Helpers.confirmNumber(this._getTaxableSubtotal() * (this.taxPercent / 100)), 4);
  }

  /**
   *
   * @return {number}
   */
  _getTaxPercentValue() {
    if (!this.isOverridden("tax_percent")) {
      const dependencyValue = this._evaluateDependency(this.config.dependencies.tax, "tax_percent");
      return round(Helpers.confirmNumber(dependencyValue), 4);
    } else return round(Helpers.confirmNumber(this._data.tax_percent), 4);
  }

  /**
   *
   * @return {number}
   */
  _getMarkupValue() {
    if (!this.isOverridden("markup")) {
      let costToMarkup = this.cost;
      const propsUsed = ["cost"];

      if (this.bid.includeTaxInMarkup()) {
        costToMarkup += this.tax;
        propsUsed.push("tax");
      }

      const val = round(costToMarkup * (this.markupPercent / 100), 4);
      propsUsed.push("markup_percent");

      if (this._undefinedPropsIncludes(...propsUsed)) {
        this._undefinedPropFlags.push("markup");
      }
      return val;
    } else return round(Helpers.confirmNumber(this._data.markup), 4);
  }

  /**
   *
   * @return {number}
   */
  _getMarkupPercentValue() {
    if (!this.isOverridden("markup_percent")) {
      const dependencyValue = this._evaluateDependency(this.config.dependencies.markup, "markup_percent");
      return round(Helpers.confirmNumber(dependencyValue), 4);
    } else return round(Helpers.confirmNumber(this._data.markup_percent), 4);
  }

  /**
   * @return {number}
   */
  _getPriceValue() {
    if (!this.isOverridden("price")) {
      let price = this.cost + this.tax + this._getMarkupValue();

      if (this._undefinedPropsIncludes("cost", "tax", "markup")) {
        this._undefinedPropFlags.push("price");
      }
      return round(Helpers.confirmNumber(price), 4);
    } else return round(Helpers.confirmNumber(this._data.price), 4);
  }

  /**
   * Gets the value for a dependency. If a dependency is undefined, it will be flagged in the config.undefined_prop_flags
   *
   * @param {object} dependencyContract The dependency contract
   * @param {string} propName The name of the line item prop that depends on this dependency.
   *                          Needed so that it can be flagged if the dependency is null or flagged as undefined.
   * @return {number|boolean|undefined|null} The resolved dependency value
   */
  _evaluateDependency(dependencyContract, propName) {
    const dependencyValue = this.bid.entities.getDependencyValue(dependencyContract);
    const isNullDependency =
      isNil(dependencyValue) || !this.bid.entities.isDependencyFullyDefined(dependencyContract);

    if (!isNil(dependencyContract) && !isNil(dependencyContract.field) && isNullDependency) {
      this._undefinedPropFlags.push(propName);
    }
    return dependencyValue;
  }

  /**
   * Clear the locally cached values
   */
  _invalidateCachedValues() {
    this._cacheValues = {};
  }

  /**
   * Reset the flags for props that rely on undefined dependencies in assessment
   */
  _resetUndefinedPropFlags() {
    this._undefinedPropFlags = [];
  }

  /**
   * Determines if the field is dependent on null/undefined dependencies
   *
   * @param {string} field The field value in question
   * @return {boolean}
   */
  hasNullDependency(field) {
    if (field) {
      if (this.isOverridden(field)) {
        return false;
      }
      if (this.config.undefined_prop_flags && this.config.undefined_prop_flags.indexOf(field) >= 0) {
        return true;
      }
      return false;
    }
    return this.config.undefined_prop_flags.length > 0;
  }

  /**
   * Checks if any of the given dependencies have been flagged as undefined during the assessment
   *
   * @param {...string} dependencies Dependencies to check
   * @return {boolean} Whether or not any of the given dependencies have relied on any numbers that were not fully defined
   */
  _undefinedPropsIncludes(...dependencies) {
    return this._undefinedPropFlags.reduce(
      (isFlagged, dependency) => isFlagged || dependencies.indexOf(dependency) >= 0,
      false
    );
  }

  /**
   * Determine if the undefined props flags have changed during the assesment. If so update the config var.
   *
   * @return {boolean} Whether or not there has been a change
   */
  _applyUndefinedPropFlags() {
    const oldFlags = this.config.undefined_prop_flags
      ? this.config.undefined_prop_flags.concat().sort().join(",")
      : [];
    const newFlags = Array.from(new Set(this._undefinedPropFlags)).concat().sort().join(",");
    if (oldFlags !== newFlags) {
      this.config.undefined_prop_flags = Array.from(new Set(this._undefinedPropFlags));
      return true;
    }
    return false;
  }

  /**
   * Determines whether a prediction should be used during assessment given the dependencies
   *
   * @param {boolean} propsToConsider The required properties used in this calculation
   * @return {boolean} Whether or not a predicted value should be used
   */
  _shouldPredict(propsToConsider) {
    // PredictivePricing bid variable must be ON
    if (!this.bid.entities.variables().predictive_pricing.value) return false;

    // Line item must have a definition
    if (isNil(this.definitionId)) return false;

    // Line item must have prediction models
    if (!this._predictionService.hasPredictionModels()) return false;

    // The bid must have a watts value greater than 0 (bid watts are rounded up to at least 1 so 1 is used instead of 0 here)
    // getTotalWatts() used instead of bid.watts because bid.watts is not calculated untill the bid is assessed
    if (this.bid._getTotalWatts() <= 1) return false;

    // The line item should have dependencies that are not fully defined or useComputedValueWhenAvaliable should be OFF
    if (!this._undefinedPropsIncludes(...propsToConsider) && this.useComputedValueWhenAvailable) return false;

    return true;
  }

  /**
   * Evaluates the cost prediction models for the line item.
   *
   * @return {number} The predicted cost value
   */
  getPredictedCost() {
    if (this._cacheValues.predictedCost !== undefined) {
      return this._cacheValues.predictedCost;
    }

    if (this._predictionService.hasPredictionModels()) {
      const models = this._predictionService.getCostPredictionModels();
      if (models && models.length > 0) {
        return (this._cacheValues.predictedCost = round(
          Helpers.confirmNumber(this._predictionService.evaluateModels(models)),
          4
        ));
      }
    }
    return (this._cacheValues.predictedCost = 0);
  }

  /**
   * Evaluates the labor hours prediction models for the line item.
   *
   * @return {number} The predicted cost value
   */
  getPredictedLaborHours() {
    if (this._cacheValues.predictedLabor !== undefined) {
      return this._cacheValues.predictedLabor;
    }

    if (this._predictionService.hasPredictionModels()) {
      const models = this._predictionService.getLaborPredictionModels();
      if (models && models.length > 0) {
        return (this._cacheValues.predictedLabor = round(
          Helpers.confirmNumber(this._predictionService.evaluateModels(models)),
          4
        ));
      }
    }
    return (this._cacheValues.predictedLabor = 0);
  }

  getPredictedCostExperimental() {
    return this._getExperimentalPrediction(this._predictionService.getCostPredictionModels());
  }

  getPredictedLaborHoursExperimental() {
    return this._getExperimentalPrediction(this._predictionService.getLaborPredictionModels());
  }

  _getExperimentalPrediction(models) {
    return round(Helpers.confirmNumber(this._predictionService.evaluateModelsExperimental(models)), 4);
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
  _getStoplightIndicator() {
    let stoplightRange, currentWeightedValue, nextWeightedValue, rawResult
    let weightedNormalValues = []
    //  if the line item has prediction models but is not included return -4 (~)
    if (this._predictionService.hasPredictionModels() && !this.isIncluded) {
      return -4;
    }
    // if the line item does not have prediction models and is not included return -4 (~)
    if (!this._predictionService.hasPredictionModels() && !this.isIncluded) {
      return -4;
    }
    // it the line item is predicted and not included return -3 (Data Not Available)
    if (this.isPredicted() && !this.isIncluded) {
      return -3;
    }
    // if the line item has a predicted value that is equal to zero or undefined return -3 (Data Not Available)
    if (this.getPredictedValue() === 0 || typeof this.getPredictedValue() === 'undefined') {
      return -3;
    }
    // if the calculated weighted normal values exists
    if (this.getWeightedNormalValues()) {
      weightedNormalValues = this.getWeightedNormalValues();
    } else {
      return -3;
    }
    /**
     *  Initiate the Stoplight Calculations
     *  For each weighted normal value, determine the stoplight range  based on the current and next weighted value
     */
    for (let nvi = 0, nvx = weightedNormalValues.length; nvi < nvx; nvi++) {
      currentWeightedValue = weightedNormalValues[nvi];
      nextWeightedValue = weightedNormalValues[(nvi + 1) % nvx];
      rawResult = this.determineStoplightRange(nvi, currentWeightedValue, nextWeightedValue);
      if (rawResult !== null && rawResult !== undefined) {
        stoplightRange = rawResult;
      }
    }
    if (typeof stoplightRange === 'undefined') {
      // If the lineItem's cost is greater than the predicted value
      // set the stoplight range to -1 (out of range on the upper bound)
      if (this.getValue() > this.getPredictedValue()) {
        stoplightRange = -1;
      }
      // If the lineItem's cost is less than the predicted value
      // set the stoplight range to -2 (out of range on the lower bound)
      if (this.getValue() < this.getPredictedValue()) {
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
    if (currentIndex < 5) {
      if ((this.getValue() < currentWeightedValue) && (this.getValue() >= nextWeightedValue)) {
        return currentIndex;
      }
    }
    // If the normal value falls in the ranges below or equal to 40%
    if (currentIndex >= 5) {
      if ((this.getValue() <= currentWeightedValue) && (this.getValue() > nextWeightedValue)) {
        return currentIndex;
      }
    }

  }

  /**
   *  Calculate the weighted normal value given a set of distribution ranges.
   * @returns {array} Array of weighted normal values
   */
  getWeightedNormalValues() {
    let distributionRanges = [96, 90, 75, 60, 40, 25, 10, 4];
    let values = [];
    const notANumberCond = (currentValue) => isNaN(currentValue);
    const nullCond = (currentValue) => currentValue === null;
    for (let nvi = 0, nvx = distributionRanges.length; nvi < nvx; nvi++) {
      values.push(this.getWeightedNormalValue(distributionRanges[nvi]));
    }
    return (values.every(nullCond) || values.every(notANumberCond)) ? null : values;
  }

  /**
   *  Calculates the weighted normal value at x range
   * @param range
   * @returns {int|null} weighted normal value
   */
  getWeightedNormalValue(range) {
    let currentNormalError, currentNormalValue, currentSumR2, nextNormalError, nextNormalValue, nextSumR2,
      weightedNormalValue;
    if (this._predictionService.hasPredictionModels()) {
      let predictionModels = this.getPredictionModels();
      let sumR2 = this.calculateStdDevSumR2();
      let predictedValue = this.getPredictedValue();
      for (let mi = 0, mix = predictionModels.length; mi < mix; mi++) {
        // first we calculate the normal error
        currentNormalError = this.calculateNormalError(range, predictionModels[mi]);
        // then we calculate the normal values from the current  model value (predicted value) and the array of normal errors just calculated.
        currentNormalValue = this.calculateNormalValue(predictedValue, currentNormalError);
        // finally we get the weighted normal values from the current model normal values, the current model's r-squared weight,
        // then the next models normal values and r-squared weight
        currentSumR2 = (predictionModels[mi].model.standard_deviation.r2 / sumR2);
        // make sure to stay within the amount of models available
        if (predictionModels.length === 1) {
          weightedNormalValue = this.calculateWeightedNormalValue(currentNormalValue, currentSumR2, 0, 0);
        } else {
          let ix = (mi + 1) % mix;
          nextNormalError = this.calculateNormalError(range, predictionModels[ix]);
          nextNormalValue = this.calculateNormalValue(predictedValue, nextNormalError);
          nextSumR2 = (predictionModels[ix].model.standard_deviation.r2 / sumR2);
          weightedNormalValue = this.calculateWeightedNormalValue(currentNormalValue, currentSumR2, nextNormalValue, nextSumR2);
        }
      }
      return weightedNormalValue;
    }
    return null;
  }

  /**
   * Gets an array of the calculated weighted labor hour cost
   * @returns {[]}
   */
  getWeightedLaborHourCost() {
    let weightedLaborCost = [];
    let conversion, weights;
    if (!this.isLabor()) {
      return null;
    }
    if (!this._predictionService.hasPredictionModels()) {
      return null;
    }
    weights = this.getWeightedNormalValues();
    for (let w = 0, x = weights.length; w < x; w++) {
      conversion = this.calculateWeightedLaborCost(weights[w]);
      weightedLaborCost.push(conversion);
    }
    return weightedLaborCost;
  }

  /**
   * Gets the prediction models for the current line item by type
   * @returns {Object[]}
   */
  getPredictionModels() {
    let predictionModels = [];
    let models;
    // Check if the models are based on cost or labor hours
    if (!this._predictionService.hasPredictionModels()) {
      return null;
    }
    if (this.isLabor()) {
      models = this._predictionService.getLaborPredictionModels();
      for (let m = 0, mx = models.length; m < mx; m++) {
        if (models[m].model.hasOwnProperty('standard_deviation')) {
          predictionModels.push(models[m]);
        }
      }
    } else {
      models = this._predictionService.getCostPredictionModels();
      for (let m = 0, mx = models.length; m < mx; m++) {
        if (models[m].model.hasOwnProperty('standard_deviation')) {
          predictionModels.push(models[m]);
        }
      }
    }
    return predictionModels;
  }

  /**
   * Gets the predicted value for the line item based on type
   * @returns {number}
   */
  getPredictedValue() {
    if (!this.isLabor()) {
      return this.getPredictedCost();
    }
    if ((this._getWageValue() && this._getBurdenValue() > 0) &&
      (typeof this._getWageValue() && typeof this._getBurdenValue() !== 'undefined')) {
      return this.getPredictedLaborHours();
    } else {
      return this.getPredictedCost();
    }

  }

  /**
   * Gets the line item's value. Either Cost or Labor Hours
   * @returns {number}
   */
  getValue() {
    if (!this.isLabor()) {
      return this._getCostValue();
    }
    if ((this._getWageValue() && this._getBurdenValue() > 0) &&
      (typeof this._getWageValue() && typeof this._getBurdenValue() !== 'undefined')) {
      return this._getLaborHoursValue();
    } else {
      return this._getCostValue();
    }
  }

  /**
   * Calculates the sum of the r2 values from each model's ['standard_deviation'] object
   * @returns {sumOfR2|null}
   */
  calculateStdDevSumR2() {
    let r2Values = [];
    if (!this._predictionService.hasPredictionModels()) {
      return null;
    }
    let models = this.getPredictionModels();
    for (let m = 0, mx = models.length; m < mx; m++) {
      if (models[m].model.hasOwnProperty('standard_deviation')) {
        r2Values.push(models[m].model.standard_deviation.r2);
      }
    }

    return r2Values.length > 0 ? r2Values.reduce((x, y) => x + y) : null;
  }

  /**
   * Calculates the  based on a distribution range, a model's standard_deviation_error_mean and error
   * @param range
   * @param model
   * @returns {float}  The CDF - inverse normal distribution result
   */
  calculateNormalError(range, model) {
    return jStat.normal.inv((range / 100), model.model.standard_deviation.std_dev_error_mean, model.model.standard_deviation.std_dev_error);
  }

  /**
   * Calculates the normal value from the normal error
   * @param value
   * @param error
   * @returns {number}
   */
  calculateNormalValue(value, error) {
    return value * (1 + error);
  }

  /**
   * Calculates the weighted normal value from the current normal value and sumOfR2 and the next normal value and sumOfR2
   * @param currentModelNormalValue
   * @param currentModelSumR2
   * @param nextModelNormalValue
   * @param nextModelSumR2
   * @returns {number}
   */
  calculateWeightedNormalValue(currentModelNormalValue, currentModelSumR2, nextModelNormalValue, nextModelSumR2) {
    return (currentModelNormalValue * currentModelSumR2) + (nextModelNormalValue * nextModelSumR2);
  }

  /**
   * Calculates the weighted labor hours cost.
   * @param weightedValue
   * @returns {number}
   */
  calculateWeightedLaborCost(weightedValue) {
    if ((
      (this._getWageValue() && this._getBurdenValue()) > 0 &&
      (this._getScalarValue() && this._getEscalatorValue()) > 0
    )) {
      return weightedValue * ((this._getWageValue() + this._getBurdenValue()) *
        (this._getScalarValue() * this._getEscalatorValue()));
    }
  }

  /**
   * Exports the line item's internal data structure.
   *
   * @param {boolean} [alwaysIncludeConfig=false]
   *      Flag to include config object regardless of whether it has changed or not. The config
   *      is always included if it has been modified but is omitted by to improve save performance
   *      if there have been no changes by default to improve save performance.
   * @returns {object}
   */
  exportData(alwaysIncludeConfig = false) {
    const blacklist = !alwaysIncludeConfig && !this._hasConfigEverChanged ? ["config"] : [];
    return cloneDeep(omit(this._data, blacklist));
  }

  /**
   * Moves line item to a new component and self removes from original component in the same {@link ComponentGroup}
   *
   * @param {Component} component
   */
  moveToComponent(component) {
    each(this.bid.entities.components(), componentToLeave => {
      if (componentToLeave.config.component_group_id === component.config.component_group_id) {
        if (componentToLeave.config.line_items.includes(this.id)) {
          pull(componentToLeave.config.line_items, this.id);

          componentToLeave.assess();
        }
      }
    });

    component.config.line_items.push(this.id);
    component.bind();
    component.assess();
  }

  /**
   * Gets an array of components that the line item is under.
   * A line item is either uncategorized or under one {@link Component} per {@link ComponentGroup}
   *
   * @returns {Component[]}
   */
  components() {
    let components = [];
    each(this.bid.entities.components(), component => {
      if (component.config.line_items.includes(this.id)) components.push(component);
    });
    return components;
  }

  /**
   * Get the line item's assembly if it has one
   *
   * @return {Assembly|undefined}
   */
  getAssembly() {
    return getAssembly(this);
  }

  /**
   * Adds the line item to an assembly.
   *
   * @param {Assembly|string} assembly The assembly entity or an assembly ref id
   * @return {Assembly} the new assembly setting
   */
  setAssembly(assembly) {
    if (!assembly) throw new Error("Assembly reference was not provided.");
    setAssembly(this, assembly);
    this.dirty();
    return this.getAssembly();
  }

  /**
   * Removes any assembly reference from the line item.
   *
   * @return {void}
   */
  unsetAssembly() {
    setAssembly(this, null);
    this.dirty();
  }

  _removeFromDynamicGroups() {
    Object.values(this.bid.entities.dynamicGroups()).forEach(group => {
      while (group.lineItems.includes(this.id)) {
        // while loop in-case of duplicates
        group.removeChildById("line_item", this.id);
      }
    });
  }

  _removeFromComponents() {
    this.components().forEach(c => {
      c.removeLineItem(this.id);
    });
  }

  _removeFromAssembly() {
    if (this.hasAssembly) {
      const assembly = this.getAssembly();
      assembly.removeBidEntity(this.type, this.id);
    }
  }

  /**
   * Deletes line item.
   *
   * @returns {Promise<void>}
   */
  async delete() {
    if (this.dependants().length === 0) {
      await this.bid._bidService.repositories.lineItems.delete(this.bid.id, this.id);
      this._removeFromComponents();
      this._removeFromDynamicGroups();
      this._removeFromAssembly();

      delete this.bid._data.line_items[this.id];
      await this.bid.project.save();
      this.bid.assess();
      return;
    } else Promise.reject({message: "Line item has dependants."});
  }
}
