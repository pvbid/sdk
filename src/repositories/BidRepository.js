import BaseRepository from "./BaseRepository";

/**

 * 
 * @export
 * @class BidRepository
 * @extends {module:PVBid/Repositories.BaseRepository}
 * @memberof module:PVBid/Repositories
 */
export default class BidRepository extends BaseRepository {
    constructor(baseUri, httpProvider) {
        super(baseUri + "/bids/", "bid", "bids", httpProvider);
    }
}
