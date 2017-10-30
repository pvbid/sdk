import _ from "lodash";
import now from "performance-now";
import BidEntity from "./BidEntity";
import Helpers from "../utils/Helpers";
import { waitForFinalEvent } from "../utils/WaitForFinalEvent";

/**
 * A Project contains multiple {@link Bid}s and summations 
 * of the bid results. Projects also have statuses 
 * (ie. open/closed/win/loss), and can have assigned users
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

    get title() {
        return this._data.title;
    }

    set title(val) {
        if (val && typeof val === "string" && val.length > 0) {
            this._data.title = val;
            this.dirty();
        }
    }

    /**
     * @type {string}
     */
    get type() {
        return "project";
    }

    /**
     * @type {object} A keyed object of bids by the bid id.
     */
    get bids() {
        return this._bids;
    }

    /**
     * Labor Hours Property
     * @type {number}
     */
    get laborHours() {
        return Helpers.confirmNumber(this._data.labor_hours);
    }

    /**
     * Cost Property
     * @type {number}
     */
    get cost() {
        return this._data.cost;
    }

    /**
     * Tax Property
     * @type {number}
     */
    get tax() {
        return Helpers.confirmNumber(this._data.tax);
    }

    /**
     * Tax Percent Property
     * @type {number}
     */
    get taxPercent() {
        return Helpers.confirmNumber(this._data.tax_percent);
    }

    /**
     * Markup Property
     * @type {number}
     */
    get markup() {
        return this._data.markup;
    }

    /**
     * Margin Property
     * @type {number}
     */
    get marginPercent() {
        return this._data.margin_percent;
    }

    /**
     * Markup Percent Property
     * @type {number}
     */
    get markupPercent() {
        return Helpers.confirmNumber(this._data.markup_percent);
    }

    /**
     * Price Property
     * @type {number}
     */
    get price() {
        return Helpers.confirmNumber(this._data.price);
    }

    /**
     * @type {string}
     */
    get createdAt() {
        return this._data.created_at;
    }

    /**
     * @type {string}
     */
    get updatedAt() {
        return this._data.updated_at;
    }

    /**
     * @type {string}
     */
    get closedAt() {
        return this._data.closed_at;
    }

    /**
     * @type {string}
     */
    get reconciledAt() {
        return this._data.reconciled_at;
    }

    /**
     * @type {Object[]}
     * @property {number} id
     * @property {string} name
     * @property {string} timezone
     */
    get users() {
        return this._data.users;
    }

    /**
     * @type {number}
     */
    get watts() {
        return this._data.watts;
    }

    /**
     * @private
     * @todo This should be removed.
     * @readonly
     */
    get components() {
        return this._data.components;
    }

    /**
     * ProjectStatus Property
     * @type {object}
     * @property {string} title
     * @property {string} core_status
     * @property {boolean} is_won
     */
    get projectStatus() {
        return this._data.project_status;
    }

    /**
     * @type {{id:number, title:string, core_status:string, is_won:boolean}}
     */
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

    /**
     * @type {PVBidContext}
     */
    get context() {
        return this._projectService.context;
    }

    /**
     * Assess project values by summing all active bids.
     * @emits {assessing}
     * @emits {assessed}
     * @emits {updated}
     */
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

        this._data.margin_percent = this._calculateMargin();

        this.dirty();
        this.emit("updated");
        this.emit("assessed");
    }

    _calculateMargin() {
        var margin = this._data.price > 0 ? parseFloat(this._data.markup) / this._data.price * 100 : 0;
        return Helpers.confirmNumber(_.round(margin, 4));
    }

    /**
     * Binds the "updated" event for all dependant bids.
     */
    bind() {
        this.on("assessed", `project.${this.id}.final`, () => {
            this._perf_end = now();
            //console.log(`Project Assessment Time (id ${this.id})`, (this._perf_start - this._perf_end).toFixed(3)); // ~ 0.002 on my system
            //console.log("Project Cost/Price", this.cost, this.price);
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

    /**
     * Determines if user is assigned to project
     * 
     * @param {number} userId 
     * @returns {boolean} 
     */
    hasUser(userId) {
        return this.users.filter(u => u.id === userId).length === 1;
    }

    /**
     * Attaches a {@link Bid} to the project and binds necessary events.
     * 
     * @param {Bid} bid 
     */
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

    /**
     * Removes a {@link Bid} from the project and removes all bid event listeners.
     * 
     * @param {Bid} bid 
     */
    detachBid(bid) {
        if (_.isUndefined(this.bids[bid.id])) {
            throw "Bid is not attached.";
        } else if (bid._data.project_id != this.id) {
            //TODO: Add attach bid on the fly, updating the database.
            throw "Bid is not associated with project.";
        }
        bid.removeAllListeners();
        delete this.bids[bid.id];
        this.assess();
    }

    /**
     * Adds user to project.
     * 
     * @param {object} user 
     * @returns  {Promise<null>}
     */
    async attachUser(user) {
        if (this.users.map(u => u.id).indexOf(user.id) >= 0) {
            throw "User is already attached.";
        }
        try {
            await this._projectService.repositories.projects.attachUser(this.id, user.id);

            this.users.push(user);
            return;
        } catch (error) {
            return error;
        }
    }

    /**
     * Removes user from project
     * 
     * @param {number} userId 
     * @returns {Promise<null>}
     */
    async detachUser(userId) {
        if (this.users.map(u => u.id).indexOf(userId) < 0) {
            throw "User does not exist.";
        }

        try {
            await this._projectService.repositories.projects.detachUser(this.id, userId);
            this._data.users = this._data.users.filter(u => u.id != userId);
            return;
        } catch (error) {
            return error;
        }
    }

    /**
     * Creates a new bid and attaches and attaches it to the project.
     * This is a wrapper function for {@link ProjectService.createBid}
     * @param {string} title 
     * @returns {Promise<Bid>} 
     */
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
     * @emits saving
     * @emits saved
     */
    async save() {
        this.emit("saving");
        let response = await this._projectService.save(this);
        this.emit("saved");
        return response;
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

    /**
     * Clones project and underlying bids.
     * 
     * @returns {Promise<object>}
     * @property {number} id The id of the new project.
     */
    async clone() {
        return this._projectService.repositories.projects.clone(this.id);
    }

    /**
     * Enables auto saving after project or bid changes occur.
     * 
     * @param {number} [delay=5000] - The number of milliseconds to delay auto save.  Minimum is 1000ms.
     * @emits saving
     * @emits saved
     */
    enableAutoSave(delay) {
        delay = delay && typeof delay === "number" ? Math.max(delay, 1000) : 5000;
        this.onDelay("changed", delay, `project.${this.id}`, () => this.save());
    }

    /**
     * Determines if project is closed.
     * 
     * @returns {boolean} 
     */
    isClosed() {
        return this._data.closed_at;
    }

    /**
     * Determines if project is reconciled
     * 
     * @returns {boolean} 
     */
    isReconciled() {
        return this._data.reconciled_at;
    }
}
