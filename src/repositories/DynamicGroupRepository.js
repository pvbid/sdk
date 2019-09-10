import BaseRepository from "./BaseRepository";

export default class DynamicGroupRepository extends BaseRepository {
  constructor(config) {
    super(`${config.base_uri}`, "dynamic_group", "dynamic_groups", config);
  }

  /**
   * Get all the Dynamic Groups for a Bid
   * @param {number} bidId
   * @param {string} $dynamicGroupId
   * @return {Promise<BidEntity[]>} Array of results filtered by the given params
   */
  async get(bidId) {
    this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/${this.map.multi}`;

    return super.get();
  }

  /**
   * Finds a Dynamic Group by it's Bid and ID
   * @param {number} bidId
   * @param {string} $dynamicGroupId
   * @return {Promise<BidEntity>}
   */
  async findById(bidId, dynamicGroupId) {
    this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/${this.map.multi}/`;

    return super.findById(dynamicGroupId);
  }

  /**
   * Persists a new entity
   *
   * @param {BidEntity} entity An entity object to persist
   * @returns {Promise<BidEntity>} The newly persisted entity
   */
  async create(bidId, entity) {
    this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/${this.map.multi}`;

    return super.create(entity);
  }

  /**
   * Persists a new entity
   *
   * @param {string} id An entity object to persist
   * @return {Promise<Object>} Response status message
   */
  async delete(bidId, id) {
    this.endpoint = `${this.httpConfig.base_uri}/bids/${bidId}/${this.map.multi}/`;

    return super.delete(id);
  }
}
