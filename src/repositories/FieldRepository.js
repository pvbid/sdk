import BaseRepository from "./BaseRepository";

/**
 * @deprecated This class will be removed in version 1.1.x.
 */
export default class FieldRepository extends BaseRepository {
    constructor(config) {
        super(`${config.base_uri}`, "field", "fields", config);
    }

    async findById(bidId, fieldId) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/fields/`;
        return super.findById(fieldId);
    }

    async get(bidId, params) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/fields/`;
        return super.get(params);
    }

    async create(bidId, fieldObject) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/fields/`;
        return super.create(fieldObject);
    }

    async delete(bidId, fieldId) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/fields/`;
        return super.delete(fieldId);
    }
}
