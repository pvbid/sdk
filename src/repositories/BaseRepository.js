import isEmpty from "lodash/isEmpty";
import isUndefined from "lodash/isUndefined";
import isEqual from "lodash/isEqual";
import toArray from "lodash/toArray";
import keyBy from "lodash/keyBy";
import defaults from "lodash/defaults";
/**
 * @module PVBid/Repositories
 */

/**
 * 
 * @param {any} endpoint 
 * @param {any} singleMap 
 * @param {any} multiMap 
 * @param {any} httpProvider 
 * @export
 * @class BaseRepository
 * @memberof module:PVBid/Repositories
 */
export default class BaseRepository {
    constructor(endpoint, singleMap, multiMap, httpProvider) {
        this.metaData = null;
        this.collection = {};
        this.params = {};
        this.endpoint = endpoint;
        this.map = { single: singleMap, multi: multiMap };
        this.http = httpProvider;
    }

    /**
     * Retrieves a single domain object by its id.
     * @instance
     * @param {int} id The id of the entity to retrieve.
     * @param {boolean} forceReload Flags repository to force reload skipping cached data.
     * @memberof module:PVBid/Repositories.BaseRepository
     */
    async findById(id, forceReload) {
        if (isEmpty(this.collection) || isUndefined(this.collection[id]) || forceReload) {
            try {
                let response = await this.http.get(this.endpoint + id);
                this.collection[id] = response.data.data[this.map.single];

                return this.collection[id];
            } catch (error) {
                return Promise.reject(error);
            }
        } else {
            return this.collection[id];
        }
    }

    /**
     * Retrieves an array of results for the endpoint
     * 
     * @instance
     * @memberof module:PVBid/Repositories.BaseRepository
     * @param {object} params A set of parameters to include for the endpoint.
     * @param {boolean} forceReload Flags repository to force reload skipping cached data. 
     */
    async get(params, forceReload) {
        if (isEmpty(this.collection) || forceReload || !isEqual(params, this.params)) {
            try {
                let res = await this.http.get(this.endpoint, {
                    params: defaults(params, {})
                });
                this.collection = keyBy(res.data.data[this.map.multi], "id");
                this.metaData = res.data.data.meta ? res.data.data.meta : null;

                this.params = defaults(Object.assign({}, params), {});
                return toArray(this.collection);
            } catch (error) {
                return Promise.reject(error);
            }
        } else return toArray(this.collection);
    }

    /**
     * 
     * @instance
     * @param {module:PVBid/Domain.BidEntity} entity 
     * @returns {Promise<module:PVBid/Domain.BidEntity>}
     * @memberof module:PVBid/Repositories.BaseRepository
     */
    async save(entity) {
        try {
            let response = await this.http.put(this.endpoint + entity.id, entity);
            return response.data.data;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async create(entity) {
        try {
            let response = await this.http.post(this.endpoint, entity);
            let jsonObject = response.data.data[this.map.single];
            this.collection[jsonObject.id] = jsonObject;

            return this.collection[jsonObject.id];
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async remove(id) {
        try {
            let response = await this.http.delete(this.endpoint + id);
            if (this.collection[id]) {
                delete this.collection[id];
            }
            return response.data.data;
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
