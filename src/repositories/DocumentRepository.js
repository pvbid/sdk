import BaseRepository from "./BaseRepository";

/**
 * 
 */
export default class DocumentRepository extends BaseRepository {
    constructor(config) {
        super(`${config.base_uri}`, "document", "documents", config);
    }

    async findById(bidId, documentId) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/documents/`;
        return super.findById(documentId);
    }

    async get(bidId, params) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/documents/`;
        return super.get(params);
    }

    async create(bidId, documentObject) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/documents/`;
        return super.create(documentObject);
    }

    async delete(bidId, documentId) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/documents/`;
        return super.delete(documentId);
    }
}
