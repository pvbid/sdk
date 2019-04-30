import BaseRepository from "./BaseRepository";

export default class DatatableRepository extends BaseRepository {
    constructor(config) {
        super(`${config.base_uri}`, "datatable", "datatables", config);
    }

    async findById(bidId, datatableId) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/datatables/`;
        return super.findById(datatableId);
    }

    async save(bidId, datatable) {
      this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/datatables/`;
      return super.save(datatable);        
    }

    async get(bidId, params) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/datatables/`;
        return super.get(params);
    }

    async create(bidId, datatableObject) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/datatables/`;
        return super.create(datatableObject);
    }

    async delete(bidId, datatableId) {
        this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/datatables/`;
        return super.delete(datatableId);
    }
}
