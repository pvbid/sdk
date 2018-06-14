import BaseRepository from "./BaseRepository";

/**
 * 
 */
export default class BidRepository extends BaseRepository {
    constructor(config) {
        super(config.base_uri + "/bids/", "bid", "bids", config);
    }

    /**
     * Retrieves a list of bids
     *
     * @param {Object} [params] A set of parameters to filter the bids by.
     * @param {number} params.per_page Number of bids to to display per request (max 100)
     * @param {number} params.page Page number
     * @param {string} params.search Search term to apply to bid's title
     * @param {string} params.sort_order 'asc' or 'desc'
     * @param {string} params.order_by The name of the property to sort the results by
     * @param {number[]} params.statuses List of status ids to filter by (excluding this will include all statuses)
     * @param {number} params.owner_id Specify the user id of the bids owner
     * @return {Promise<BidEntity[]>} Filtered list of bids
     */
    async get(params) {
        return super.get(params);
    }

    /**
     * Create a clone of the bid
     *
     * @param {number} bidId
     * @return {Promise<BidEntity>} Bid clone
     */
    async clone(bidId) {
        return this.http.post(this.endpoint + bidId + "/clone").then(function(response) {
            return response.data.data.bid;
        });
    }
}
