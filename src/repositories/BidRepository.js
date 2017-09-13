import CacheRepository from "./CacheRepository";

/**
 * 
 */
export default class BidRepository extends CacheRepository {
    constructor(config) {
        super(config.base_uri + "/bids/", "bid", "bids", config);
    }
}
