import BaseRepository from "./BaseRepository";

/**
 * 
 */
export default class BidRepository extends BaseRepository {
    constructor(config) {
        super(config.base_uri + "/bids/", "bid", "bids", config);
    }
}
