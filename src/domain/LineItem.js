import _ from "lodash";
import BidEntity from "./BidEntity";
import Helpers from "../utils/Helpers";
import LineItemRuleService from "./services/LineItemRuleService";

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
        this._original = _.cloneDeep(entityData);
        this._data = entityData;
        this._ruleService = new LineItemRuleService(this);
        this.onDelay("property.updated", 5, "self", () => this.assess(true));
    }

    /**
     * Base Property
     * @type {number}
     */
    get base() {
        return Helpers.confirmNumber(this._data.base);
    }
    set base(val) {
        if (Helpers.isNumber(val)) {
            this._data.base = Helpers.confirmNumber(val);
            this.override("base", true);
            this.override("cost", false);
            this.override("price", false);
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
    set isIncluded(val) {
        if (_.isBoolean(val) && this._data.is_included != val) {
            this._data.is_included = val;
            this.override("is_included", true);
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
    set laborHours(val) {
        if (Helpers.isNumber(val) && this._data.labor_hours != Helpers.confirmNumber(val)) {
            this._data.labor_hours = Helpers.confirmNumber(val);
            this.override("labor_hours", true);
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
     * Scalar Property
     * @type {number}
     */
    get scalar() {
        const scalarContracts = this._getExtraScalarDependencies();

        let valueMap = {};

        _.each(scalarContracts, (dependencyContract, key) => {
            valueMap[key.charAt(7)] = Helpers.confirmNumber(
                this.bid.entities.getDependencyValue(dependencyContract),
                0,
                true
            );
        });

        var xScalarValue = this.bid.entities.getDependencyValue(this.config.dependencies.scalar);
        valueMap.x = Helpers.confirmNumber(xScalarValue, 1, true);

        const results = Helpers.calculateFormula(this.config.formula, valueMap);
        return Helpers.confirmNumber(results, 1);
    }

    /**
     * Per Quantity Property
     * @type {number}
     */
    get perQuantity() {
        return Helpers.confirmNumber(this._data.per_quantity);
    }
    set perQuantity(val) {
        if (Helpers.isNumber(val) && this._data.per_quantity != Helpers.confirmNumber(val)) {
            this._data.per_quantity = Helpers.confirmNumber(val);
            this.override("per_quantity", true);
            this.override("cost", false);
            this.override("price", false);
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
    set escalator(val) {
        if (Helpers.isNumber(val) && this._data.escalator != Helpers.confirmNumber(val)) {
            this._data.escalator = Helpers.confirmNumber(val);
            this.override("cost", false);
            this.override("price", false);
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
    set quantity(val) {
        if (Helpers.isNumber(val) && this._data.quantity != Helpers.confirmNumber(val)) {
            this._data.quantity = Helpers.confirmNumber(val);
            this.override("quantity", true);
            this.override("cost", false);
            this.override("price", false);
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
    set multiplier(val) {
        if (Helpers.isNumber(val) && this._data.multiplier != Helpers.confirmNumber(val)) {
            this._data.multiplier = Helpers.confirmNumber(val);
            this.override("multiplier", true);
            this.override("cost", false);
            this.override("price", false);
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
    set cost(val) {
        if (Helpers.isNumber(val) && this._data.cost != Helpers.confirmNumber(val)) {
            this._data.cost = Helpers.confirmNumber(val);
            this._data.escalator = 1;
            this.override("cost", true);
            this.override("escalator", true);
            this.override("price", false);
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
    set tax(val) {
        if (Helpers.isNumber(val) && this._data.tax != Helpers.confirmNumber(val)) {
            this._data.tax = Helpers.confirmNumber(val);
            this.override("tax", true);
            this.override("tax_percent", true);
            this.override("price", false);
            this.isIncluded = true;
            this.dirty();

            this._data.tax_percent = this.cost > 0 ? Helpers.confirmNumber(this.tax / this.cost) * 100 : 0;

            if (this.bid.includeTaxInMarkup()) {
                this.markup = Helpers.confirmNumber(this.cost + this.tax) * (this.markupPercent / 100);
            } else this.assess();
        }
    }

    /**
     * Tax Percent Property
     * @type {number}
     */
    get taxPercent() {
        return Helpers.confirmNumber(this._data.tax_percent);
    }
    set taxPercent(val) {
        if (Helpers.isNumber(val) && this._data.tax_percent != Helpers.confirmNumber(val)) {
            this._data.tax_percent = Helpers.confirmNumber(val);
            this.override("tax_percent", true);
            this.override("price", false);

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
    set markup(val) {
        if (Helpers.isNumber(val) && this._data.markup != Helpers.confirmNumber(val)) {
            this._data.markup = _.round(Helpers.confirmNumber(val), 4);
            //this.override("markup", true);
            this.override("price", false);
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
        return _.round(Helpers.confirmNumber(this._data.markup_percent), 4);
    }
    set markupPercent(val) {
        if (Helpers.isNumber(val) && this._data.markup_percent != Helpers.confirmNumber(val)) {
            this._data.markup_percent = _.round(Helpers.confirmNumber(val), 4);
            this.override("markup_percent", true);
            this.override("price", false);
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
        return _.round(Helpers.confirmNumber(this._data.price), 4);
    }
    set price(val) {
        if (Helpers.isNumber(val) && this._data.price != Helpers.confirmNumber(val)) {
            this._data.price = Helpers.confirmNumber(val);
            this._applyPriceChange();
            this.isIncluded = true;
            this.dirty();
            this.override("price", true);
            this.emit("property.updated");
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
     * Config Property
     * @type {object}
     */
    get config() {
        return this._data.config;
    }
    set config(val) {
        throw "Setting line item config is not permitted";
    }

    /**
     * Gets Subtotal aka Initial Results.
     * 
     * @return {number}      
     */
    get subtotal() {
        return Helpers.confirmNumber(parseFloat(this.quantity) * parseFloat(this.perQuantity) + parseFloat(this.base));
    }

    /**
     * 
     * @param {string} property 
     * @param {(number|string|boolean)} value 
     */
    override(property, value) {
        if (!this.bid.isReadOnly()) {
            if (_.isUndefined(this._data.config.overrides)) {
                this._data.config.overrides = {};
            }

            // If initially empty, the .config can be interpreted as an array.
            // This line converts the array to an object.
            if (_.isArray(this._data.config.overrides)) {
                this._data.config.overrides = _.reduce(
                    this._data.config.overrides,
                    function(o, k) {
                        return _.assign(o, k);
                    },
                    {}
                );
            }
            this._data.config.overrides[property] = value;
        }
    }

    /**
     * 
     * @param {string} property 
     * @returns {boolean}
     */
    isOverridden(property) {
        return (
            !_.isUndefined(this._data.config.overrides) &&
            !_.isUndefined(this._data.config.overrides[property]) &&
            this._data.config.overrides[property] === true
        );
    }

    /**
     * Resets a specific line item member, remove override value.
     * 
     * @param {string} property 
     */
    resetProperty(property) {
        if (
            this.bid.isAssessable() &&
            !_.isUndefined(this._data.config.overrides) &&
            !_.isUndefined(this._data.config.overrides[property])
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
        }
    }

    /**
     * Resets the line item, removing all user override inputs.
     */
    reset() {
        if (this.bid.isAssessable()) {
            this.config.overrides = {};
            this._data.multiplier = 1;
            this.assess(true);
        }
    }

    /**
     * 
     * @returns {boolean}
     */
    isLabor() {
        return this._data.config.type === "labor";
    }

    /**
     * 
     * @emits {assessing} fires event before assessement.
     * @emits {assessed}
     * @emits {updated}
     * @param {boolean} forceUpdate 
     */
    assess(forceUpdate) {
        if (this.bid.isAssessable()) {
            this.bid.emit("assessing");
            var isChanged = false;

            isChanged = this._applyProperty("base", this._getBaseValue()) || isChanged;
            isChanged = this._applyProperty("burden", this._getBurdenValue()) || isChanged;
            isChanged = this._applyProperty("wage", this._getWageValue()) || isChanged;
            isChanged = this._applyProperty("quantity", this._getQuantityValue()) || isChanged;
            isChanged = this._applyProperty("per_quantity", this._getPerQuantityValue()) || isChanged;
            isChanged = this._applyProperty("escalator", this._getEscalatorValue()) || isChanged;
            isChanged = this._applyProperty("labor_hours", this._getLaborHoursValue()) || isChanged;
            isChanged = this._applyProperty("cost", this._getCostValue()) || isChanged;
            isChanged = this._applyProperty("tax_percent", this._getTaxPercentValue()) || isChanged;
            isChanged = this._applyProperty("tax", this._getTaxValue()) || isChanged;
            isChanged = this._applyProperty("markup_percent", this._getMarkupPercentValue()) || isChanged;
            isChanged = this._applyProperty("markup", this._getMarkupValue()) || isChanged;
            isChanged = this._applyProperty("price", this._getPriceValue()) || isChanged;
            isChanged = this._applyProperty("is_included", this._getIsIncludedValue()) || isChanged;

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
        return this._is_dirty || !_.isEqual(this._data.config, this._original.config);
    }

    /**
     * Binds the "updated" event for all dependant bid entities.
     */
    bind() {
        if (this.bid.isAssessable()) {
            this._bindLineItemDependencies();
            this._bindLineItemRuleDependencies();
            this._bindLineItemPredictionDependencies();
        }
    }

    /**
     * Gets a list of bid entities that the line item instance relys on.
     * 
     * @returns {BidEntity[]} 
     */
    dependencies() {
        let dependencies = [];
        let contracts = [];
        contracts = contracts.concat(Object.values(this.config.dependencies));

        for (let rule of Object.values(this.config.rules)) {
            if (rule.dependencies) {
                contracts = contracts.concat(Object.values(rule.dependencies));
            }
        }

        _.each(contracts, ctrct => {
            const dependency = this.bid.entities.getDependency(ctrct);
            if (dependency) {
                dependencies.push(dependency);
            }
        });

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

    /**
     * 
     */
    _bindLineItemDependencies() {
        for (let dependencyContract of Object.values(this.config.dependencies)) {
            if (!_.isEmpty(dependencyContract)) {
                let dependency = this.bid.entities.getDependency(dependencyContract);
                if (dependency) {
                    dependency.on("updated", `line_item.${this.id}`, () => this.assess());

                    if (dependency.type === "field" && dependency.config.type === "list") {
                        _.each(dependency.config.dependencies, fieldDependencyContract => {
                            const fieldDependency = this.bid.entities.getDependency(fieldDependencyContract);
                            if (fieldDependency) {
                                fieldDependency.on("updated", `line_item.${this.id}`, () => this.assess());
                            }
                        });
                    }
                }
            }
        }
    }

    /**
     * 
     */
    _bindLineItemRuleDependencies() {
        for (let rule of Object.values(this.config.rules)) {
            if (rule.dependencies) {
                for (let dependencyContract of Object.values(rule.dependencies)) {
                    if (!_.isEmpty(dependencyContract)) {
                        let dependency = this.bid.entities.getDependency(dependencyContract);
                        if (dependency) {
                            dependency.on("updated", `line_item.${this.id}`, () => this.assess());
                        }
                    }
                }
            }
        }
    }

    /**
     * 
     */
    _bindLineItemPredictionDependencies() {
        if (this.config.prediction_model) {
            var predictionModels = this.config.prediction_model;

            for (let predictionModel of predictionModels) {
                var bidEnities = this.bid.getBidEntitiesByDefId(
                    predictionModel.dependencies.x.type,
                    predictionModel.dependencies.x.definition_id
                );

                for (let bidEntity of bidEnities) {
                    bidEntity.on("updated", `line_item.${this.id}`, () => this.assess());
                }
            }
        }
    }

    /**
     * 
     */
    _applyProperty(property, value) {
        let oldValue = !_.isBoolean(value) ? _.round(this._data[property], 3) : this._data[property];
        let newValue = !_.isBoolean(value) ? _.round(value, 3) : value;

        if (oldValue != newValue) {
            //console.log("li changed", property, oldValue, newValue);

            this._data[property] = _.round(value, 6);
            return true;
        } else return false;
    }

    /**
     * 
     */
    _applyMarkupChange() {
        this.override("markup_percent", true);

        if (this.bid.includeTaxInMarkup()) {
            this._data.markup_percent = _.round(Helpers.confirmNumber(this.markup / (this.cost + this.tax)) * 100, 4);
        } else {
            this._data.markup_percent = _.round(Helpers.confirmNumber(this.markup / this.cost) * 100, 4);
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
     * Internal method to calcualte a Unit price change.
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
        var lineItemSubtotal = this.subtotal;

        if (lineItemSubtotal > 0) {
            this._data.multiplier = this.cost / this.subtotal;
        } else {
            this._data.multiplier = 1;
        }
    }

    /**
     * 
     */
    _applyTaxPercentChange() {
        this._data.tax = this.cost * (this.taxPercent / 100);

        if (this.bid.includeTaxInMarkup()) {
            //this.markup = Helpers.confirmNumber(this.cost + this.tax) * (this.markupPercent / 100);
        }
    }

    _applyMarkupPercent() {
        if (this.bid.includeTaxInMarkup()) {
            this._data.markup = (this.cost + this.tax) * (this.markupPercent / 100);
        } else {
            this._data.markup = this.cost * (this.markupPercent / 100);
        }
    }

    /**
     * 
     * @return {number}
     */
    _getExtraScalarDependencies() {
        return _.pickBy(this.config.dependencies, function(el, key) {
            return key.indexOf("scalar_") === 0;
        });
    }

    /**
     * 
     * @return {number}
     */
    _getBaseValue() {
        if (!this.isOverridden("base")) {
            if (!_.isUndefined(this._data.config.base)) {
                return _.round(Helpers.confirmNumber(this._data.config.base), 4);
            } else return 0;
        } else return this._data.base;
    }

    /**
     * 
     * @return {number}
     */
    _getWageValue() {
        if (!this.isOverridden("wage")) {
            var dependencyValue = this.bid.entities.getDependencyValue(this.config.dependencies.wage);
            return _.round(Helpers.confirmNumber(dependencyValue), 4);
        } else return _.round(Helpers.confirmNumber(this._data.wage), 4);
    }

    /**
     * 
     * @return {number}
     */
    _getIsIncludedValue() {
        if (!this.isOverridden("is_included")) {
            return this._ruleService.isIncluded(this);
        } else return this._data.is_included;
    }

    /**
     * 
     * @return {number}
     */
    _getLaborHoursValue() {
        if (!this.isOverridden("labor_hours")) {
            let hours = this.isLabor() ? (this.quantity * this.perQuantity + this.base) * this.multiplier : 0;
            return _.round(Helpers.confirmNumber(hours), 4);
        } else return _.round(Helpers.confirmNumber(this._data.labor_hours), 4);
    }

    /**
     * 
     * @return {number}
     */
    _getBurdenValue() {
        if (!this.isOverridden("burden")) {
            var dependencyValue = this.bid.entities.getDependencyValue(this.config.dependencies.burden);
            return Helpers.confirmNumber(dependencyValue);
        } else return Helpers.confirmNumber(this._data.burden);
    }

    /**
     * 
     * @return {number}
     */
    _getScalarValue() {
        const scalarContracts = this._getExtraScalarDependencies();

        let valueMap = {};

        _.each(scalarContracts, (dependencyContract, key) => {
            valueMap[key.charAt(7)] = Helpers.confirmNumber(
                this.bid.entities.getDependencyValue(dependencyContract),
                0,
                true
            );
        });

        var xScalarValue = this.bid.entities.getDependencyValue(this.config.dependencies.scalar);
        valueMap.x = Helpers.confirmNumber(xScalarValue, 1, true);

        const results = Helpers.calculateFormula(this.config.formula, valueMap);
        return _.round(Helpers.confirmNumber(results, 1), 7);
    }

    /**
     * 
     * @return {number}
     */
    _getPerQuantityValue() {
        if (!this.isOverridden("per_quantity")) {
            var val = 0;

            if (this.config.per_quantity.type === "value") {
                val = this.config.per_quantity.value;
            } else {
                val = this.bid.entities.getDependencyValue(this.config.dependencies.per_quantity);
            }

            var scaledPerQuantity = Helpers.confirmNumber(val) * this.scalar;

            return _.round(Helpers.confirmNumber(scaledPerQuantity), 4);
        } else return _.round(Helpers.confirmNumber(this._data.per_quantity), 4);
    }

    /**
     * 
     * @return {number}
     */
    _getEscalatorValue() {
        if (!this.isOverridden("escalator")) {
            var dependencyValue = this.bid.entities.getDependencyValue(this.config.dependencies.escalator);
            return _.round(Helpers.confirmNumber(dependencyValue, 1), 4);
        } else return _.round(Helpers.confirmNumber(this._data.escalator, 1), 4);
    }

    /**
     * 
     * @return {number}
     */
    _getQuantityValue() {
        if (!this.isOverridden("quantity")) {
            let val = 0;

            //Must check for quantity property, as legacy bids do not contain this property.
            if (!_.isUndefined(this.config.quantity) && this.config.quantity.type === "value") {
                val = this.config.quantity.value;
            } else {
                val = this.bid.entities.getDependencyValue(this.config.dependencies.quantity);
            }
            return _.round(Helpers.confirmNumber(val), 4);
        } else return _.round(Helpers.confirmNumber(this._data.quantity), 4);
    }

    /**
     * 
     * @return {number}
     */
    _getCostValue() {
        if (!this.isOverridden("cost")) {
            let cost = 0;
            if (this.isLabor()) {
                cost = this.laborHours * (this.wage + this.burden);
            } else {
                cost = (this.quantity * this.perQuantity + this.base) * this.multiplier;
            }

            return _.round(Helpers.confirmNumber(cost * this.escalator), 4);
        } else return _.round(Helpers.confirmNumber(this._data.cost), 4);
    }

    /**
     * 
     * @return {number}
     */
    _getTaxValue() {
        if (!this.isOverridden("tax")) {
            if (!this.isLabor() && this.cost > 0) {
                return _.round(Helpers.confirmNumber(this.cost * (this.taxPercent / 100)), 4);
            } else return 0;
        } else return _.round(Helpers.confirmNumber(this._data.tax));
    }

    /**
     * 
     * @return {number}
     */
    _getTaxPercentValue() {
        if (!this.isOverridden("tax_percent")) {
            var dependencyValue = this.bid.entities.getDependencyValue(this.config.dependencies.tax);
            return _.round(Helpers.confirmNumber(dependencyValue), 4);
        } else return _.round(Helpers.confirmNumber(this._data.tax_percent), 4);
    }

    /**
     * 
     * @return {number}
     */
    _getMarkupValue() {
        if (!this.isOverridden("markup")) {
            const costToMarkup = this.bid.includeTaxInMarkup() ? this.cost + this.tax : this.cost;
            return _.round(costToMarkup * (this.markupPercent / 100), 4);
        } else return _.round(Helpers.confirmNumber(this._data.markup), 4);
    }

    /**
     * 
     * @return {number}
     */
    _getMarkupPercentValue() {
        if (!this.isOverridden("markup_percent")) {
            let dependencyValue = this.bid.entities.getDependencyValue(this._data.config.dependencies.markup);

            return _.round(Helpers.confirmNumber(dependencyValue), 4);
        } else return _.round(Helpers.confirmNumber(this._data.markup_percent), 4);
    }

    /**
     * @return {number}
     */
    _getPriceValue() {
        if (!this.isOverridden("price")) {
            let price = this.cost + this.tax + this._getMarkupValue();
            return _.round(Helpers.confirmNumber(price), 4);
        } else return _.round(Helpers.confirmNumber(this._data.price), 4);
    }

    /**
     * Exports the line item's internal data structure.
     * 
     * @returns  
     */
    exportData() {
        let data = _.cloneDeep(this._data);
        if (_.isEqual(data.config, this._original.config)) delete data.config;

        return data;
    }

    /**
     * Moves line item to a new component and self removes from original component in the same {@link ComponentGroup}
     * 
     * @param {Component} component 
     */
    moveToComponent(component) {
        _.each(this.bid.entities.components(), componentToLeave => {
            if (componentToLeave.config.component_group_id === component.config.component_group_id) {
                if (_.includes(componentToLeave.config.line_items, this.id)) {
                    _.pull(componentToLeave.config.line_items, this.id);

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
        _.each(this.bid.entities.components(), component => {
            if (_.includes(component.config.line_items, this.id)) components.push(component);
        });
        return components;
    }

    /**
     * Deletes line item.
     * 
     * @returns {Promise<void>} 
     */
    async delete() {
        if (this.dependants().length === 0) {
            await this.bid._bidService.repositories.lineItems.delete(this.bid.id, this.id);
            _.each(this.components(), c => {
                c.removeLineItem(this.id);
            });

            if (this.config.assembly_id) {
                const assembly = this.bid.entities.assemblies(this.config.assembly_id);
                assembly.removeBidEntity(this.type, this.id);
            }

            delete this.bid._data.line_items[this.id];
            this.removeAllListeners();
            this.bid.assess();
            return;
        } else Promise.reject({ message: "Line item has dependants." });
    }
}
