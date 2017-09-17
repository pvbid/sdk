import _ from "lodash";
import now from "performance-now";
import BidEntity from "./BidEntity";
import Helpers from "../utils/Helpers";
import { waitForFinalEvent } from "../utils/WaitForFinalEvent";

/**
 * Project Class
 */
export default class Project extends BidEntity {
    /**
     * Creates an instance of Project.
     * @param {object} entityData 
     * @param {ProjectService} projectService
     */
    constructor(entityData, projectService) {
        super();
        this._original = Object.assign({}, entityData);
        this._projectService = projectService;
        this._data = entityData;
        this._bids = {};
        this._propertiesToSum = ["price", "cost", "tax", "markup", "watts", "labor_hours"];
        this.on("assessing", `project.${this.id}.perf`, () => {
            if (!this._perf_start) this._perf_start = now();
        });
        this.onDelay("property.updated", 5, "self", this.assess);
    }

    get type() {
        return "project";
    }

    get bids() {
        return this._bids;
    }

    /**
     * Labor Hours Property
     */
    get laborHours() {
        return Helpers.confirmNumber(this._data.labor_hours);
    }

    /**
     * Cost Property
     */
    get cost() {
        return this._data.cost;
    }

    /**
     * Tax Property
     */
    get tax() {
        return Helpers.confirmNumber(this._data.tax);
    }

    /**
     * Tax Percent Property
     */
    get taxPercent() {
        return Helpers.confirmNumber(this._data.tax_percent);
    }

    /**
     * Markup Property
     */
    get markup() {
        return this._data.markup;
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

    /**
     * Price Property
     */
    get price() {
        return Helpers.confirmNumber(this._data.price);
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
        if (!_.isUndefined(val.id) && !_.isUndefined(val.core_status)) {
            const oldValue = _.cloneDeep(this._data.project_status);
            this._data.project_status_id = val.id;
            this._data.project_status = val;
            this.dirty();
            this._projectService.repositories.projects
                .save(this.exportData())
                .then(projectData => {
                    this._data.closed_at = projectData.closed_at;
                    this._data.reconciled_at = projectData.reconciled_at;
                    this.emit("updated");
                })
                .catch(error => {
                    this._data.project_status = oldValue;
                    throw error;
                });
        }
    }

    assess() {
        this.emit("assessing");
        this._clearPortfolio();

        _.each(this.bids, bid => {
            if (bid.isActive) {
                for (let prop of this._propertiesToSum) {
                    this._data[prop] += Helpers.confirmNumber(bid._data[prop]);
                }
            }
        });

        this._data.margin = this._calculateMargin();
        this._calculateComponents();

        this.dirty();
        this.emit("updated");
        this.emit("assessed");
    }

    _calculateMargin() {
        var margin = this._data.price > 0 ? parseFloat(this._data.markup) / this._data.price * 100 : 0;
        return confirmNumber(_.round(margin, 4));
    }

    _calculateComponents() {
        this._data.components = {};

        _.each(this.bids, bid => {
            _.each(bid.entities.components(), component => {
                if (!component.config.is_nested) {
                    component.ppw = bid.watts > 0 ? component.price / bid.watts : 0;
                    component.cpw = bid.watts > 0 ? component.cost / bid.watts : 0;

                    if (_.isUndefined(this._data.components[component.definitionId])) {
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

                    if (bid.isActive) {
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
                }
            });
        });
    }

    /**
     * Binds the "updated" event for all dependant bids.
     */
    bind() {
        //_.each(this.bids, bid => this._bindToBid(bid));

        this.on("assessed", `project.${this.id}.final`, () => {
            this._perf_end = now();
            console.log(`Project Assessment Time (id ${this.id})`, (this._perf_start - this._perf_end).toFixed(3)); // ~ 0.002 on my system
            console.log("Project Cost/Price", this.cost, this.price);
            this._perf_start = null;
        });
    }

    _bindToBid(bid) {
        bid.onDelay("assessing", 10, `project.${this.id}`, () => {
            this.emit("assessing");
        });

        bid.on("changed", `project.${this.id}.bid-changed`, () => this.dirty());

        bid.onDelay("assessed", 200, `project.${this.id}.assessed`, () => {
            //console.log("assess Cost/Price", this.cost, this.price);
            waitForFinalEvent(() => this.assess(), 400, `project.${this.id}.assessments.completed`);
        });
    }

    attachBid(bid) {
        if (this.bids[bid.id]) {
            throw "Bid is already attached.";
        } else if (bid._data.project_id != this.id) {
            //TODO: Add attach bid on the fly, updating the database.
            throw "Bid is not associated with project.";
        }

        this._bids[bid.id] = bid;
        this._bindToBid(this._bids[bid.id]);
    }

    async createBid(title) {
        return this._projectService.createBid(this, title);
    }

    _clearPortfolio() {
        _.each(this._propertiesToSum, prop => {
            this._data[prop] = 0;
        });
    }

    /**
     * Saves project and underlying bids.
     * 
     * @returns {Promise<null>}
     */
    async save() {
        return this._projectService.save(this);
    }

    /**
     * Exports the project's data to an object.
     * 
     * @returns {object}
     * @property {number} id
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
     * @property {string} created_at
     * @property {string} updated_at
     * @property {string} closed_at
     * @property {string} reconciled_at
     */
    exportData() {
        let project = Object.assign({}, this._data);
        delete project.bids;
        delete project.components;
        return project;
    }
}
