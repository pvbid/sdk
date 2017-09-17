import BaseRepository from "./BaseRepository";

/**
 * 
 */
export default class BidRepository extends BaseRepository {
    constructor(config) {
        super(config.base_uri + "/bids/", "bid", "bids", config);
    }

    async clone(bidId) {
        return this.http.post(this.endpoint + bidId + "/clone").then(function(response) {
            return response.data.data.bid;
        });
    }
}
