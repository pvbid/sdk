import BaseRepository from "./BaseRepository";

/**
 * @deprecated This class will be removed in version 1.1.x.
 */
export default class LineItemRepository extends BaseRepository {
    constructor(config) {
        super(`${config.base_uri}`, "line_item", "line_items", config);
    }

    async findById(bidId, lineItemId) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/line_items/`;
        return super.findById(lineItemId);
    }

    async get(bidId, params) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/line_items/`;
        return super.get(params);
    }

    async create(bidId, lineItemObject) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/line_items/`;
        return super.create(lineItemObject);
    }

    async delete(bidId, lineItemId) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/line_items/`;
        return super.delete(lineItemId);
    }
}
