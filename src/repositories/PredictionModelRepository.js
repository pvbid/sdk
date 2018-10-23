import BaseRepository from "./BaseRepository";

export default class PredictionModelRepository extends BaseRepository {
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

    /**
     * Get a prediction model with associated datasets
     *
     * @param {number} predictionModelId 
     * @return {promise<BidEntity>} prediction model with datasets
     */
    async getData(predictionModelId) {
        try {
            const res = await this.http.get(`${this.endpoint}${predictionModelId}/data`);
            return res.data.data;
        } catch (error) {
            return Promise.reject(error);
        } 
    }
}