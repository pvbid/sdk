import _ from "lodash";
import axios from "axios";

/**
 * 
 */
export default class BaseRepository {
    /**
     * Creates an instance of BaseRepository.
     *
     * @param {string} endpoint 
     * @param {string} singleMap 
     * @param {string} multiMap 
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
     * Persists the entity
     *
     * @param {BidEntity} entity 
     * @returns {Promise<BidEntity>}
     */
    async save(entity) {
        try {
            let response = await this.http.put(this.endpoint + entity.id, entity);
            return response.data.data[this.map.single];
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
