import BaseRepository from "./BaseRepository";

/**
 * 
 */
export default class BidRepository extends BaseRepository {
    constructor(baseUri, httpProvider) {
        super(baseUri + "/bids/", "bid", "bids", httpProvider);
    }
}
