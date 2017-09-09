import _ from "lodash";
import Helpers from "../Helpers";
import BidEntity from "./BidEntity";
import now from "performance-now";
import { waitForFinalEvent } from "../helpers/WaitForFinalEvent";
import BidModelRelationsHelper from "../helpers/BidModelRelationsHelper";
import IndicativePricingHelper from "../helpers/IndicativePricingHelper";

/**
 * Bid Class.
 * 
 * @export
 * @class Bid
 * @memberof module:PVBid/Domain
 * @extends {module:PVBid/Domain.BidEntity}
 */
export default class Bid extends BidEntity {
    constructor(bidData, bidService) {
        super();
        this._data = bidData;
        this._bidService = bidService;
        this.maxEvents = 15;
        this.relations = new BidModelRelationsHelper(this);
        this._indicativePricingHelper = new IndicativePricingHelper(this);
        this._wattMetricDef = null;
        this.on("assessing", `bid.${this.id}`, () => {
            if (!this._perf_start) {
                this._perf_start = now();
            }
        });
    }

    /**
     * Gets the type of bid entity.
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     * @readonly
     */
    get type() {
        return "bid";
    }

    /**
     * Determines if the bid is active.
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     */
    get isActive() {
        return this._data.is_active;
    }

    set isActive(val) {
        if (_.isBoolean(val) && val != this._data.is_active) {
            this._data.is_active = val;
            this.dirty();
            this.assess(true);
        }
    }

    /**
     * Labor Hours Property
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     */
    get laborHours() {
        return Helpers.confirmNumber(this._data.labor_hours);
    }
    set laborHours(val) {
        if (Helpers.isNumber(val) && this._data.labor_hours != Helpers.confirmNumber(val)) {
            this._data.labor_hours = Helpers.confirmNumber(val);
            this.dirty();
            this.emit("property.updated");
        }
    }

    /**
     * Cost Property
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     */
    get cost() {
        return this._data.cost;
    }
    set cost(val) {
        if (Helpers.isNumber(val)) {
            this._data.cost = Helpers.confirmNumber(val);
            this.dirty();
            this.emit("property.updated");
        }
    }

    /**
     * Tax Property
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     */
    get tax() {
        return Helpers.confirmNumber(this._data.tax);
    }
    set tax(val) {
        if (Helpers.isNumber(val)) {
            this._data.tax = val;
        }
    }

    /**
     * Tax Percent Property
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     */
    get taxPercent() {
        return Helpers.confirmNumber(this._data.tax_percent);
    }
    set taxPercent(val) {
        if (Helpers.isNumber(val)) {
            this._data.tax_percent = val;
            this.dirty();
            this.emit("property.updated");
        }
    }

    /**
     * Markup Property
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     */
    get markup() {
        return this._data.markup;
    }
    set markup(val) {
        if (Helpers.isNumber(val) && this._data.markup != Helpers.confirmNumber(val)) {
            const newValue = Helpers.confirmNumber(val);
            const oldValue = Helpers.confirmNumber(this._data.markup);
            const changePercent = 1 + (newValue - oldValue) / oldValue;

            _.each(this.lineItems(), lineItem => {
                if (lineItem.isIncluded && lineItem.price > 0) {
                    lineItem.markupPercent = lineItem.markupPercent * changePercent;
                }
            });

            this._data.markup = newValue;
            this.dirty();
            this.emit("property.updated");
        }
    }

