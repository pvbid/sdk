import LineItem from "../LineItem";
import Metric from "../Metric";
import Field from "../Field";
import BidValidator from "./BidValidator";
import BidFactory from "../factories/BidFactory";
import { waitForFinalEvent } from "../../utils/WaitForFinalEvent";
import LineItemScaffolding from "../scaffolding/LineItemScaffolding";
import MetricScaffolding from "../scaffolding/MetricScaffolding";
import FieldScaffolding from "../scaffolding/FieldScaffolding";

/**
 * @class BidService
 */
export default class BidService {
    /**
     * Creates an instance of BidService.
     * @param {PVBidContext} context 
     */
    constructor(context) {
        this.context = context;
        this.repositories = context.repositories;
    }

    /**
     * Clones bid returning an initialized {@link Bid}
     * 
     * @param {Bid} bid 
     * @returns {Promise<Bid>}
     */
    async clone(bid) {
        await bid.project.save();
        const res = await this.repositories.bids.clone(bid.id);
        const bidObject = await this.repositories.bids.findById(res.id, true);
        const clonedBid = new BidFactory().create(bidObject, this.context, bid.project);
        bid.project.attachBid(clonedBid);
        bid.project.assess();
        return clonedBid;
    }

    /**
     * Adds a new line item to the bid.  The added line item is uncategorized in all component groups.
     * 
     * @param {Bid} bid 
     * @param {string} [title=New Line Item] 
     * @returns {Promise<LineItem>}
     */
    async addLineItem(bid, title) {
        const scaffolding = LineItemScaffolding.create(bid.id, title);
        const lineItemObject = await this.repositories.lineItems.create(bid.id, scaffolding);
        const lineItem = new LineItem(lineItemObject, bid);
        bid._data.line_items[lineItem.id] = lineItem;
        lineItem.bind();
        lineItem.on("assessed", "line_item." + lineItem.id, () => {
            waitForFinalEvent(() => bid.assess(), 15, `bid.${bid.id}.line_item`);
        });
        lineItem.on("assessed", `bid.${bid.id}`, () => bid._handleAssessmentCompleteEvent());
        return lineItem;
    }

    /**
     * Adds a new metric to the bid.
     * 
     * @param {Bid} bid 
     * @param {string} [title=New Metric] 
     * @returns {Promise<Metric>}
     */
    async addMetric(bid, title) {
        if (this.context.user.can("create-bid")) {
            const scaffolding = MetricScaffolding.create(bid.id, title);
            const metricObject = await this.repositories.metrics.create(bid.id, scaffolding);
            const metric = new Metric(metricObject, bid);
            bid._data.metrics[metric.id] = metric;
            metric.bind();
            metric.on("assessed", "metric." + metric.id, () => {
                waitForFinalEvent(() => bid.assess(), 15, `bid.${bid.id}.metric`);
            });
            metric.on("assessed", `bid.${bid.id}`, () => bid._handleAssessmentCompleteEvent());
            return metric;
        } else throw new Error("User does not have permission to add metric.");
    }

    /**
     * Adds a new field to the bid.
     * 
     * @param {Bid} bid 
     * @param {string} [title=New Field] 
     * @param {string} [type=number] 
     * @returns {Promise<Field>}
     */
    async addField(bid, title, type) {
        if (this.context.user.can("create-bid")) {
            const scaffolding = FieldScaffolding.create(bid.id, title, type);
            const fieldObject = await this.repositories.fields.create(bid.id, scaffolding);
            const field = new Field(fieldObject, bid);
            bid._data.fields[field.id] = field;
            field.bind();
            field.on("assessed", "field." + field.id, () => {
                waitForFinalEvent(() => bid.assess(), 15, `bid.${bid.id}.field`);
            });
            field.on("assessed", `bid.${bid.id}`, () => bid._handleAssessmentCompleteEvent());
            return field;
        } else throw new Error("User does not have permission to add field.");
    }

    /**
     * Creates a snapshot of the current bid.
     * 
     * @param {Bid} bid 
     * @param {?string} title Title of the snapshot
     * @param {?string} description Description of the snapshot.
     * @returns {Promise.<object>}
     * @property {number} id The snapshot id.
     * @property {string} title
     * @property {number} bid_id
     * @property {string} description
     * @property {boolean} is_auto A flag to indicate the snapshot was generated automatically by the PVBid system.
     * @property {string} created_at Example format: 2016-04-10T21:08:05+00:00
     */
    async createSnapshot(bid, title, description) {
        const snapshot = {
            bid_id: bid.id,
            title: title ? title : "Snapshot",
            description: description ? description : ""
        };
        await bid.project.save();
        return this.repositories.snapshots.create(bid.id, snapshot);
    }

    /**
     * Validates bid structure and references.
     * 
     * @param {Bid} bid 
     * @returns {object[]} Returns an array of validation errors.
     */
    validate(bid) {
        return new BidValidator().validate(bid);
    }

    /**
     * Removes assembly from a bid.
     * 
     * @param {Bid} bid 
     * @param {number} assemblyId 
     * @returns {Promise<null>}
     */
    async removeAssembly(bid, assemblyId) {
        try {
            await bid.project.save();
            await this.repositories.assemblies.delete(bid.id, assemblyId);
            const bidObject = await this.repositories.bids.findById(bid.id, true);
            new BidFactory().reload(bid, bidObject);
            return;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Adds assemblies to bid. 
     * 
     * @param {Bid} bid 
     * @param {number[]} assemblyMapIds An array of assembly mapping ids to add.
     * @returns {Promise<null>}
     */
    async addAssemblies(bid, assemblyMapIds) {
        try {
            await bid.project.save();
            for (let aId of assemblyMapIds) {
                await this.repositories.assemblies.implement(bid.id, aId);
            }
            const bidObject = await this.repositories.bids.findById(bid.id, true);
            new BidFactory().reload(bid, bidObject);
            return;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Recovers a bid from a snapshot. An auto snapshot of the current state will be created.
     * 
     * @param {Bid} bid 
     * @param {number} snapshotId 
     * @returns  {Promise<null>} 
     */
    async recoverBid(bid, snapshotId) {
        try {
            await bid.project.save();
            await this.repositories.snapshots.recover(bid.id, snapshotId);
            const bidObject = await this.repositories.bids.findById(bid.id, true);
            new BidFactory().reload(bid, bidObject);
            return;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Deletes bid.
     * 
     * @param {Bid} bid 
     * @return {Promise<null>}
     */
    async deleteBid(bid) {
        await this.repositories.bids.delete(bid.id);
        bid.project.detachBid(bid);
        bid.clearEntityBindings();
        bid.removeAllListeners();
        bid.project = null;
        return;
    }
}
