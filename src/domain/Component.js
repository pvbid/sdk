import _ from "lodash";
import Helpers from "../Helpers";
import BidEntity from "./BidEntity";
import { waitForFinalEvent } from "../helpers/WaitForFinalEvent";

/**
 * @param {object} componentData - structured component data
 * @param {module:PVBid/Domain.Bid} bid - The bid in which the component belongs to.
 * @export
 * @class Component
 * @memberof module:PVBid/Domain
 * @extends {module:PVBid/Domain.BidEntity}
 */
export default class Component extends BidEntity {
    constructor(componentData, bid) {
        super(25);
        this.bid = bid;
        this._original = Object.assign({}, componentData);
        this._data = componentData;
    }

    /**
     * The summed cost from the nested line items.
     * 
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    get cost() {
        return this._data.cost;
    }
    set cost(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.cost) {
            this._applyComponentValue("cost", this._data.cost, val, false);
            this.dirty();
            this.emit("updated");
        }
    }

    /**
     * The summed taxable cost from the nested line items.
     * 
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    get taxableCost() {
        return this._data.taxable_cost;
    }
    set taxableCost(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.taxable_cost) {
            this._applyComponentValue("taxableCost", this._data.taxable_cost, val, false);
            this.dirty();
            this.emit("updated");
        }
    }

    /**
    * The average tax percentage from the nested line items.
    * 
    * @memberof module:PVBid/Domain.Component
    * @instance
    */
    get taxPercent() {
        return this._data.tax_percent;
    }
    set taxPercent(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.tax_percent) {
            this._applyComponentValue("taxPercent", this._data.tax_percent, val, false);
            this.dirty();
            this.emit("updated");
        }
    }

    /**
     * Tax Property
     * 
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    get tax() {
        return this._data.tax;
    }
    set tax(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.tax_percent) {
            this._applyComponentValue("taxPercent", this._data.tax_percent, val, false);
            this.dirty();
            this.emit("updated");
        }
    }

    /**
     * Markup Property
     * 
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    get markup() {
        return this._data.markup;
    }
    set markup(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.markup) {
            this._applyComponentValue("markup", this._data.markup, val, false);
            this.dirty();
            this.emit("updated");
        }
    }

    /**
     * Markup Percent Property
     * 
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    get markupPercent() {
        return this._data.markup_percent;
    }
    set markupPercent(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.markup_percent) {
            this._applyComponentValue("markupPercent", this._data.markup_percent, val, false);
            this.dirty();
            this.emit("updated");
        }
    }

    /**
     * Labor Hours Property
     * 
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    get laborHours() {
        return this._data.labor_hours;
    }
    set laborHours(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.labor_hours) {
            this._applyComponentValue("laborHours", this._data.labor_hours, val, false);
            this.dirty();
            this.emit("updated");
        }
    }

    /**
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    get laborCost() {
        return this._data.labor_cost;
    }
    set laborCost(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.labor_cost) {
            this._applyComponentValue("laborCost", this._data.labor_cost, val, false);
            this.dirty();
            this.emit("updated");
        }
    }

    /**
     * Non Labor Cost Property
     * 
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    get nonLaborCost() {
        return this._data.non_labor_cost;
    }
    set nonLaborCost(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.non_labor_cost) {
            this._applyComponentValue("nonLaborCost", this._data.non_labor_cost, val, false);
            this.dirty();
            this.emit("updated");
        }
    }

    /**
     * Price Property
     * 
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    get price() {
        return this._data.price;
    }
    set price(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.price) {
            this._applyComponentValue("price", this._data.price, val, false);
            this.dirty();
            this.emit("updated");
        }
    }

    /**
     * Config Property
     * 
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    get config() {
        return this._data.config;
    }
    set config(val) {
        throw "Setting component config is not permitted.";
    }

    /**
     * Actual Cost Property
     * 
     * @memberof module:PVBid/Domain.Component
     */
    get actualCost() {
        return this._data.actual_cost;
    }
    set actualCost(val) {
        this._data.actual_cost = val;
        this.dirty();
    }

    /**
     * Actual Hours Property
     * 
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    get actualHours() {
        return this._data.actual_hours;
    }
    set actualHours(val) {
        this._data.actual_hours = val;
        this.dirty();
    }

    /**
     * Definition Id Property
     * 
     * @readonly
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    get definitionId() {
        return this._data.definition_id;
    }

    /**
     * Applies a new value to the component and assesses if there is a change.
     * 
     * @private
     * @param {string} property 
     * @param {number} value 
     * @returns {boolean} Returns true if there is a change.
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    _apply(property, value) {
        var oldValue = _.round(this._data[property], 4);
        var newValue = _.round(Helpers.confirmNumber(value), 4);
        if (oldValue !== newValue) {
            this._data[property] = Helpers.confirmNumber(value);
            this.dirty();

            return true;
        } else return false;
    }

    /**
     * Assess the component instance.
     * 
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    assess() {
        var isChanged = false;

        let cost = 0,
            taxableCost = 0,
            price = 0,
            markup = 0,
            tax = 0,
            base = 0,
            laborHours = 0,
            totalLineItems = 0,
            totalLaborLinetItems = 0,
            wage = 0,
            burden = 0,
            quantity = 0,
            perQuantity = 0,
            laborCosts = 0,
            nonLaborCosts = 0;

        _.each(this.getLineItems(), lineItem => {
            if (!_.isNull(lineItem) && lineItem.isIncluded) {
                totalLineItems += 1;
                if (lineItem.isLabor()) {
                    totalLaborLinetItems += 1;
                    laborCosts += lineItem.cost;
                    laborHours += lineItem.laborHours;
                } else {
                    nonLaborCosts += lineItem.cost;
                    taxableCost += lineItem.cost;
                }

                cost += lineItem.cost;
                price += lineItem.price;
                markup += lineItem.markup;
                tax += lineItem.tax;
                base += lineItem.base;
                wage += lineItem.wage;
                burden += lineItem.burden;
                quantity += lineItem.quantity;
                perQuantity += lineItem.perQuantity;
            }
        });

        _.each(this.getSubComponents(), subComponent => {
            subComponent.assess();
            cost += Helpers.confirmNumber(subComponent.cost);
            price += Helpers.confirmNumber(subComponent.price);
            markup += Helpers.confirmNumber(subComponent.markup);
            tax += Helpers.confirmNumber(subComponent.tax);
            taxableCost += Helpers.confirmNumber(subComponent.taxableCost);
            laborHours += Helpers.confirmNumber(subComponent.laborHours);
            laborCosts += Helpers.confirmNumber(subComponent.laborCost);
            nonLaborCosts += Helpers.confirmNumber(subComponent.nonLaborCost);
            base += Helpers.confirmNumber(subComponent._data.base);
            wage += Helpers.confirmNumber(subComponent._data.wage);
            burden += Helpers.confirmNumber(subComponent._data.burden);
            quantity += Helpers.confirmNumber(subComponent._data.quantity);
            perQuantity += Helpers.confirmNumber(subComponent._data.per_quantity);
            totalLineItems += Helpers.confirmNumber(subComponent._data.included_count);
            totalLaborLinetItems += Helpers.confirmNumber(subComponent._data.included_labor_count);
        });

        var markupPercent = 0;
        if (this.bid.includeTaxInMarkup()) {
            var adjCost = cost + tax;
            markupPercent = adjCost > 0 ? markup / adjCost * 100 : 0;
        } else {
            markupPercent = cost > 0 ? markup / cost * 100 : 0;
        }

        var taxPercent = taxableCost > 0 ? tax / taxableCost * 100 : 0;
        var baseAvg = totalLineItems > 0 ? base / totalLineItems : 0;
        var wageAvg = totalLaborLinetItems > 0 ? wage / totalLaborLinetItems : 0;
        var burdenAvg = totalLaborLinetItems > 0 ? burden / totalLaborLinetItems : 0;
        var quantityAvg = totalLineItems > 0 ? quantity / totalLineItems : 0;
        var perQuantityAvg = totalLineItems > 0 ? perQuantity / totalLineItems : 0;

        isChanged = isChanged || this._apply("cost", cost);
        isChanged = isChanged || this._apply("price", price);
        isChanged = isChanged || this._apply("taxable_cost", taxableCost);
        isChanged = isChanged || this._apply("tax", tax);
        isChanged = isChanged || this._apply("markup", markup);
        isChanged = isChanged || this._apply("tax_percent", taxPercent);
        isChanged = isChanged || this._apply("markup_percent", markupPercent);
        isChanged = isChanged || this._apply("base", base);
        isChanged = isChanged || this._apply("base_avg", baseAvg);
        isChanged = isChanged || this._apply("wage", wage);
        isChanged = isChanged || this._apply("wage_avg", wageAvg);
        isChanged = isChanged || this._apply("burden", burden);
        isChanged = isChanged || this._apply("burden_avg", burdenAvg);
        isChanged = isChanged || this._apply("quantity", quantity);
        isChanged = isChanged || this._apply("quantity_avg", quantityAvg);
        isChanged = isChanged || this._apply("per_quantity", perQuantity);
        isChanged = isChanged || this._apply("per_quantity_avg", perQuantityAvg);
        isChanged = isChanged || this._apply("non_labor_cost", nonLaborCosts);
        isChanged = isChanged || this._apply("labor_hours", laborHours);
        isChanged = isChanged || this._apply("labor_cost", laborCosts);
        isChanged = isChanged || this._apply("included_labor_count", totalLaborLinetItems);
        isChanged = isChanged || this._apply("included_count", totalLineItems);

        //FIXME: component.prediction = PredictionService.getComponentPrediction(component);
        if (isChanged) this.emit("updated");

        this.emit("assessed");
    }

    /**
     * Binds the "updated" event for all dependant bid entities.
     * 
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    bind() {
        for (let lineItemId of this.config.line_items) {
            const lineItem = this.bid.lineItems(lineItemId);

            lineItem.on("updated", `component.${this.id}`, requesterId => {
                waitForFinalEvent(() => this.assess(), 5, `bid.${this.id}.lineItem.${requesterId}`);
            });
        }

        _.each(this.getSubComponents(), c => {
            c.onDelay("updated", 5, `component.${this.id}`, requesterId => {
                waitForFinalEvent(() => this.assess(), 5, `bid.${this.id}.${requesterId}`);
            });
        });
    }

    /**
     * Gets a list of sub-components based on the parent id.
     * @param  {int} componentId The parent component id to retrieve the sub-component.
     * @return {array}           Returns an array of sub-components.
     * @instance
     */
    getSubComponents() {
        var components = [];

        _.each(this.config.components, subComponentId => {
            components.push(this.bid.components(subComponentId));
        });

        return components;
    }

    /**
     * Gets the component's parent component, if exists.
     * 
     * @returns {?PVBid/Domain.Component} Returns the parent component or null value.
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    getParent() {
        if (this.config.is_nested) {
            return this.bid.components(this.config.parent_component_id);
        } else return null;
    }

    /**
     * Gets the level at which the component is nested: 0, 1, 2.
     * 
     * @returns {number}
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    getNestedLevel() {
        const parent = this.getParent();
        if (parent) {
            return parent.config.is_nested ? 2 : 1;
        } else return 0;
    }

    /**
     * Determines of component is a top parent component, in which is not nested.
     * 
     * @returns {boolean}
     * @instance
     * @memberof module:PVBid/Domain.Component
     */
    isParent() {
        return !this.config.is_nested;
    }

    /**
     * Gets an array of nested line items.
     * 
     * @param  {boolean} includeSubComponents
     * @return {array} Returns an array of line items in component.
     * @instance
     */
    getLineItems(includeSubComponents) {
        includeSubComponents = typeof includeSubComponents === "undefined" ? false : includeSubComponents;

        let lines = [];

        for (let lineItemId of this.config.line_items) {
            var lineItem = this.bid.relations.getBidEntity("line_item", lineItemId);

            if (!_.isNull(lineItem)) {
                lines.push(lineItem);
            }
        }

        if (includeSubComponents) {
            for (let subComponentId of this.config.components) {
                let subComponent = this.bid.components(subComponentId);
                lines = lines.concat(subComponent.getLineItems(includeSubComponents));
            }
        }

        return lines;
    }

    /**
     * Sets the include status for all nested line items.
     * 
     * @param {boolean} isIncluded 
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    setIncludeStatus(isIncluded) {
        var lineItems = this.getLineItems(true);

        _.each(lineItems, function(lineItem) {
            lineItem.isIncluded = isIncluded;
        });
    }

    /**
     * Resets all nested line items.
     * 
     * @memberof module:PVBid/Domain.Component
     * @instance
     */
    reset() {
        var lineItems = this.getLineItems(true);

        _.each(lineItems, function(lineItem) {
            lineItem.reset();
        });
    }

    /**
     * Applies the component value change to the nested line items. 
     * 
     * @private
     * @param {string} property 
     * @param {number} oldValue 
     * @param {number} newValue 
     * @param {boolean} overrideAllLineItems 
     * @memberof module:PVBid/Domain.Component
     */
    _applyComponentValue(property, oldValue, newValue, overrideAllLineItems) {
        newValue = Helpers.confirmNumber(newValue);

        var lineItems = this.getLineItems(true);
        var includedLineItemsOnly = _.filter(lineItems, function(li) {
            return li.isIncluded;
        });

        lineItems = includedLineItemsOnly.length === 0 || overrideAllLineItems ? lineItems : includedLineItemsOnly;

        for (var i = 0; i < lineItems.length; i++) {
            if (["markupPercent", "taxPercent"].indexOf(property) >= 0 && parseFloat(oldValue) === 0) {
                lineItems[i][property] = newValue;
            } else {
                if (Helpers.confirmNumber(oldValue) !== 0) {
                    var ratio = newValue / Helpers.confirmNumber(oldValue);
                    lineItems[i][property] = Helpers.confirmNumber(parseFloat(lineItems[i][property]) * ratio);
                } else {
                    lineItems[i][property] = newValue / lineItems.length;
                }
            }
        }
    }
}
