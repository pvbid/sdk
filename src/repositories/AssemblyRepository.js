import CacheRepository from "./CacheRepository";

/**
 * 
 */
export default class AssemblyRepository extends CacheRepository {
    constructor(config) {
        super(`${config.base_uri}`, "assembly", "assemblies", config);
    }

    async findById(bidId, assemblyId) {
        this.endpoint = `${this.config.base_uri}/bids/${bidId}/assemblies/`;
        return super.findById(assemblyId);
    }

    async get(bidId, params, forceReload) {
        this.endpoint = `${this.config.base_uri}/bids/${bidId}/assemblies/`;

        return super.get(params, forceReload);
    }

    /**
     * Inherited function has been disabled.
     * Use {@link AssemblyRepository.implement}
     * @throws {error}  Throws exception when accessed.
     */
    async create() {
        throw "Directly creating an assembly is not possible. See AssemblyRepository.implement()";
    }

    async delete(bidId, assemblyId) {
        this.endpoint = `${this.config.base_uri}/bids/${bidId}/assemblies/`;
        return super.delete(assemblyId);
    }

    async implement(bidId, assemblyId) {
        this.endpoint = `${this.config.base_uri}/bids/${bidId}/assembly_maps/${assemblyId}/implement`;

        try {
            return this.http.post(this.endpoint);
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
