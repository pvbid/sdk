import BidFactory from "../factories/BidFactory";
import BidValidator from "./BidValidator";

/**
 * @class BidService
 */
export default class BidService {
    /**
     * Creates an instance of BidService.
     * @param {object} repositories 
     */
    constructor(repositories) {
        this.repositories = repositories;
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
        const clonedBid = new BidFactory().create(bidObject, this.repositories, bid.project);
        bid.project.attachBid(clonedBid);
        bid.project.assess();
        return clonedBid;
    }

    moveLineItemToComponent(bid, lineItem, component) {
        _.each(bid.entities.components(), function(componentToLeave) {
            if (componentToLeave.config.component_group_id === component.config.component_group_id) {
                if (_.includes(componentToLeave.config.line_items, lineItem.id)) {
                    _.pull(componentToLeave.config.line_items, lineItem.id);

                    componentToLeave.assess();
                }
            }
        });

        component.config.line_items.push(lineItem.id);
        lineItem.onDelay("updated", 5, `component.${component.id}`, () => component.assess());
        component.assess();
    }

    addLineItem(bid, title) {
        throw "addLineItem not implemented.";
    }

    /**
     * Creates a snapshot of the current bid.
     * 
     * @param {Bid} bid 
     * @param {?any} title Title of the snapshot
     * @param {?any} description Description of the snapshot.
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
     * @param {any} bid 
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
