import _ from "lodash";
import Helpers from "../Helpers";
import BidEntity from "./BidEntity";
import LineItemRuleService from "../LineItemRuleService";

export default class LineItem extends BidEntity {
    constructor(entityData, bid) {
        super();
        this._original = Object.assign({}, entityData);
        this._data = entityData;
        this.bid = bid;
        this._ruleService = new LineItemRuleService(this);
        this.is_dirty = false;
        this.onDelay("property.updated", 5, "self", () => this.assess(true));
    }

    get id() {
        return this._data.id;
    }
    set id(val) {
        throw "Changing line item id is not permitted.";
    }

    get title() {
        return this._data.title;
    }
    set title(val) {
        this._data.title = val;
    }

    get type() {
        return this._data.type;
    }
    set type(val) {
        throw "Unable to change type.";
    }

    /**
     * Base Property
     */
    get base() {
        return Helpers.confirmNumber(this._data.base);
    }
    set base(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.base = Helpers.confirmNumber(val);
            this.override("base", true);
            this.emit("property.updated");
        }
    }

    /**
     * Wage Property
     */
    get wage() {
        return Helpers.confirmNumber(this._data.wage);
    }
    set wage(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.wage = val;
            this.override("wage", true);
            this.emit("property.updated");
        }
    }

    /**
     * Is Included Property
     */
    get isIncluded() {
        return this._data.is_included;
    }
    set isIncluded(val) {
        this._data.is_included = val;
        this.override("is_included", true);
        this.emit("property.updated");
    }

    /**
     * Labor Hours Property
     */
    get laborHours() {
        return Helpers.confirmNumber(this._data.labor_hours);
    }
    set laborHours(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.labor_hours = val;
            this.override("labor_hours", true);
            this.emit("property.updated");
        }
    }

    /**
     * Burden Property
     */
    get burden() {
        return Helpers.confirmNumber(this._data.burden);
    }
    set burden(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.burden = val;
            this.override("burden", true);
            this.emit("property.updated");
        }
    }

    /**
     * Scalar Property
     */
    get scalar() {
        const scalarContracts = this._getExtraScalarDependencies();

        let valueMap = {};

        _.each(scalarContracts, (dependencyContract, key) => {
            valueMap[key.charAt(7)] = Helpers.confirmNumber(
                this.bid.relations.getDependencyValue(dependencyContract),
                0,
                true
            );
        });

        var xScalarValue = this.bid.relations.getDependencyValue(this.config.dependencies.scalar);
        valueMap.x = Helpers.confirmNumber(xScalarValue, 1, true);

        const results = Helpers.calculateFormula(this.config.formula, valueMap);
        return Helpers.confirmNumber(results, 1);
    }
    set scalar(val) {
        throw "Setting line item scalar property not permitted";
    }

    /**
     * Per Quantity Property
     */
    get perQuantity() {
        return Helpers.confirmNumber(this._data.per_quantity);
    }
    set perQuantity(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.per_quantity = value;
            this.override("per_quantity", true);
            this.emit("property.updated");
        }
    }

    /**
     * Escalator Property
     */
    get escalator() {
        return Helpers.confirmNumber(this._data.escalator, 1);
    }
    set escalator(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.escalator = val;
            setOverride("escalator", true);
            this.emit("property.updated");
        }
    }

    /**
     * Quantity Property
     */
    get quantity() {
        return Helpers.confirmNumber(this._data.quantity);
    }
    set quantity(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.quantity = value;
            this.override("quantity", true);
            this.emit("property.updated");
        }
    }

    get multiplier() {
        return this._data.multiplier;
    }
    set multiplier(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.multiplier = val;
            this.override("multiplier", true);
        }
    }
    /**
     * Cost Property
     */
    get cost() {
        return this._data.cost;
    }
    set cost(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.cost = val;
            this._data.escalator = 1;
            this.override("cost", true);
            this.override("escalator", true);

            this._applyCostChange();
            this.emit("property.updated");
        }
    }

    /**
     * Tax Property
     */
    get tax() {
        return Helpers.confirmNumber(this._data.tax);
    }
    set tax(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.tax = val;
            this.override("tax", true);
            this.override("tax_percent", true);

            this._data.tax_percent = this.cost > 0 ? Helpers.confirmNumber(this.tax / this.cost) * 100 : 0;

            if (this.bid.includeTaxInMarkup()) {
                this.markup = Helpers.confirmNumber(this.cost + this.tax) * (this.markupPercent / 100);
            } else calculate(lineItem);
        }
    }

    /**
     * Tax Percent Property
     */
    get taxPercent() {
        return Helpers.confirmNumber(this._data.tax_percent);
    }
    set taxPercent(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.tax_percent = val;
            this.override("tax_percent", true);
            this._applyTaxPercentChange();
            this.emit("property.updated");
        }
    }

    /**
     * Markup Property
     */
    get markup() {
        let markup = this.bid.includeTaxInMarkup() ? this.cost + this.tax : this.cost;
        markup = markup * (this.markupPercent / 100);

        return (this._data.markup = Helpers.confirmNumber(markup));
    }
    set markup(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.markup = __.round(Helpers.confirmNumber(val), 4);
            this.override("markup", true);
            this._applyMarkupChange();
            this.emit("property.updated");
        }
    }

    /**
     * Markup Percent Property
     */
    get markupPercent() {
        return _.round(Helpers.confirmNumber(this._data.markup_percent), 4);
    }
    set markupPercent(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.markup_percent = _.round(Helpers.confirmNumber(val), 4);
            this.override("markup_percent", true);
            this.emit("property.updated");
        }
    }

    /**
     * Price Property
     */
    get price() {
        return _.round(Helpers.confirmNumber(this._data.price), 4);
    }
    set price(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.price = val;
            this.override("price", true);
            this._applyPriceChange();
            this.emit("property.updated");
        }
    }

    /**
     * Config Property
     */
    get config() {
        return this._data.config;
    }
    set config(val) {
        throw "Setting line item config is not permitted";
    }

    /**
     * Gets Subtotal aka Initial Results.
     * @return {[type]}      [description]
     */
    get subtotal() {
        return Helpers.confirmNumber(parseFloat(this.quantity) * parseFloat(this.perQuantity) + parseFloat(this.base));
    }

    override(property, value) {
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

    isOverridden(property) {
        return (
            !_.isUndefined(this._data.config.overrides) &&
            !_.isUndefined(this._data.config.overrides[property]) &&
            this._data.config.overrides[property] === true
        );
    }

    resetProperty(property) {
        if (!_.isUndefined(this._data.config.overrides) && !_.isUndefined(this._data.config.overrides[property])) {
            delete this._data.config.overrides[property];
            this.emit("property.updated", property);
        }
    }

    isLabor() {
        return this._data.config.type === "labor";
    }

    calculate() {}

    exportData() {
        return Object.assign({}, this._data);
    }

    compare() {
        return {
            cost: _.round(this._original.cost - this._data.cost, 4),
            price: _.round(this._original.price - this._data.price, 4),
            //markup_percent: _.round(this._original.markup_percent - this._data.markup_percent, 4),
            //tax_percent: _.round(this._original.tax_percent - this._data.tax_percent, 4),
            base: _.round(this._original.base - this._data.base, 4),
            labor_hours: _.round(this._original.labor_hours - this._data.labor_hours, 4),
            quantity: _.round(this._original.quantity - this._data.quantity, 4),
            per_quantity: _.round(this._original.per_quantity - this._data.per_quantity, 7)
            //  base: _.round(this._original.base - this._data.base, 4),
            //labor_hours: _.round(this._original.labor_hours - this._data.labor_hours, 4)
        };
    }

    assess(forceUpdate) {
        this.bid.emit("assessing");
        var isChanged = false;
        isChanged = this._applyProperty("base", this._getBaseValue()) || isChanged;
        isChanged = this._applyProperty("burden", this._getBurdenValue()) || isChanged;
        isChanged = this._applyProperty("wage", this._getWageValue()) || isChanged;
        isChanged = this._applyProperty("quantity", this._getQuantityValue()) || isChanged;
        isChanged = this._applyProperty("per_quantity", this._getPerQuantityValue()) || isChanged;
        isChanged = this._applyProperty("escalator", this._getEscalatorValue()) || isChanged;
        isChanged = this._applyProperty("markup", this._getMarkupValue()) || isChanged;
        isChanged = this._applyProperty("markup_percent", this._getMarkupPercentValue()) || isChanged;
        isChanged = this._applyProperty("tax", this._getTaxValue()) || isChanged;
        isChanged = this._applyProperty("tax_percent", this._getTaxPercentValue()) || isChanged;
        isChanged = this._applyProperty("cost", this._getCostValue()) || isChanged;
        isChanged = this._applyProperty("price", this._getPriceValue()) || isChanged;
        isChanged = this._applyProperty("is_included", this._getIsIncludedValue()) || isChanged;

        if (isChanged || forceUpdate) this.emit("updated");
        this.emit("assessment.complete");
    }

    bind() {
        this._bindLineItemDependencies();
        this._bindLineItemRuleDependencies();
        this._bindLineItemPredictionDependencies();
    }

    _bindLineItemDependencies() {
        for (let dependencyContract of Object.values(this.config.dependencies)) {
            if (!_.isEmpty(dependencyContract)) {
                let dependency = this.bid.relations.getDependency(dependencyContract);
                if (dependency) {
                    dependency.on("updated", `line_item.${this.id}`, () => this.assess());
                }
            }
        }
    }

    _bindLineItemRuleDependencies() {
        for (let rule of Object.values(this.config.rules)) {
            if (rule.dependencies) {
                for (let dependencyContract of Object.values(rule.dependencies)) {
                    if (!_.isEmpty(dependencyContract)) {
                        let dependency = this.bid.relations.getDependency(dependencyContract);
                        if (dependency) {
                            dependency.on("updated", `line_item.${this.id}`, () => this.assess());
                        }
                    }
                }
            }
        }
    }

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

    _applyProperty(property, value) {
        let oldValue = !_.isBoolean(value) ? _.round(this._data[property], 4) : this._data[property];
        let newValue = !_.isBoolean(value) ? _.round(value, 4) : value;

        if (oldValue != newValue) {
            //console.log("li changed", property, oldValue, newValue);

            this._data[property] = value;
            return true;
        } else return false;
    }

    _applyMarkupChange() {
        if (this.bid.includeTaxInMarkup()) {
            this.markupPercent = _.round(Helpers.confirmNumber(this.markup / (this.cost + this.tax)) * 100, 4);
        } else {
            this.markupPercent = _.round(Helpers.confirmNumber(this.markup / this.cost) * 100, 4);
        }
    }

    _reverseComputeLaborHours(cost, wage, burden) {
        let wageBurden = parseFloat(wage) + parseFloat(burden);
        return Helpers.confirmNumber(parseFloat(cost) / wageBurden);
    }

    /**
     * Internal method to calcualte a Unit price change.
    */
    _applyPriceChange() {
        if (this.cost === 0) {
            const taxMarkupRate = (this.taxPercent + this.markupPercent) / 100;
            const newCost = Helpers.confirmNumber(this.price / (1 + taxMarkupRate));

            this.base = this.isLabor() ? this._reverseComputeLaborHours(newCost, this.wage, this.burden) : newCost;
        } else {
            const markupChange = this.price - (this.cost + this.tax + this.markup);
            this.markup = Helpers.confirmNumber(this.markup + markupChange);
        }
    }

    /**
     * Internal method that recalculates a line item cost change.
     */
    _applyCostChange() {
        var lineItemSubtotal = this.subtotal;

        if (lineItemSubtotal > 0) {
            if (this.isLabor()) {
                var laborHours = this._reverseComputeLaborHours(this.cost, this.wage, this.burden);
                this._data.multiplier = Helpers.confirmNumber(laborHours / lineItemSubtotal, 1);
            } else {
                this._data.multiplier = Helpers.confirmNumber(parseFloat(this.cost) / lineItemSubtotal, 1);
            }
        } else {
            //If original subtotal was zero, simply apply the  intended total to the base.
            if (this.isLabor()) {
                this.base = this._reverseComputeLaborHours(this.cost, this.wage, this.burden);
            } else {
                this.base = this.cost;
            }

            this._data.multiplier = 1;
        }
    }

    _applyTaxPercentChange() {
        this._data.tax = this.cost * this.taxPercent;

        if (this.bid.includeTaxInMarkup()) {
            this.markup = Helpers.confirmNumber(this.cost + this.tax) * (this.markupPercent / 100);
        }
    }

    _getExtraScalarDependencies() {
        return _.pickBy(this.config.dependencies, function(el, key) {
            return key.indexOf("scalar_") === 0;
        });
    }

    /**
     * Base Property
     */
    _getBaseValue() {
        if (!this.isOverridden("base")) {
            if (!_.isUndefined(this._data.config.base)) {
                return _.round(Helpers.confirmNumber(this._data.config.base), 4);
            } else return 0;
        } else return this._data.base;
    }

    /**
     * Wage Property
     */
    _getWageValue() {
        if (!this.isOverridden("wage")) {
            var dependencyValue = this.bid.relations.getDependencyValue(this.config.dependencies.wage);
            return _.round(Helpers.confirmNumber(dependencyValue), 4);
        } else return _.round(Helpers.confirmNumber(this._data.wage), 4);
    }

    /**
     * Is Included Property
     */
    _getIsIncludedValue() {
        if (!this.isOverridden("is_included")) {
            return this._ruleService.isIncluded(this);
        } else return this._data.is_included;
    }

    /**
     * Labor Hours Property
     */
    _getLaborHoursValue() {
        if (!this.isOverridden("labor_hours")) {
            let hours = this.isLabor() ? (this.quantity * this.perQuantity + this.base) * this.multiplier : 0;
            return _.round(Helpers.confirmNumber(hours), 4);
        } else return _.round(Helpers.confirmNumber(this._data.labor_hours), 4);
    }

    /**
     * Burden Property
     */
    _getBurdenValue() {
        if (!this.isOverridden("burden")) {
            var dependencyValue = this.bid.relations.getDependencyValue(this.config.dependencies.burden);
            return Helpers.confirmNumber(dependencyValue);
        } else return Helpers.confirmNumber(this._data.burden);
    }

    /**
     * Scalar Property
     */
    _getScalarValue() {
        const scalarContracts = this._getExtraScalarDependencies();

        let valueMap = {};

        _.each(scalarContracts, (dependencyContract, key) => {
            valueMap[key.charAt(7)] = Helpers.confirmNumber(
                this.bid.relations.getDependencyValue(dependencyContract),
                0,
                true
            );
        });

        var xScalarValue = this.bid.relations.getDependencyValue(this.config.dependencies.scalar);
        valueMap.x = Helpers.confirmNumber(xScalarValue, 1, true);

        const results = Helpers.calculateFormula(this.config.formula, valueMap);
        return _.round(Helpers.confirmNumber(results, 1), 7);
    }

    /**
     * Per Quantity Property
     */
    _getPerQuantityValue() {
        if (!this.isOverridden("per_quantity")) {
            var val = 0;

            if (this.config.per_quantity.type === "value") {
                val = this.config.per_quantity.value;
            } else {
                val = this.bid.relations.getDependencyValue(this.config.dependencies.per_quantity);
            }

            var scaledPerQuantity = Helpers.confirmNumber(val) * this.scalar;

            return _.round(Helpers.confirmNumber(scaledPerQuantity), 4);
        } else return _.round(Helpers.confirmNumber(this._data.per_quantity), 4);
    }

    /**
     * Escalator Property
     */
    _getEscalatorValue() {
        if (!this.isOverridden("escalator")) {
            var dependencyValue = this.bid.relations.getDependencyValue(this.config.dependencies.escalator);
            return _.round(Helpers.confirmNumber(dependencyValue, 1), 4);
        } else return _.round(Helpers.confirmNumber(this._data.escalator, 1), 4);
    }

    /**
     * Quantity Property
     */
    _getQuantityValue() {
        if (!this.isOverridden("quantity")) {
            let val = 0;

            if (this.config.quantity.type === "value") {
                val = this.config.quantity.value;
            } else {
                val = this.bid.relations.getDependencyValue(this.config.dependencies.quantity);
            }
            return _.round(Helpers.confirmNumber(val), 4);
        } else return _.round(Helpers.confirmNumber(this._data.quantity), 4);
    }

    /**
     * Cost Property
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
     * Tax Property
     */
    _getTaxValue() {
        if (!this.isOverridden("tax")) {
            if (!this.isLabor() && this.cost > 0) {
                return _.round(Helpers.confirmNumber(this.cost * (this.taxPercent / 100)), 4);
            } else return 0;
        } else return _.round(Helpers.confirmNumber(this._data.tax));
    }

    /**
     * Tax Percent Property
     */
    _getTaxPercentValue() {
        if (!this.isOverridden("tax_percent")) {
            var dependencyValue = this.bid.relations.getDependencyValue(this.config.dependencies.tax);
            return _.round(Helpers.confirmNumber(dependencyValue), 4);
        } else return _.round(Helpers.confirmNumber(this._data.tax_percent), 4);
    }

    /**
     * Markup Property
     */
    _getMarkupValue() {
        let costToMarkup = this.bid.includeTaxInMarkup() ? this.cost + this.tax : this.cost;
        let markup = costToMarkup * (this.markupPercent / 100);

        return _.round(Helpers.confirmNumber(markup), 4);
    }

    /**
     * Markup Percent Property
     */
    _getMarkupPercentValue() {
        if (!this.isOverridden("markup_percent")) {
            let dependencyValue = this.bid.relations.getDependencyValue(this._data.config.dependencies.markup);

            return _.round(Helpers.confirmNumber(dependencyValue), 4);
        } else return _.round(Helpers.confirmNumber(this._data.markup_percent), 4);
    }

    /**
     * Price Property
     */
    _getPriceValue() {
        if (!this.isOverridden("price")) {
            let price = this.cost + this.tax + this._getMarkupValue();
            return _.round(Helpers.confirmNumber(price), 4);
        } else return _.round(Helpers.confirmNumber(this._data.price), 4);
    }
}
