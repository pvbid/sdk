import BaseRepository from "./BaseRepository";

/**
 * @deprecated This class will be removed in version 1.1.x.
 */
export default class MetricRepository extends BaseRepository {
    constructor(config) {
        super(`${config.base_uri}`, "metric", "metrics", config);
    }

    async findById(bidId, metricId) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/metrics/`;
        return super.findById(metricId);
    }

    async get(bidId, params) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/metrics/`;
        return super.get(params);
    }

    async create(bidId, metricObject) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/metrics/`;
        return super.create(metricObject);
    }

    async delete(bidId, metricId) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/metrics/`;
        return super.delete(metricId);
    }
}
