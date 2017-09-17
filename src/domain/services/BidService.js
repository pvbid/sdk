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

    async clone(bid) {
        throw "bid cloning not implemented.";
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
     * Validates bid structure.
     * 
     * @param {Bid} bid 
     * @returns {object[]} Returns and array of objects.
     */
    validate(bid) {
        return new BidValidator().validate(bid);
    }
}
