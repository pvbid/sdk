import _ from "lodash";
import Helpers from "../utils/Helpers";
import BidEntity from "./BidEntity";
import now from "performance-now";
import { waitForFinalEvent } from "../utils/WaitForFinalEvent";
import BidEntityRelationsHelper from "./services/BidEntityRelationsHelper";
import IndicativePricingHelper from "./services/IndicativePricingHelper";

/**
 * Bids are self assessing classes representing the totality of a bid estimate.
 * A bid contains collections of the following type of {@link BidEntity}s:
 * {@link LineItem}, {@link Metric}, {@link Field}, {@link Component}, {@link Datatable},
 * {@link Assembly}, {@link FieldGroup}, {@link ComponentGroup}.
 */
export default class Bid extends BidEntity {
    /**
     * Creates an instance of Bid.
     * @param {object} bidData
     * @param {BidService} bidService
     */
    constructor(bidData, bidService) {
        super();
        this._calcRounds = 0;
        this._data = bidData;
        this._bidService = bidService;
        this.maxEvents = 25;

        /**
         * @type {BidEntityRelationsHelper}
         */
        this.entities = new BidEntityRelationsHelper(this);
        this._indicativePricingHelper = new IndicativePricingHelper(this);
        this._wattMetricDef = null;
        this.on("assessing", `bid.${this.id}`, () => {
            if (!this._perf_start) {
                this._perf_start = now();
            }
        });
    }

    /**
     * Persistent id of the bid.
     * NOTE: id will soon be in alpha-numerical format
     *
     * @type {number}
     */

    get id() {
        return this._data.id;
    }

    /**
     * Gets the type of bid entity.
     *
     * @type {string}
     */
    get type() {
        return "bid";
    }

    /**
     * Determines if the bid is active.
     *
     * @type {boolean}
     */
    get isActive() {
        return this._data.is_active;
    }

    /**
     * Sets the bid active state.
     *
     * @type {boolean}
     */
    set isActive(val) {
        if (_.isBoolean(val) && val != this._data.is_active) {
            this._data.is_active = val;
            this.dirty();
            this.assess(this, true);
        }
    }

    /**
     * @type {number}
     */
    get laborHours() {
        return Helpers.confirmNumber(this._data.labor_hours);
    }

    /**
     * @type {number}
     */
    get cost() {
        return this._data.cost;
    }

    /**
     * Overrides bid cost. Overrides are distibuted proportionally to the included line items.
     *
     * @type {number}
     */
    set cost(val) {
        if (Helpers.isNumber(val) && !this.isReadOnly()) {
            this._data.cost = Helpers.confirmNumber(val);
            this.dirty();
            this.emit("property.updated");
        }
    }

    /**
     * Tax Property
     *
     * @type {number}
     */
    get tax() {
        return Helpers.confirmNumber(this._data.tax);
    }

    /**
     * Tax Percent Property
     *
     * @type {number}
     */
    get taxPercent() {
        return Helpers.confirmNumber(this._data.tax_percent);
    }

    /**
     * @type {number}
     */
    set taxPercent(val) {
        if (Helpers.isNumber(val) && !this.isReadOnly()) {
            this._data.tax_percent = val;
            this.dirty();
            this.emit("property.updated");
        }
    }

    /**
     * Markup Property
     *
     * @type {number}
     */
    get markup() {
        return this._data.markup;
    }

    /**
     * @type {number}
     */
    set markup(val) {
        if (Helpers.isNumber(val) && this._data.markup != Helpers.confirmNumber(val) && !this.isReadOnly()) {
            const newValue = Helpers.confirmNumber(val);
            const oldValue = Helpers.confirmNumber(this._data.markup);
            const changePercent = 1 + (newValue - oldValue) / oldValue;

            _.each(this.entities.lineItems(), lineItem => {
                if (lineItem.isIncluded) {
                    lineItem.markupPercent = lineItem.markupPercent * changePercent;
                }
            });

            this._data.markup = newValue;
            this.dirty();
            this.emit("property.updated");
        }
    }

