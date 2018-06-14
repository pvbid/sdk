import _ from "lodash";
import axios from "axios";

/**
 * 
 */
export default class BaseRepository {
    /**
     * Creates an instance of BaseRepository.
     *
     * @param {string} endpoint The API endpoint for the entity
     * @param {string} singleMap The singular noun for the entity (ie. 'bid' or 'assembly')
     * @param {string} multiMap The plural noun for the entity (ie. 'bids' or 'assemblies')
     */
    constructor(endpoint, singleMap, multiMap, httpConfig) {
        axios.defaults.headers.common["Authorization"] = httpConfig.token;
        this.httpConfig = httpConfig;
        this.metaData = null;
        this.params = {};
        this.endpoint = endpoint;
        this.map = { single: singleMap, multi: multiMap };
        this.http = axios;

        this._applyIntercepts();
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
     * @param {Object} params A set of parameters to include for the endpoint.
     * @param {number} params.per_page Number of items to to display per request (max 100)
     * @param {number} params.page Page number
     * @param {string} params.search Search term to apply to object's title
     * @param {string} params.sort_order 'asc' or 'desc'
     * @param {string} params.order_by The name of the property to sort the results by
     * @param {number[]} params.tag_ids List of tags to filter by (excluding this will include all tags)
     * @param {number[]} params.user_ids List of users to filter by (excluding this will include all users)
     * @return {Object[]} Array of results filtered by the given params
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
     * Persists an update to the entity
     *
     * @param {BidEntity} entity 
     * @returns {Promise<BidEntity>} The updated entity
     */
    async save(entity) {
        try {
            let response = await this.http.put(this.endpoint + entity.id, entity);
            return response.data.data[this.map.single];
        } catch (error) {
            return Promise.reject(error.response.data);
        }
    }

    /**
     * Persists a new entity
     *
     * @param {BidEntity} entity An entity object to persist
     * @returns {Promise<BidEntity>} The newly persisted entity
     */
    async create(entity) {
        try {
            let response = await this.http.post(this.endpoint, entity);
            return response.data.data[this.map.single];
        } catch (error) {
            return Promise.reject(error.response.data);
        }
    }

    /**
     * Deletes a single entity by its id
     *
     * @param {number} id The id of the entity to delete
     * @return {object} API response object containing a status message
     */
    async delete(id) {
        try {
            let response = await this.http.delete(this.endpoint + id);
            return response.data.data;
        } catch (error) {
            return Promise.reject(error.response.data);
        }
    }

    /**
     * Apply the impersonation ID to the request if applicable
     */
    _applyIntercepts() {
        this.http.interceptors.request.use(
            configuration => {
                if (this.httpConfig.impersonate_id) {
                    if (_.isUndefined(configuration.params)) {
                        configuration.params = {};
                    }
                    configuration.params.impersonate_id = this.httpConfig.impersonate_id;
                }
                return Promise.resolve(configuration);
            },
            function(error) {
                return Promise.reject(error);
            }
        );
    }
}
