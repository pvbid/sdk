import _ from "lodash";
import BaseRepository from "./BaseRepository";

/**
 * 
 */
export default class CacheRepository extends BaseRepository {
    /**
     * Creates an instance of BaseRepository.
     * @param {string} endpoint 
     * @param {string} singleMap 
     * @param {string} multiMap 
     */
    constructor(endpoint, singleMap, multiMap, config) {
        super(endpoint, singleMap, multiMap, config);
        this._cache = {};
        this.params = {};
    }

    /**
     * Retrieves a single domain object by its id.
     * 
     * @param {int} id The id of the entity to retrieve.
     * @param {boolean} forceReload Flags repository to force reload skipping cached data.
     */
    async findById(id, forceReload) {
        if (_.isEmpty(this._cache) || _.isUndefined(this._cache[id]) || forceReload) {
            try {
                let res = await super.findById(id);
                this._cache[id] = _.cloneDeep(res);
                return res;
            } catch (error) {
                return Promise.reject(error);
            }
        } else {
            return _.cloneDeep(this._cache[id]);
        }
    }

    /**
     * Retrieves an array of results for the endpoint
     * 
     * @param {object} params A set of parameters to include for the endpoint.
     * @param {boolean} forceReload Flags repository to force reload skipping cached data. 
     */
    async get(params, forceReload) {
        if (_.isEmpty(this._cache) || forceReload || !_.isEqual(params, this.params)) {
            try {
                let response = await super.get(params);
                const keyed = _.keyBy(response, "id");
                this._cache = _.cloneDeep(keyed);

                return response;
            } catch (error) {
                return Promise.reject(error);
            }
        } else return _.cloneDeep(this._cache);
    }

    /**
     * 
     * @param {BidEntity} entity - bid entity data object
     * @returns {Promise<BidEntity>}
     */
    async save(entity) {
        try {
            let response = await super.save(entity);
            this._cache[entity.id] = _.cloneDeep(entity);
            return response;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async create(entity) {
        try {
            let response = await super.create(entity);
            this._cache[response.id] = _.cloneDeep(response);

            return response;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async delete(id) {
        try {
            let response = await super.delete(id);
            if (this._cache[id]) {
                delete this._cache[id];
            }
            return response;
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
