import BaseRepository from "./BaseRepository";

/**
 * 
 */
export default class SnapshotRepository extends BaseRepository {
    constructor(config) {
        super(`${config.base_uri}`, "snapshot", "snapshots", config);
    }

    async findById(bidId, snapshotId) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/snapshots/`;
        return super.findById(snapshotId);
    }

    async get(bidId, params, forceReload) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/snapshots/`;

        return super.get(params, forceReload);
    }

    async create(bidId, snapshotObject) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/snapshots/`;
        return super.create(snapshotObject);
    }

    async save(bidId, snapshotObject) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/snapshots/`;
        return super.save(snapshotObject);
    }

    async delete(bidId, snapshotId) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/snapshots/`;
        return super.delete(snapshotId);
    }

    async recover(bidId, snapshotId) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/snapshots/${snapshotId}/recover`;

        try {
            return this.http.post(this.endpoint);
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
