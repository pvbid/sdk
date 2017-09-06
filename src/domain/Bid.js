import _ from "lodash";
import Helpers from "../Helpers";
import BidEntity from "./BidEntity";
import now from "performance-now";
import { waitForFinalEvent } from "../helpers/WaitForFinalEvent";
import BidModelRelationsHelper from "../helpers/BidModelRelationsHelper";
import IndicativePricingHelper from "../helpers/IndicativePricingHelper";

export default class Bid extends BidEntity {
    constructor(bidData) {
        super();
        this._data = bidData;
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

    get id() {
        return this._data.id;
    }
    get title() {
        return this._data.title;
    }
    set title(val) {
        this._data.title = val;
    }

    get type() {
        return "bid";
    }

    get isActive() {
        return this._data.is_active;
    }

    set isActive(val) {
        this._data.is_active = val;
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
            this.emit("property.updated");
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

            this.emit("property.updated");
        }
    }

    /**
     * Markup Property
     */
    get markup() {
        return this._data.markup;
    }
    set markup(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.markup = Helpers.confirmNumber(val);

            this.emit("property.updated");
        }
    }

    get marginPercent() {
        return this._data.margin_percent;
    }

    /**
     * Markup Percent Property
     */
    get markupPercent() {
        return Helpers.confirmNumber(this._data.markup_percent);
    }
    set markupPercent(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.markup_percent = Helpers.confirmNumber(val);

            this.emit("property.updated");
        }
    }

    /**
     * Price Property
     */
    get price() {
        return Helpers.confirmNumber(this._data.price);
    }
    set price(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.price = val;

            this.emit("property.updated");
        }
    }

    get watts() {
        return this._data.watts;
    }

    set watts(val) {
        throw "Watts property can not be set.";
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
        return this.relations.getBidEntity("line_item", id);
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

    components(id) {
        return id ? this.relations.getBidEntity("component", id) : this._data.components;
    }

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
     * @return {int}
     */
    getTotalWatts() {
        if (_.isNull(this._wattMetricDef)) {
            this._wattMetricDef = _.find(this.metrics(), function(el) {
                return el.title.toLowerCase() === "watt" || el.title.toLowerCase() === "watts" ? true : false;
            });

            return this._wattMetricDef ? 0 : Math.max(parseFloat(this._wattMetricDef.value), 1);
        } else return Math.max(parseFloat(this._wattMetricDef.value), 1);
    }

    /**
     * Calculates and returns the Bid Margin Percent.
     * @return {int}    Returns the margin percent.
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

           TODO relocate logic
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

        this.emit("assessment.complete");
    }

    reassessAll(forceReassessment) {
        console.log("Start Bid  Reassessment", "Bid: ", this.id);

        if (forceReassessment || this.needsReassessment()) {
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

        totalLineItemCosts = _.round(totalLineItemCosts, 2);
        totalLineItemPrice = _.round(totalLineItemPrice, 2);

        return needsReassesment ||
        _.round(this.price, 2) !== totalLineItemPrice ||
        _.round(this.cost, 2) != totalLineItemCosts
            ? true
            : false;
    }

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

        totalLineItemCosts = _.round(totalLineItemCosts, 2);
        totalLineItemPrice = _.round(totalLineItemPrice, 2);

        return _.round(component.price, 2) !== totalLineItemPrice || _.round(component.cost, 2) != totalLineItemCosts
            ? true
            : false;
    }

    bind() {
        for (let f of Object.values(this.fields())) {
            f.bind();
            f.on("assessment.complete", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
        }
        for (let m of Object.values(this.metrics())) {
            m.bind();
            m.on("assessment.complete", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
        }
        for (let li of Object.values(this.lineItems())) {
            li.bind();
            li.on("updated", "line_item." + li.id, () => {
                waitForFinalEvent(() => this.assess(), 15, `bid.${this.id}.line_item`);
            });
            li.on("assessment.complete", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
        }
        for (let c of Object.values(this.components())) {
            c.bind();
            c.on("assessment.complete", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
        }

        this.on("assessment.complete", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
    }

    _handleAssessmentCompleteEvent() {
        waitForFinalEvent(
            () => {
                this._perf_end = now();

                //console.log("Assessments Finished.", "Bid Id:", this.id);
                // console.log(this._perf_start.toFixed(3)); // the number of milliseconds the current node process is running
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
     * @return {int}
     */
    getMarginOfError() {
        return this._indicativePricingHelper.getMarginOfError();
    }

    /**
     * Gets indicative price
     * @param {float} value The value to assess.
     * @param {string} bounds The lower or upper bounds (low | high)
     * @return {int}
     */
    getIndicativePrice(value, isLow) {
        return this._indicativePricingHelper.getIndicativePrice(value, isLow);
    }

    /**
     * Determines if indicative pricing is enabled.
     * @return {boolean}
     */
    isIndicativePricing() {
        return this._indicativePricingHelper.isIndicativePricing();
    }
}
