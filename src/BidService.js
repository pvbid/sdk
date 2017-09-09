import BidFactory from "./BidFactory";
/**
 * @param {module:PVBid/Repositories.BidRepository} bidRepository
 * @export
 * @class BidService
 * @memberof module:PVBid
 */
export default class BidService {
    constructor(bidRepository) {
        this.repository = bidRepository;
    }

    /**
     * Loads a bid instance.
     * 
     * @instance
     * @param {number} bidId 
     * @param {module:PVBid/Domain.Project} project 
     * @returns {Promise<module:PVBid/Domain.Bid>}
     * @memberof module:PVBid.BidService
     */
    async load(bidId, project) {
        try {
            const bidObject = await this.repository.findById(bidId);

            const bid = new BidFactory().create(bidObject);
            bid.project = project;
            bid.bind();
            bid.reassessAll();

            return bid;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * 
     * @instance
     * @param {array} bidIds 
     * @param {module:PVBid/Domain.Project} project 
     * @returns {Promise.<Bid[]>}
     * @memberof module:PVBid/Domain.BidService
     */
    async loadBids(bidIds, project) {
        let promises = [];

        for (let bidId of bidIds) {
            promises.push(this.repository.findById(bidId));
        }

        return Promise.all(promises)
            .then(bidsJson => {
                let bids = {};
                for (let bidObject of bidsJson) {
                    let bid = new BidFactory().create(bidObject);

                    const metric = new Domain.Metric({}, bid);
                    bid.project = project;
                    bid.bind();
                    bid.reassessAll();
                    bids[bid.id] = bid;
                }

                return bids;
            })
            .catch(err => {
                console.log(err);
            });
    }

    async clone(bid) {
        throw "bid cloning not implemented.";
    }

    moveLineItemToComponent(bid, lineItem, component) {
        _.each(bid.components(), function(componentToLeave) {
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
}
