import BaseRepository from "./BaseRepository";

export default class ProjectRepository extends BaseRepository {
  constructor(config) {
      super(config.base_uri + "/predictions/", "prediction", "prediction_models", config);
  }

  /**
   * Retrieves a list of predition models
   * 
   * @param {object} params
   * @param {number} params.lineItemDefId Filters results by line item definition
   * @return {Promise<BidEntity[]>} List of predictions
   */
  async get(params) {
      return super.get(params);
  }
}