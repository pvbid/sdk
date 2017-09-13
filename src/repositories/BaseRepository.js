import _ from "lodash";
import axios from "axios";

/**
 * 
 */
export default class BaseRepository {
    /**
     * Creates an instance of BaseRepository.
     * @param {string} endpoint 
     * @param {string} singleMap 
     * @param {string} multiMap 
     */
    constructor(endpoint, singleMap, multiMap, config) {
        axios.defaults.headers.common["Authorization"] = config.token;
        this.config = config;
        this.metaData = null;
        this.params = {};
        this.endpoint = endpoint;
        this.map = { single: singleMap, multi: multiMap };
        this.http = axios;
    }

    /**
     * Retrieves a single domain object by its id.
     * 
     * @param {int} id The id of the entity to retrieve.
     */
    async findById(id) {
        try {
            let response = await this.http.get(this.endpoint + id);

            return response.data.data[this.map.single];
        } catch (error) {
            return Promise.reject(error.response.data);
        }
    }

    /**
     * Retrieves an array of results for the endpoint
     * 
     * @param {object} params A set of parameters to include for the endpoint.
     */
    async get(params) {
        try {
            let res = await this.http.get(this.endpoint, {
                params: _.defaults(params, {})
            });
            this.metaData = res.data.data.meta ? res.data.data.meta : null;
            this.params = _.defaults(Object.assign({}, params), {});
            return res.data.data[this.map.multi];
        } catch (error) {
            return Promise.reject(error.response.data);
        }
    }

    /**
     * 
     * @param {BidEntity} entity 
     * @returns {Promise<BidEntity>}
     */
    async save(entity) {
        try {
            let response = await this.http.put(this.endpoint + entity.id, entity);
            return response.data.data;
        } catch (error) {
            return Promise.reject(error.response.data);
        }
    }

    async create(entity) {
        try {
            let response = await this.http.post(this.endpoint, entity);
            return response.data.data[this.map.single];
        } catch (error) {
            return Promise.reject(error.response.data);
        }
    }

    async delete(id) {
        try {
            let response = await this.http.delete(this.endpoint + id);
            return response.data.data;
        } catch (error) {
            return Promise.reject(error.response.data);
        }
    }
}
