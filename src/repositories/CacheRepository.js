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
        if (_.isEmpty(this._cache[this.endpoint]) || _.isUndefined(this._cache[this.endpoint][id]) || forceReload) {
            try {
                let res = await super.findById(id);
                if (_.isUndefined(this._cache[this.endpoint])) {
                    this._cache[this.endpoint] = {};
                }
                this._cache[this.endpoint][id] = _.cloneDeep(res);
                return res;
            } catch (error) {
                return Promise.reject(error);
            }
        } else {
            console.log("Cache FindById: ", this.endpoint, id);
            return _.cloneDeep(this._cache[this.endpoint][id]);
        }
    }

    /**
     * Retrieves an array of results for the endpoint
     * 
     * @param {object} params A set of parameters to include for the endpoint.
     * @param {boolean} forceReload Flags repository to force reload skipping cached data. 
     */
    async get(params, forceReload) {
        if (
            forceReload ||
            _.isEmpty(this._cache["GET_" + this.endpoint]) ||
            (!_.isUndefined(params) && !_.isEqual(params, this.params))
        ) {
            try {
                let response = await super.get(params);
                const keyed = _.keyBy(response, "id");
                this._cache["GET_" + this.endpoint] = _.cloneDeep(keyed);

                return response;
            } catch (error) {
                return Promise.reject(error);
            }
        } else {
            console.log("Cache GET: ", this.endpoint);
            return _.cloneDeep(this._cache["GET_" + this.endpoint]);
        }
    }

    /**
     * 
     * @param {BidEntity} entity - bid entity data object
     * @returns {Promise<BidEntity>}
     */
    async save(entity) {
        try {
            let response = await super.save(entity);

            //invalidate cache as it's stale
            if (this._cache[this.endpoint] && this._cache[this.endpoint][entity.id]) {
                delete this._cache[this.endpoint][entity.id];
                console.log("Cache Save (delete): ", this.endpoint, entity.id);
            }

            return response;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * 
     * @param {BidEntity} entity - bid entity data object
     * @returns {Promise<BidEntity>}
     */
    async create(entity) {
        try {
            let response = await super.create(entity);

            //invalidate cache as it's stale
            if (this._cache["GET_" + this.endpoint]) {
                delete this._cache["GET_" + this.endpoint];
                console.log("Cache GET (delete): ", this.endpoint);
            }

            return response;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async delete(id) {
        try {
            let response = await super.delete(id);
            if (this._cache[this.endpoint] && this._cache[this.endpoint][id]) {
                delete this._cache[this.endpoint][id];
                console.log("Cache Delete (delete): ", this.endpoint, id);
            }
            return response;
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