    /**
     * 
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     */
    get marginPercent() {
        return Helpers.confirmNumber(this._data.margin_percent);
    }
    set marginPercent(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.margin_percent) {
            this._applyMarginPercentage(val);
        }
    }

    /**
     * Markup Percent Property
     */
    get markupPercent() {
        return Helpers.confirmNumber(this._data.markup_percent);
    }
    set markupPercent(val) {
        if (Helpers.isNumber(val) && this._data.margin_percent != val) {
            this._data.markup_percent = Helpers.confirmNumber(val);
            this.dirty();
            this.emit("property.updated");
        }
    }

    /**
     * Price Property
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     */
    get price() {
        return Helpers.confirmNumber(this._data.price);
    }
    set price(val) {
        if (Helpers.isNumber(val) && this._data.price != Helpers.confirmNumber(val)) {
            const oldPrice = Helpers.confirmNumber(this._data.price);
            const newPrice = Helpers.confirmNumber(val);
            const changePercent = (newPrice - oldPrice) / oldPrice;

            _.each(this.lineItems(), lineItem => {
                if (lineItem.isIncluded && lineItem.price > 0) {
                    lineItem.price = lineItem.price * (1 + changePercent);
                }
            });

            this._data.price = newPrice;
            this.dirty();
            this.emit("property.updated");
        }
    }

    /**
     * Actual Cost Property
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     */
    get actualCost() {
        return this._data.actual_cost;
    }
    set actualCost(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.actual_cost = val;
        }
    }

    /**
     * Actual Cost Property
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     */
    get actualHours() {
        return this._data.actual_hours;
    }
    set actualHours(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.actual_hours = val;
        }
    }

    /**
     * 
     * 
     * @readonly
     * @instance
     * @memberof module:PVBid/Domain.Bid
     */
    get watts() {
        return this._data.watts;
    }

    fields(id) {
        return id ? this.relations.getBidEntity("field", id) : this._data.fields;
    }

    fieldGroups(id) {
        return id ? this.relations.getBidEntity("field_group", id) : this._data.field_groups;
    }

    metrics(id) {
        return id ? this.relations.getBidEntity("metric", id) : this._data.metrics;
    }

    lineItems(id) {
        return id ? this.relations.getBidEntity("line_item", id) : this._data.line_items;
    }

    datatables(id) {
        return id ? this.relations.getBidEntity("datatable", id) : this._data.datatables;
    }

    assemblies(id) {
        return id ? this.relations.getBidEntity("assembly", id) : this._data.assemblies;
    }

    variables(id) {
        return id ? this.relations.getBidEntity("bid_variable", id) : this._data.variables;
    }

    /**
     * Gets a component entity by id.  If no id is passed, will return an object of keyed components.
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     * @param {number=} id - The id of the component to retrieve.
     * @returns {(module:PVBid/Domain.Component|Object.<string, module:PVBid/Domain.Component>|null)}
     */
    components(id) {
        return id ? this.relations.getBidEntity("component", id) : this._data.components;
    }

    /**
     * Gets a component group entity by id.  If no id is passed, will return an of object of keyed component groups.
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     * @param {number} id 
     * @returns {(module:PVBid/Domain.ComponentGroup|Object.<string, module:PVBid/Domain.ComponentGroup>|null)}
     */
    componentGroups(id) {
        return id ? this.relations.getBidEntity("component_group", id) : this._data.component_groups;
    }

    assemblyMaps(id) {
        return id ? this.relations.getBidEntity("assembly_map", id) : this._data.assembly_maps;
    }

    toggleActive() {
        this._data.is_active = !this._data.is_active;
        this.assess(true);
    }

    /**
     * Gets the total watts for the bid.
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     * @return {number}
     */
    getTotalWatts() {
        if (_.isNull(this._wattMetricDef)) {
            this._wattMetricDef = _.find(this.metrics(), function(el) {
                return el.title.toLowerCase() === "watt" || el.title.toLowerCase() === "watts" ? true : false;
            });

            return !this._wattMetricDef ? 0 : Math.max(parseFloat(this._wattMetricDef.value), 1);
        } else return Math.max(parseFloat(this._wattMetricDef.value), 1);
    }

    /**
     * Calculates and returns the Bid Margin Percent.
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     * @return {number}    Returns the margin percent.
     */
    getMarginPercent() {
        var bidPrice = parseFloat(this.price);
        var percent = bidPrice > 0 ? parseFloat(this.markup) / bidPrice * 100 : 0;
        percent = Math.round(percent * 100) / 100;
        return percent;
    }
    isShell() {
        return this._data.is_shell;
    }

    isUpdateable() {
        return !this._data.is_locked && _.isNull(this.project.closedAt);
    }

    isLocked() {
        return this._data.is_locked;
    }

    canLock() {
        // TODO: needs additional logic for user permissions.
        return !this.isLocked();
    }
    canUnlock() {
        return this.isLocked();
    }
    lock() {
        if ($this.canLock()) {
            this._data.is_locked = true;
            this.is_dirty = true;
            this.emit("property.updated");
        }
    }
    unlock() {
        if ($this.canUnlock()) {
            this._data.is_locked = false;
            this.is_dirty = true;
            this.emit("property.updated");
        }
    }

    includeTaxInMarkup() {
        return this.variables().markup_strategy && this.variables().markup_strategy.value === true;
    }

    _applyMarginPercentage(newMarginPercent) {
        var bidCost = this.cost + this.tax;

        let oldMarkup = parseFloat(this.markup),
            newPrice = parseFloat(bidCost) / (1 - Heleprs.confirmNumber(newMarginPercent) / 100);
        var newMarkup = newPrice - bidCost;

        if (newMarginPercent < 100) {
            this._data.margin_percent = Helpers.confirmNumber(newMarginPercent);

            var markupChangePercent = oldMarkup !== 0 ? newMarkup / oldMarkup : 1;

            _.each(this.lineItems(), lineItem => {
                if (lineItem.isIncluded && lineItem.cost > 0) {
                    lineItem.markupPercent = lineItem.markupPercent * markupChangePercent;
                }
            });

            this.dirty();
            this.emit("updated");
        } else assess();
    }

    _resetSubMargins() {
        var totalSubMargins = 0;

        if (!_.isUndefined(this.variables.sub_margins)) {
            _.each(this.variables().sub_margins.value, function(subMargin) {
                totalSubMargins += Helpers.confirmNumber(subMargin.value);
            });

            var bidMarginPercent = this.getMarginPercent();

            _.each(this.variables().sub_margins.value, function(subMargin) {
                if (totalSubMargins > 0) {
                    subMargin.value = bidMarginPercent * Helpers.confirmNumber(subMargin.value) / totalSubMargins;
                } else {
                    subMargin.value = bidMarginPercent / this.variables().sub_margins.value.length;
                }
            });
        }
    }

    resetMarkup() {
        _.each(this.lineItems(), lineItem => {
            lineItem.resetMarkup();
        });
    }

    applySubMarginChange() {
        let totalSubMargins = 0;
        _.each(this.variables().sub_margins.value, subMargin => {
            totalSubMargins += Heleprs.confirmNumber(subMargin.value);
        });
        this.marginPercent = totalSubMargins;
    }

    /**
     * Assess bid values. If bid values changes, the bid will be flagged as dirty and an "updated" event will fire.
     * 
     * @fires module:PVBid/Domain.BidEntity#assessing
     * @fires module:PVBid/Domain.BidEntity#event:assessed
     * @fires module:PVBid/Domain.BidEntity#updated
     * @instance
     * @param {boolean} [forceUpdate] - Force fires "update" event and flags bid as dirty.
     * @memberof module:PVBid/Domain.Bid
     */
    assess(forceUpdate) {
        this.emit("assessing");

        var bidValues = {
            cost: 0,
            price: 0,
            markup: 0,
            tax: 0,
            margin_percent: 0,
            labor_hours: 0,
            labor_cost: 0,
            watts: 0
        };

        _.each(this.lineItems(), function(li) {
            if (li.isIncluded) {
                bidValues.cost += li.cost;
                bidValues.price += li.price;
                bidValues.tax += li.tax;
                bidValues.markup += li.markup;
                if (li.isLabor()) {
                    bidValues.labor_hours += li.laborHours;
                    bidValues.labor_cost += li.cost;
                }
            }
        });

        bidValues.watts = this.getTotalWatts();

        bidValues.margin_percent = bidValues.price > 0 ? bidValues.markup / bidValues.price * 100 : 0;

        bidValues.margin_percent = Math.round(bidValues.margin_percent * 100) / 100;

        var isChanged = false;

        _.each(bidValues, (value, key) => {
            const roundPoint = ["price", "cost"].indexOf(key) >= 0 ? 1 : 3;
            var originalVal = _.round(Helpers.confirmNumber(this._data[key]), roundPoint);
            var updatedVal = _.round(Helpers.confirmNumber(value), roundPoint);

            if (originalVal !== updatedVal) {
                this._data[key] = _.round(Helpers.confirmNumber(value), 4);
                isChanged = true;
            }
        });
        this._resetSubMargins();

        //TODO: Fix prediction assignment
        //this.bid.prediction = PredictionService.getBidPrediction();

        if (isChanged || forceUpdate) {
            this.is_dirty = true;

            this.emit("updated");
            /*

           //TODO: relocate logic
            if (this.bid.is_active) {
                _.each(this.bid.project.bids, function(projectBid) {
                    if (projectBid.id === BidRepository.bid().id) {
                        _.each(BidRepository.bid(), function(value, key) {
                            if (!isObject(value) && !isArray(value)) {
                                projectBid[key] = value;
                            }
                        });
                    }
                });
                _projectService.calculate();
            }
            */

            //console.log("markup", this.markup, "price", this.price);
            //BidEventService.trigger("bid.bid");
        }

        this.emit("assessed");
    }

    reassessAll(forceReassessment) {
        if (forceReassessment || this.needsReassessment()) {
            console.log("Start Bid  Reassessment", "Bid: ", this.id);

            for (let f of Object.values(this.fields())) {
                f.assess();
            }
            for (let m of Object.values(this.metrics())) {
                m.assess();
            }
            for (let li of Object.values(this.lineItems())) {
                li.assess();
            }
        }
    }

    needsReassessment() {
        let totalLineItemCosts = 0,
            totalLineItemPrice = 0,
            needsReassesment = this.price === 0 ? true : false;

        if (!needsReassesment) {
            _.each(this.components(), (c, k) => {
                if (!needsReassesment) {
                    needsReassesment = this._componentNeedsReassessment(c);
                } else return false;
            });
        }

        if (!needsReassesment) {
            _.each(this.lineItems(), lineItem => {
                if (lineItem.isIncluded) {
                    totalLineItemCosts += lineItem.cost;
                    totalLineItemPrice += lineItem.price;
                }
            });
        }

        totalLineItemCosts = _.floor(totalLineItemCosts, 0);
        totalLineItemPrice = _.floor(totalLineItemPrice, 0);

        return needsReassesment ||
        _.floor(this.price, 0) !== totalLineItemPrice ||
        _.floor(this.cost, 0) != totalLineItemCosts
            ? true
            : false;
    }

    /**
     * Determines if components need to be reassessed by comparing bid results.
     * 
     * @param {module:PVBid/Domain.Component} component - The component to determine if needs reassessment.
     * @returns {boolean}
     * @memberof module:PVBid/Domain.Bid
     * @instance
     * @private
     */
    _componentNeedsReassessment(component) {
        var totalLineItemCosts = 0,
            totalLineItemPrice = 0;

        _.each(component.getLineItems(true), lineItem => {
            if (lineItem) {
                if (lineItem.isIncluded) {
                    totalLineItemCosts += lineItem.cost;
                    totalLineItemPrice += lineItem.price;
                }
            } else throw "Line item not found during component reassessment check.";
        });

        totalLineItemCosts = _.floor(totalLineItemCosts, 1);
        totalLineItemPrice = _.floor(totalLineItemPrice, 1);

        return _.floor(component.price, 1) !== totalLineItemPrice || _.floor(component.cost, 1) != totalLineItemCosts
            ? true
            : false;
    }

    /**
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     */
    bind() {
        for (let f of Object.values(this.fields())) {
            f.bind();
            f.on("assessed", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
        }
        for (let m of Object.values(this.metrics())) {
            m.bind();
            m.on("assessed", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
        }
        for (let li of Object.values(this.lineItems())) {
            li.bind();
            li.on("updated", "line_item." + li.id, () => {
                waitForFinalEvent(() => this.assess(), 15, `bid.${this.id}.line_item`);
            });
            li.on("assessed", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
        }
        for (let c of Object.values(this.components())) {
            c.bind();
            c.on("assessed", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
        }

        this.on("assessed", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
    }

    /**
     * 
     * @instance
     * @private
     * @memberof module:PVBid/Domain.Bid
     */
    _handleAssessmentCompleteEvent() {
        waitForFinalEvent(
            () => {
                this._perf_end = now();

                console.log(`Bid Assessment Time (id ${this.id})`, (this._perf_start - this._perf_end).toFixed(3)); // ~ 0.002 on my system

                this._perf_start = null;
                this.emit(`bid.assessments.completed`);
            },
            500,
            `bid.${this.id}.assessments.completed`
        );
    }

    /**
     * Gets the margin of error for indicative pricing.
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     * @return {number}
     */
    getMarginOfError() {
        return this._indicativePricingHelper.getMarginOfError();
    }

    /**
     * Gets indicative price
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     * @param {float} value The value to assess.
     * @param {string} bounds The lower or upper bounds (low | high)
     * @return {number}
     */
    getIndicativePrice(value, isLow) {
        return this._indicativePricingHelper.getIndicativePrice(value, isLow);
    }

    /**
     * Determines if indicative pricing is enabled.
     * @instance
     * @memberof module:PVBid/Domain.Bid
     * @return {boolean}
     */
    isIndicativePricing() {
        return this._indicativePricingHelper.isIndicativePricing();
    }

    /**
     * 
     * @instance
     * @returns {object}
     * @memberof module:PVBid/Domain.Bid
     */
    exportData() {
        let bid = Object.assign({}, this._data);
        delete bid.line_items;
        delete bid.fields;
        delete bid.components;
        delete bid.metrics;
        delete bid.component_groups;
        delete bid.assemblies;
        delete bid.assembly_maps;
        delete bid.field_groups;
        delete bid.datatables;
        bid.variables = {};

        _.each(this.variables(), (value, key) => {
            bid.variables[key] = value.exportData();
        });

        return bid;
    }

    /**
     * Marks bid and all bid entities as clean.
     * 
     * @instance
     * @memberof module:PVBid/Domain.Bid
     */
    pristine() {
        this.is_dirty = false;
        const properties = [
            "lineItems",
            "fields",
            "components",
            "metrics",
            "assemblies",
            "fieldGroups",
            "componentGroups",
            "datatables"
        ];

        _.each(properties, prop => {
            _.each(this[prop](), item => {
                item.is_dirty = false;
            });
        });
    }
}
