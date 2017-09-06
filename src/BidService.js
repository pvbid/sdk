import BidFactory from "./BidFactory";

export default class BidService {
    constructor(bidRepository) {
        this.repository = bidRepository;
    }

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
        throw "bid cloning not implemented";
    }
}
