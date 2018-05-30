import _ from "lodash";
import Helpers from "../utils/Helpers";
import BidEntity from "./BidEntity";
import { waitForFinalEvent } from "../utils/WaitForFinalEvent";

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
        super(25);
        /**
         * Reference to the bid that the component belongs to.
         * @type {Bid}
         */
        this.bid = bid;
        this._original = _.cloneDeep(componentData);
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
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.cost) {
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
     * Overrides taxable cost by proportionally distributing the component value to the included nested line items.
     * 
     * @type {number}
     */
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
     * @type {number}
     */
    get taxPercent() {
        return this._data.tax_percent;
    }

    /**
     * @type {number}
     */
    set taxPercent(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.tax_percent) {
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
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.tax_percent) {
            this._applyComponentValue("taxPercent", this._data.tax_percent, val, false);
            this.dirty();
            this.emit("updated");
        }
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
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.markup) {
            this._applyComponentValue("markup", this._data.markup, val, false);
            this.dirty();
            this.emit("updated");
        }
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
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.markup_percent) {
            this._applyComponentValue("markupPercent", this._data.markup_percent, val, false);
            this.dirty();
            this.emit("updated");
        }
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
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.labor_hours) {
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
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.price) {
            this._applyComponentValue("price", this._data.price, val, false);
            this.dirty();
            this.emit("updated");
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
        this.dirty();
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
        this.dirty();
    }

    /**
     * @type {number}
     */
    get baseAvg() {
        if (this._data.properties && this._data.properties.base_avg) {
            return this._data.properties.base_avg.value;
        } else return 0;
    }

    /**
     * @type {number}
     */
    get wageAvg() {
        if (this._data.properties && this._data.properties.wage_avg) {
            return this._data.properties.wage_avg.value;
        } else return 0;
    }

    /**
     * @type {number}
     */
    get burdenAvg() {
        if (this._data.properties && this._data.properties.burden_avg) {
            return this._data.properties.burden_avg.value;
        } else return 0;
    }

    /**
     * @type {number}
     */
    get quantityAvg() {
        if (this._data.properties && this._data.properties.per_quantity) {
            return this._data.properties.per_quantity.value;
        } else return 0;
    }

    /**
     * @type {number}
     */
    get perQuantityAvg() {
        if (this._data.properties && this._data.properties.per_quantity_avg) {
            return this._data.properties.per_quantity_avg.value;
        } else return 0;
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
     * Applies a new value to the component and assesses if there is a change.
     * 
     * @param {string} property 
     * @param {number} value 
     * @returns {boolean} Returns true if there is a change.
     */
    _apply(property, value) {
        var oldValue = _.round(this._data[property], 4);
        var newValue = _.round(Helpers.confirmNumber(value), 4);
        if (oldValue !== newValue) {
            //console.log("Component Change", property, oldValue, newValue);
            this._data[property] = Helpers.confirmNumber(value);
            this.dirty();

            return true;
        } else return false;
    }

    /**
     * Applies a new virtual property value to the component and returns true if there is a change.
     * 
     * @param {string} property 
     * @param {number} value 
     * @returns {boolean}
     */
    _applyVirtualProperty(property, value) {
        //Must check if config.properties exists due to not existing in legacy bids.
        if (_.isUndefined(this._data.properties) || _.isNull(this._data.properties)) {
            this._data.properties = {};
        }

        if (_.isUndefined(this._data.properties[property])) {
            this._data.properties[property] = {
                value: 0,
                config: {
                    data_type: "number"
                }
            };
        }

        var oldValue = _.round(this._data.properties[property].value, 4);
        var newValue = _.round(Helpers.confirmNumber(value), 4);
        if (oldValue !== newValue) {
            this._data.properties[property].value = newValue;
            this.dirty();

            return true;
        } else return false;
    }

    /**
     * Assess the component instance.
     * 
     * @emits {assessing}
     * @emits {assessed}
     * @emits {updated}
     * @param {?BidEntity} dependency  - The calling dependency.
     */
    assess(dependency) {
        if (this.bid.isAssessable()) {
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
                if (lineItem && lineItem.isIncluded) {
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

            this._applyVirtualProperty("base", base);
            this._applyVirtualProperty("burden", burden);
            this._applyVirtualProperty("wage", wage);
            this._applyVirtualProperty("quantity", quantity);
            this._applyVirtualProperty("per_quantity", perQuantity);
            this._applyVirtualProperty("included_labor_count", totalLaborLinetItems);
            this._applyVirtualProperty("included_count", totalLineItems);
            this._applyVirtualProperty("base_avg", baseAvg);
            this._applyVirtualProperty("wage_avg", wageAvg);
            this._applyVirtualProperty("burden_avg", burdenAvg);
            this._applyVirtualProperty("per_quantity_avg", perQuantityAvg);
            this._applyVirtualProperty("quantity_avg", quantityAvg);

            //FIXME: component.prediction = PredictionService.getComponentPrediction(component);
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
     * @param {number} lineItemId 
     */
    removeLineItem(lineItemId) {
        _.pull(this.config.line_items, lineItemId);
        this.dirty();
        this.assess();
    }

    /**
     * Binds the "updated" event for all dependant bid entities.
     */
    bind() {
        for (let lineItemId of this.config.line_items) {
            const lineItem = this.bid.entities.lineItems(lineItemId);
            if (lineItem) {
                lineItem.on("updated", `component.${this.id}`, (requesterId, self) => {
                    waitForFinalEvent(() => this.assess(self), 5, `bid.${this.id}.lineItem.${requesterId}`);
                });
            }
        }

        _.each(this.getSubComponents(), c => {
            c.onDelay("updated", 5, `component.${this.id}`, (requesterId, self) => {
                waitForFinalEvent(() => this.assess(self), 5, `bid.${this.id}.${requesterId}`);
            });
        });
    }

    /**
     * Gets an array of nested of subcomponents.
     * 
     * @return {Component[]}
     */
    getSubComponents() {
        var components = [];

        _.each(this.config.components, subComponentId => {
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
        } else return null;
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
        } else return 0;
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
     * Gets an array of nested line items.
     * 
     * @param  {boolean} includeSubComponents
     * @return {array} Returns an array of line items in component.
     */
    getLineItems(includeSubComponents) {
        includeSubComponents = typeof includeSubComponents === "undefined" ? false : includeSubComponents;

        let lines = [];

        for (let lineItemId of this.config.line_items) {
            var lineItem = this.bid.entities.getBidEntity("line_item", lineItemId);

            if (lineItem) lines.push(lineItem);
        }

        if (includeSubComponents) {
            for (let subComponentId of this.config.components) {
                let subComponent = this.bid.entities.components(subComponentId);
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
            var lineItems = this.getLineItems(true);

            _.each(lineItems, function(lineItem) {
                lineItem.isIncluded = isIncluded;
            });
        }
    }

    /**
     * Resets all nested line items.
     */
    reset() {
        if (this.bid.isAssessable()) {
            var lineItems = this.getLineItems(true);

            _.each(lineItems, function(lineItem) {
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

    /**
     * Exports component internal data structure.
     * 
     * @returns {object} 
     */
    exportData() {
        let data = _.cloneDeep(this._data);
        if (_.isEqual(data.config, this._original.config)) delete data.config;

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
