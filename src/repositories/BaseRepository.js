import _ from "lodash";
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
 * @memberof 
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
     * @memberof .BaseRepository
     */
    async findById(id, forceReload) {
        if (_.isEmpty(this.collection) || _.isUndefined(this.collection[id]) || forceReload) {
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
     * @memberof .BaseRepository
     * @param {object} params A set of parameters to include for the endpoint.
     * @param {boolean} forceReload Flags repository to force reload skipping cached data. 
     */
    async get(params, forceReload) {
        if (_.isEmpty(this.collection) || forceReload || !_.isEqual(params, this.params)) {
            try {
                let res = await this.http.get(this.endpoint, {
                    params: _.defaults(params, {})
                });
                this.collection = _.keyBy(res.data.data[this.map.multi], "id");
                this.metaData = res.data.data.meta ? res.data.data.meta : null;

                this.params = _.defaults(Object.assign({}, params), {});
                return _.toArray(this.collection);
            } catch (error) {
                return Promise.reject(error);
            }
        } else return _.toArray(this.collection);
    }

    /**
     * 
     * @instance
     * @param {BidEntity} entity 
     * @returns {Promise<BidEntity>}
     * @memberof .BaseRepository
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
