import _ from "lodash";
import BidEntity from "./BidEntity";
import Helpers from "../Helpers";
import { waitForFinalEvent } from "../helpers/WaitForFinalEvent";

export default class Component extends BidEntity {
    constructor(componentData, bid) {
        super(25);
        this.bid = bid;
        this._original = Object.assign({}, componentData);
        this._data = componentData;
    }

    get id() {
        return this._data.id;
    }
    set id(val) {
        throw "Changing component id is not permitted.";
    }
    get type() {
        return "component";
    }

    get title() {
        return this._data.title;
    }
    set title(val) {
        this._data.title = val;
    }
    get cost() {
        return this._data.cost;
    }
    set cost(val) {
        this._data.cost = val;
    }
    get taxableCost() {
        return this._data.taxable_cost;
    }
    set taxableCost(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.taxable_cost = val;
        }
    }

    get taxPercent() {
        return this._data.tax_percent;
    }
    set taxPercent(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.tax_percent = val;
        }
    }

    get tax() {
        return this._data.tax;
    }
    set tax(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.tax = val;
        }
    }

    get markup() {
        return this._data.markup;
    }
    set markup(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.markup = val;
        }
    }

    get markupPercent() {
        return this._data.markup_percent;
    }
    set markupPercent(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.markup_percent = val;
        }
    }

    get laborHours() {
        return this._data.labor_hours;
    }
    set laborHours(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.labor_hours = val;
        }
    }

    get laborCost() {
        return this._data.labor_cost;
    }
    set laborCost(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.labor_cost = val;
        }
    }

    get nonLaborCost() {
        return this._data.non_labor_cost;
    }
    set nonLaborCost(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.non_labor_cost = val;
        }
    }

    get price() {
        return this._data.price;
    }
    set price(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.price = val;
        }
    }

    get config() {
        return this._data.config;
    }
    set config(val) {
        throw "Setting component config is not permitted.";
    }

    get actualCost() {
        return this._data.actual_cost;
    }
    set actualCost(val) {
        this._data.actual_cost = val;
    }

    get actualHours() {
        return this._data.actual_hours;
    }
    set actualHours(val) {
        this._data.actual_hours = val;
    }

    get definitionId() {
        return this._data.definition_id;
    }

    compare() {
        return {
            cost: _.round(this._original.cost - this._data.cost, 4),
            price: _.round(this._original.price - this._data.price, 4),

            labor_hours: _.round(this._original.labor_hours - this._data.labor_hours, 4)
        };
    }

    _apply(property, value, isChanged) {
        var originalVal = _.round(this._data[property], 4);
        var confirmedVal = _.round(Helpers.confirmNumber(value), 4);
        if (originalVal !== confirmedVal) {
            this._data[property] = Helpers.confirmNumber(value);
            this.is_dirty = true;

            return true;
        } else {
            return isChanged;
        }
    }

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

        _.each(this.config.line_items, lineItemId => {
            var lineItem = this.bid.lineItems(lineItemId);
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

        _.each(this.config.components, subComponentId => {
            var subComponent = this.bid.components(subComponentId);
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

        isChanged = this._apply("cost", cost, isChanged);
        isChanged = this._apply("price", price, isChanged);
        isChanged = this._apply("taxable_cost", taxableCost, isChanged);
        isChanged = this._apply("tax", tax, isChanged);
        isChanged = this._apply("markup", markup, isChanged);
        isChanged = this._apply("tax_percent", taxPercent, isChanged);
        isChanged = this._apply("markup_percent", markupPercent, isChanged);
        isChanged = this._apply("base", base, isChanged);
        isChanged = this._apply("base_avg", baseAvg, isChanged);
        isChanged = this._apply("wage", wage, isChanged);
        isChanged = this._apply("wage_avg", wageAvg, isChanged);
        (isChanged = this._apply("burden", burden)), isChanged;
        isChanged = this._apply("burden_avg", burdenAvg, isChanged);

        isChanged = this._apply("quantity", quantity, isChanged);
        isChanged = this._apply("quantity_avg", quantityAvg, isChanged);

        isChanged = this._apply("per_quantity", perQuantity, isChanged);
        isChanged = this._apply("per_quantity_avg", perQuantityAvg, isChanged);

        isChanged = this._apply("non_labor_cost", nonLaborCosts, isChanged);
        isChanged = this._apply("labor_hours", laborHours, isChanged);
        isChanged = this._apply("labor_cost", laborCosts, isChanged);
        isChanged = this._apply("included_labor_count", totalLaborLinetItems, isChanged);
        isChanged = this._apply("included_count", totalLineItems, isChanged);

        //component.prediction = PredictionService.getComponentPrediction(component);
        if (isChanged) this.emit("updated");

        this.emit("assessment.complete");
    }

    bind() {
        for (let lineItemId of this.config.line_items) {
            const lineItem = this.bid.lineItems(lineItemId);

            lineItem.on("updated", this.id, requesterId => {
                waitForFinalEvent(() => this.assess(), 5, `bid.${this.id}.component.lineItem.${requesterId}`);
            });
        }
        for (let componentId of this.config.components) {
            this.bid.components(componentId).on("updated", "component." + this.id, requesterId => {
                waitForFinalEvent(() => this.assess(), 5, `bid.${this.id}.component.${requesterId}`);
            });
        }
    }

    /**
     * Gets a list of sub-components based on the parent id.
     * @param  {int} componentId The parent component id to retrieve the sub-component.
     * @return {array}           Returns an array of sub-components.
     */
    getSubComponents() {
        var components = [];

        _.each(this.config.components, subComponentId => {
            components.push(this.bid.components(subComponentId));
        });

        return components;
    }

    /**
     * Gets an array of nested line items.
     * @param  {boolean} includeSubComponents
     * @return {array} Returns an array of line items in component.
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
}
