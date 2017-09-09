import isUndefined from "lodash/isUndefined";
import each from "lodash/each";
import Helpers from "../Helpers";
import BidEntity from "./BidEntity";
import now from "performance-now";
import { waitForFinalEvent } from "../helpers/WaitForFinalEvent";

/**
 * Project Class
 * 
 * @export
 * @class Project
 * @memberof module:PVBid/Domain
 * @extends {module:PVBid/Domain.BidEntity}
 */
export default class Project extends BidEntity {
    /**
     * Creates an instance of Project.
     * @param {object} entityData 
     */
    constructor(entityData) {
        super();
        this._original = Object.assign({}, entityData);
        this._data = entityData;
        this._propertiesToSum = ["price", "cost", "tax", "markup", "watts", "labor_hours"];
        this.is_dirty = false;
        this.on("assessing", `project.${this.id}`, () => {
            if (!this._perf_start) this._perf_start = now();
        });
        this.onDelay("property.updated", 5, "self", this.assess);
    }

    get title() {
        return this._data.title;
    }
    set title(val) {
        this._data.title = val;
        this.is_dirty = true;
    }

    get type() {
        return "project";
    }

    get bids() {
        return this._data.bids;
    }
    set bids(val) {
        this._data.bids = val;
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
            this.emit("property.updated");
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

    /**
     * Margin Property
     */
    get margin() {
        return this._data.margin;
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

    get createdAt() {
        return this._data.created_at;
    }

    get updatedAt() {
        return this._data.updated_at;
    }

    get closedAt() {
        return this._data.closed_at;
    }

    get reconciledAt() {
        return this._data.reconciled_at;
    }

    get watts() {
        return this._data.watts;
    }

    get components() {
        return this._data.components;
    }

    /**
     * ProjectStatus Property
     */
    get projectStatus() {
        return this._data.project_status;
    }
    set projectStatus(val) {
        this._data.project_status = val;
        this.emit("property.updated");
    }

    assess() {
        this.emit("assessing");
        this._clearPortfolio();

        each(this.bids, bid => {
            if (bid.isActive) {
                for (let prop of this._propertiesToSum) {
                    this._data[prop] += bid._data[prop];
                }
            }
        });

        this._data.margin = this._calculateMargin();
        this._calculateComponents();

        this.is_dirty = true;
        this.emit("updated");
        this.emit("assessed");
    }

    _calculateMargin() {
        var margin = this._data.price > 0 ? parseFloat(this._data.markup) / this._data.price * 100 : 0;
        return confirmNumber(_.round(margin, 4));
    }

    _calculateComponents() {
        this._data.components = {};

        each(this.bids, bid => {
            if (bid.isActive) {
                each(bid.components(), component => {
                    if (!component.config.is_nested) {
                        component.ppw = bid.watts > 0 ? component.price / bid.watts : 0;
                        component.cpw = bid.watts > 0 ? component.cost / bid.watts : 0;

                        if (isUndefined(this._data.components[component.definitionId])) {
                            this._data.components[component.definitionId] = {
                                definition_id: component.definitionId,
                                title: component.title,
                                price: 0,
                                cost: 0,
                                markup: 0,
                                tax: 0,
                                labor_hours: 0,
                                labor_cost: 0,
                                quantity: 0,
                                cpw: 0,
                                ppw: 0
                            };
                        }

                        this._data.components[component.definitionId].labor_cost += component.laborCost;
                        this._data.components[component.definitionId].price += component.price;
                        this._data.components[component.definitionId].cost += component.cost;
                        this._data.components[component.definitionId].markup += component.markup;
                        this._data.components[component.definitionId].tax += component.tax;
                        this._data.components[component.definitionId].labor_hours += component.laborHours;

                        this._data.components[component.definitionId].cpw =
                            this._data.watts > 0
                                ? this._data.components[component.definitionId].cost / this._data.watts
                                : 0;
                        this._data.components[component.definitionId].ppw =
                            this._data.watts > 0
                                ? this._data.components[component.definitionId].price / this._data.watts
                                : 0;
                    }
                });
            }
        });
    }

    bind() {
        each(this.bids, bid => {
            bid.on("assessing", `project.${this.id}`, () => {
                this.emit("assessing");
            });

            bid.on("assessed", "project-service", () => {
                waitForFinalEvent(() => this.assess(), 500, `project.${this.id}.assessments.completed`);
            });
        });

        this.on("assessed", "project-service", () => {
            this._perf_end = now();
            console.log(`Project Assessment Time (id ${this.id})`, (this._perf_start - this._perf_end).toFixed(3)); // ~ 0.002 on my system

            this._perf_start = null;
        });
    }

    _clearPortfolio() {
        each(this._propertiesToSum, prop => {
            this._data[prop] = 0;
        });
    }

    exportData() {
        let project = Object.assign({}, this._data);
        delete project.bids;
        delete project.components;
        return project;
    }
}