    /**
     * @type {number}
     */
    get marginPercent() {
        return Helpers.confirmNumber(this._data.margin_percent);
    }
    /**
     * @type {number}
     */
    set marginPercent(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.margin_percent && !this.isReadOnly()) {
            this._applyMarginPercentage(val);
        }
    }

    /**
     * @type {number}
     */
    get markupPercent() {
        return Helpers.confirmNumber(this._data.markup_percent);
    }
    /**
     * @type {number}
     */
    set markupPercent(val) {
        if (Helpers.isNumber(val) && this._data.markup_percent != Helpers.confirmNumber(val) && !this.isReadOnly()) {
            this._data.markup_percent = Helpers.confirmNumber(val);
            this.dirty();
            this.emit("property.updated");
        }
    }

    /**
     * @type {number}
     */
    get price() {
        return Helpers.confirmNumber(this._data.price);
    }

    /**
     * @type {number}
     */
    set price(val) {
        if (Helpers.isNumber(val) && this._data.price != Helpers.confirmNumber(val) && !this.isReadOnly()) {
            const oldPrice = Helpers.confirmNumber(this._data.price);
            const newPrice = Helpers.confirmNumber(val);
            const changePercent = (newPrice - oldPrice) / oldPrice;

            _.each(this.entities.lineItems(), lineItem => {
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
     * @type {number}
     */
    get actualCost() {
        return this._data.actual_cost;
    }

    /**
     * @type {number}
     */
    set actualCost(val) {
        if (Helpers.confirmNumber(val, false) && !this.isReadOnly()) {
            this._data.actual_cost = val;
        }
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
        if (Helpers.confirmNumber(val, false) && !this.isReadOnly()) {
            this._data.actual_hours = val;
        }
    }

    /**
     * @type {number}
     */
    get createdAt() {
        return this._data.created_at;
    }

    /**
     * @type {number}
     */
    get updatedAt() {
        return this._data.updated_at;
    }

    /**
     * @type {number}
     */
    get watts() {
        return this._data.watts;
    }

    /**
     * Gets all the uncategorized Line Items by component group.
     *
     * @param  {number} componentGroupId     The component group id.
     * @return {LineItem[]}              Returns an array of Line Items.
     */
    getUncategorizedLineItems(componentGroupId) {
        var categorizedLineItemIds = [];
        var uncategorizedLineItems = [];

        _.each(this.entities.components(), component => {
            if (component.config.component_group_id === componentGroupId) {
                categorizedLineItemIds = _.concat(categorizedLineItemIds, component.config.line_items);
            }
        });

        _.each(this.entities.lineItems(), lineItem => {
            if (categorizedLineItemIds.indexOf(lineItem.id) < 0) {
                uncategorizedLineItems.push(lineItem);
            }
        });

        return uncategorizedLineItems;
    }

    /**
     * @deprecated use isActive property.
     */
    toggleActive() {
        this.isActive = !this.isActive;
    }

    /**
     * Gets the total watts for the bid.
     *
     * @return {number}
     */
    _getTotalWatts() {
        if (_.isNull(this._wattMetricDef)) {
            this._wattMetricDef = _.find(this.entities.metrics(), function(el) {
                return el.title.toLowerCase() === "watt" || el.title.toLowerCase() === "watts" ? true : false;
            });

            return !this._wattMetricDef ? 0 : Math.max(parseFloat(this._wattMetricDef.value), 1);
        } else return Math.max(parseFloat(this._wattMetricDef.value), 1);
    }

    /**
     * Calculates and returns the Bid Margin Percent.
     *
     * @return {number}
     */
    getMarginPercent() {
        var bidPrice = parseFloat(this.price);
        var percent = bidPrice > 0 ? parseFloat(this.markup) / bidPrice * 100 : 0;
        percent = Math.round(percent * 100) / 100;
        return percent;
    }

    /**
     * Determines if markup should also be assessed on the tax.
     *
     * @returns {boolean}
     */
    includeTaxInMarkup() {
        return this.entities.variables().markup_strategy && this.entities.variables().markup_strategy.value === true;
    }

    /**
     * Applies a user entered margin, back calcualting all line item markups to meet the margin.
     *
     * @param {number} newMarginPercent
     */
    _applyMarginPercentage(newMarginPercent) {
        let bidCost = this.cost + this.tax,
            oldMarkup = parseFloat(this.markup),
            newPrice = parseFloat(bidCost) / (1 - Helpers.confirmNumber(newMarginPercent) / 100);
        var newMarkup = newPrice - bidCost;

        if (newMarginPercent < 100) {
            this._data.margin_percent = Helpers.confirmNumber(newMarginPercent);

            var markupChangePercent = oldMarkup !== 0 ? newMarkup / oldMarkup : 1;

            _.each(this.entities.lineItems(), lineItem => {
                if (lineItem.isIncluded) {
                    lineItem.markupPercent = lineItem.markupPercent * markupChangePercent;
                }
            });

            this.dirty();
            this.emit("updated");
        } else assess();
    }

    _resetSubMargins() {
        var totalSubMargins = 0;

        if (!_.isUndefined(this.entities.variables().sub_margins)) {
            _.each(this.entities.variables().sub_margins.value, subMargin => {
                totalSubMargins += Helpers.confirmNumber(subMargin.value);
            });

            var bidMarginPercent = this.getMarginPercent();

            _.each(this.entities.variables().sub_margins.value, subMargin => {
                if (totalSubMargins > 0) {
                    subMargin.value = bidMarginPercent * Helpers.confirmNumber(subMargin.value) / totalSubMargins;
                } else {
                    subMargin.value = bidMarginPercent / this.entities.variables().sub_margins.value.length;
                }
            });
        }
    }

    /**
     * Globally resets markup on all line items in the bid.
     */
    resetMarkup() {
        if (this.isAssessable()) {
            _.each(this.entities.lineItems(), lineItem => {
                lineItem.resetMarkup();
            });
        }
    }

    /**
     * @deprecated
     */
    applySubMarginChange() {
        if (this.isAssessable()) {
            let totalSubMargins = 0;
            _.each(this.entities.variables().sub_margins.value, subMargin => {
                totalSubMargins += Heleprs.confirmNumber(subMargin.value);
            });
            this.marginPercent = totalSubMargins;
        }
    }

    /**
     * Assess bid values. If bid values changes, the bid will be flagged as dirty and an "updated" event will fire.
     *
     * @emits {assessing}
     * @emits {assessed}
     * @emits {updated}
     * @param {?BidEntity} dependency  - The calling dependency.
     * @param {?boolean} [forceUpdate] - Force fires "update" event and flags bid as dirty.
     * @memberof Bid
     */
    assess(dependency, forceUpdate) {
        if (this.isAssessable()) {
            this.emit("assessing");

            var bidValues = {
                cost: 0,
                price: 0,
                markup: 0,
                tax: 0,
                taxable_cost: 0,
                margin_percent: 0,
                labor_hours: 0,
                labor_cost: 0,
                watts: 0
            };

            _.each(this.entities.lineItems(), li => {
                if (li.isIncluded) {
                    bidValues.cost += li.cost;
                    bidValues.price += li.price;
                    bidValues.tax += li.tax;
                    bidValues.markup += li.markup;
                    if (li.isLabor()) {
                        bidValues.labor_hours += li.laborHours;
                        bidValues.labor_cost += li.cost;
                    } else {
                        bidValues.taxable_cost += li.cost;
                    }
                }
            });

            bidValues.watts = this._getTotalWatts();

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
                this._calcRounds += 1;
                this.dirty();
                this.emit("updated");
            }

            this.emit("assessed");
        }
    }

    /**
     * Reassess all {@link LineItem}s, {@link Fields}s, {@link Metrics}s, and {@ linkComponents}s.
     * This function checks {@link Bid.needsReassessment} first, to determine if reassessment is necessary.
     * Use the force flag to reasses reguardless of necessity.
     *
     * @param {boolean} forceReassessment
     */
    reassessAll(forceReassessment) {
        if (this.isAssessable()) {
            if (forceReassessment || this.needsReassessment()) {
                //console.log("Start Bid  Reassessment", "Bid: ", this.id);

                for (let f of Object.values(this.entities.fields())) {
                    f.assess();
                }
                for (let m of Object.values(this.entities.metrics())) {
                    m.assess();
                }
                for (let li of Object.values(this.entities.lineItems())) {
                    li.assess();
                }
                for (let c of Object.values(this.entities.components())) {
                    c.assess();
                }
            }
        }
    }

    /**
     * Analyzes line items and components calculations.  If the sum up correctly
     * to match the bid, reassessment is considered unnecessary.
     *
     * @returns {boolean}
     */
    needsReassessment() {
        let totalLineItemCosts = 0,
            totalLineItemPrice = 0,
            needsReassesment = this.price === 0 ? true : false;

        if (!needsReassesment) {
            _.each(this.entities.components(), (c, k) => {
                if (!needsReassesment) {
                    needsReassesment = this._componentNeedsReassessment(c);
                } else return false;
            });
        }

        if (!needsReassesment) {
            _.each(this.entities.lineItems(), lineItem => {
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
     * @param {Component} component - The component to determine if needs reassessment.
     * @returns {boolean}
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
     * Removes all event listeners for the bid entities in a bid.
     * It does not remove any event listeners for the bid itself.
     */
    clearEntityBindings() {
        for (let f of Object.values(this.entities.fields())) {
            f.removeAllListeners();
        }
        for (let m of Object.values(this.entities.metrics())) {
            m.removeAllListeners();
        }
        for (let li of Object.values(this.entities.lineItems())) {
            li.removeAllListeners();
        }
        for (let c of Object.values(this.entities.components())) {
            c.removeAllListeners();
        }
    }

    /**
     * Binds all interconnected bid entity "update" events
     */
    bind() {
        if (this.isAssessable()) {
            for (let f of Object.values(this.entities.fields())) {
                f.bind();
                f.on("assessed", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
            }
            for (let m of Object.values(this.entities.metrics())) {
                m.bind();
                m.on("assessed", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
            }
            for (let li of Object.values(this.entities.lineItems())) {
                li.bind();
                li.on("assessed", "line_item." + li.id, () => {
                    waitForFinalEvent(() => this.assess(), 15, `bid.${this.id}.line_item`);
                });
                li.on("assessed", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
            }
            for (let c of Object.values(this.entities.components())) {
                c.bind();
                c.on("assessed", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
            }

            this.on("assessed", `bid.${this.id}`, () => this._handleAssessmentCompleteEvent());
        }
    }

    /**
     * @listens {assessed}
     */
    _handleAssessmentCompleteEvent() {
        waitForFinalEvent(
            () => {
                this._perf_end = now();

                //console.log(`Bid Assessment Time (id ${this.id})`, (this._perf_start - this._perf_end).toFixed(3)); // ~ 0.002 on my system
                //console.log("Maxed events used", this._calcRounds);
                this._calcRounds = 0;

                this._perf_start = null;
                this.emit(`bid.assessments.completed`);
            },
            100,
            `bid.${this.id}.assessments.completed`
        );
    }

    /**
     * Gets the margin of error for indicative pricing.
     *
     * @return {number}
     */
    getMarginOfError() {
        return this._indicativePricingHelper.getMarginOfError();
    }

    /**
     * Gets indicative price
     *
     * @param {number} value The value to assess.
     * @param {boolean} isLow The lower or upper bounds (low | high)
     * @return {number}
     */
    getIndicativePrice(value, isLow) {
        return this._indicativePricingHelper.getIndicativePrice(value, isLow);
    }

    /**
     * Determines if indicative pricing is enabled.
     *
     * @return {boolean}
     */
    isIndicativePricing() {
        return this._indicativePricingHelper.isIndicativePricing();
    }

    /**
     * Exports the bid's data to an object.
     *
     * @returns {object}
     * @property {number} id NOTE: id will soon be in UUID format.
     * @property {string} title
     * @property {number} cost
     * @property {number} taxable_cost
     * @property {number} labor_cost
     * @property {number} labor_hours
     * @property {number} price
     * @property {number} margin_percent
     * @property {number} markup
     * @property {number} markup_percent
     * @property {number} tax
     * @property {number} tax_percent
     * @property {number} price
     * @property {number} actual_cost
     * @property {number} actual_hours
     * @property {number} watts
     * @property {boolean} is_active
     * @property {boolean} is_locked
     * @property {string} created_at
     * @property {string} updated_at
     */
    exportData() {
        const blacklist = [
            "line_items",
            "fields",
            "components",
            "metrics",
            "component_groups",
            "assemblies",
            "assembly_maps",
            "field_groups",
            "datatables",
            "variables"
        ];

        let bidToClone = this._omit(this._data, blacklist);

        let bid = _.cloneDeep(bidToClone);
        bid.variables = {};

        _.each(this.entities.variables(), (value, key) => {
            bid.variables[key] = value.exportData();
        });

        return bid;
    }

    /**
     * Returns new shallow copy of object with omitted properties
     *
     * @param {*} obj
     * @param {*} blacklist
     * @returns {object}
     */
    _omit(obj, blacklist) {
        let keys = Object.keys(obj);
        let copy = {};
        keys.forEach(key => {
            if (blacklist.indexOf(key) < 0) {
                copy[key] = obj[key];
            }
        });

        return copy;
    }

    /**
     * Marks bid and all bid entities as clean.
     */
    pristine() {
        this._is_dirty = false;
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
            _.each(this.entities[prop](), item => {
                item.pristine();
            });
        });
    }

    /**
     * Creates a snapshot of current Bid data.
     *
     * @param {?string} title
     * @param {?string} description
     * @returns {Promise.<object>} Returns a data object of the snapshot.
     * @property {number} id The snapshot id.
     * @property {string} title
     * @property {number} bid_id
     * @property {string} description
     * @property {boolean} is_auto A flag to indicate the snapshot was generated automatically by the PVBid system.
     * @property {string} created_at Example format: 2016-04-11T21:08:05+00:00
     */
    async createSnapshot(title, description) {
        return this._bidService.createSnapshot(this, title, description);
    }

    /**
     * Determines if bid is in an "assessable" state. Factors include if the bid is as shell bid,
     * if the bid is in read only mode, and if the bid has no validation issues.
     *
     * @returns {boolean}
     */
    isAssessable() {
        return !this.isShell() && !this.isReadOnly() && this.isValid();
    }

    /**
     * Determines if is a shell bid. Shell bids are simple data stores for past bids
     * that can not be assesed. Shell bids do not have line items. Typically shell
     * bids are created to import old bid data prior a companies using PVBid.
     *
     * @returns {boolean}
     */
    isShell() {
        return this._data.is_shell;
    }

    /**
     * Determines if bid is updateable by the user.
     * This method is deprecated. Use {@link Bid.isReadOnly} instead.
     *
     * @deprecated
     * @returns {boolean}
     */
    isUpdateable() {
        return !this.isReadOnly();
    }

    /**
     * Determines if bid can be modified by the user.
     * Considers if the bid is locked, if the project is closed, and the user permissions.
     *
     * @returns {boolean}
     */
    isReadOnly() {
        //TODO: add in user permission logic.
        return this.isLocked() || !_.isNull(this.project.closedAt) || !this._bidService.context.user.can("edit-bid");
    }

    /**
     * Determines if the bid is locked.
     *
     * @returns {boolean}
     */
    isLocked() {
        return this._data.is_locked;
    }

    /**
     * Determines if bid can be locked by user.
     *
     * @returns {boolean}
     */
    canLock() {
        return (
            !this.isLocked() &&
            (this._bidService.context.user.hasRole("admin") ||
                (this._bidService.context.user.can("edit-bid") &&
                    this.project.hasUser(this._bidService.context.user.id)))
        );
    }

    /**
     * Determines if bid can be unlocked by user.
     *
     * @returns {boolean}
     */
    canUnlock() {
        return (
            this.isLocked() &&
            (this._bidService.context.user.hasRole("admin") ||
                (this._bidService.context.user.can("edit-bid") &&
                    this.project.hasUser(this._bidService.context.user.id)))
        );
    }

    /**
     * Locks bid, forcing read-only mode for everyone.  Bid must be unlocked before it can be modified again.
     * This function immediately saves the bid.
     *
     * @returns {Promise<null>}
     */
    async lock() {
        if (this.canLock()) {
            this._data.is_locked = true;
            this.dirty();
            return this.project.save();
        }
        return Promise.reject();
    }

    /**
     * Unlocks bid, making it writable for those with permission.
     * This function immediately saves the bid.
     *
     * @returns {Promise<null>}
     */
    async unlock() {
        if (this.canUnlock()) {
            this._data.is_locked = false;
            this.dirty();
            this.bind();
            return this.project.save();
        }
    }

    /**
     * Removes assembly from a bid. A wrapper function for {@link BidService.removeAssembly}
     *
     * @param {number} assemblyId
     * @returns {Promise<null>}
     */
    async removeAssembly(assemblyId) {
        return this._bidService.removeAssembly(this, assemblyId);
    }

    /**
     * Adds assemblies to bid. A wrapper function for {@link BidService.addAssemblies}
     *
     * @param {number[]} assemblyMapIds An array of assembly mapping ids to add.
     * @returns {Promise<null>}
     */
    async addAssemblies(assemblyMapIds) {
        this._wattMetricDef = null; //clears cached reference due to bug.
        return this._bidService.addAssemblies(this, assemblyMapIds);
    }

    /**
     * Recovers bid to previous snapshot. An auto snapshot of the current state will be created.
     * This is a wrapper function for {@link BidService.recoverBid}
     *
     * @param {number} snapshotId
     * @returns {Promise<null>}
     */
    async recover(snapshotId) {
        return this._bidService.recoverBid(this, snapshotId);
    }

    /**
     * Clones the current bid and returns the cloned bid.  The cloned bid is also added to the project automatically.
     *
     * @returns {Promise<Bid>}
     */
    async clone() {
        return this._bidService.clone(this);
    }

    /**
     * Determines if bid has valid dependency references and configurations..
     *
     * @returns {boolean}
     */
    isValid() {
        if (_.isUndefined(this.validationResults)) {
            this.validate();
            return this.validationResults.length === 0;
        } else return this.validationResults.length === 0;
    }

    /**
     * Validates bid and returns a resultset of issues, if exists.
     *
     * @returns {object[]}
     */
    validate() {
        return (this.validationResults = this._bidService.validate(this));
    }

    /**
     * Deletes bid. Wrapper function for {@link BidService.deleteBid}
     *
     * @returns {Promise<null>}
     */
    async delete() {
        return this._bidService.deleteBid(this);
    }

    /**
     * Adds a new line item to the bid.  The added line item is uncategorized in all component groups.
     * This is a wrapper function for {@link BidService.addLineItem}
     *
     * @param {string} [title=New Line Item]
     * @returns {Promise<LineItem>}
     */
    async addLineItem(title) {
        return this._bidService.addLineItem(this, title);
    }

    /**
     * Adds a new metric to the bid.
     * This is a wrapper function for {@link BidService.addMetric}
     *
     * @param {string} [title=New Metric]
     * @returns {Promise<Metric>}
     */
    async addMetric(title) {
        return this._bidService.addMetric(this, title);
    }

    /**
     * Adds a new field to the bid.
     * This is a wrapper function for {@link BidService.addField}
     *
     * @param {string} [title=New Field]
     * @param {string} [type=number]
     * @returns {Promise<Field>}
     */
    async addField(title, type) {
        return this._bidService.addField(this, title, type);
    }

    /**
     * Flags all fields, metrics, lineItems, and components as dirty.
     */
    dirtyAll() {
        _.each(this.entities.fields(), f => {
            f.dirty();
        });
        _.each(this.entities.metrics(), m => {
            m.dirty();
        });
        _.each(this.entities.lineItems(), li => {
            li.dirty();
        });
        _.each(this.entities.components(), c => {
            c.dirty();
        });
    }
}
