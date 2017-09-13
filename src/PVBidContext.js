import _ from "lodash";
import ProjectLoader from "./ProjectLoader";
import ProjectRepository from "./repositories/ProjectRepository";
import SnapshotRepository from "./repositories/SnapshotRepository";
import BidRepository from "./repositories/BidRepository";
import ProjectStatusRepository from "./repositories/ProjectStatusRepository";
import AssemblyRepository from "./repositories/AssemblyRepository";
import AssemblyImplementService from "./domain/services/AssemblyImplementService";

/**
 * 
 * @param {object} config
 * @export
 * @class PVBid.PVBidContext
 */
export default class PVBidContext {
    /**
     * Creates an instance of PVBidContext.
     * @param {object} config 
     * @param {string} config.token The auth token to access account data..
     * @param {string} [config.base_uri=http://api.pvbid.com/v2] 
     */
    constructor(config) {
        if (_.isUndefined(config) || _.isUndefined(config.token)) {
            throw "Authoriziation token is not set. ";
        }
        this._httpConfig = config;
        this._token = config.token;

        this._httpConfig.base_uri = this._httpConfig.base_uri ? this._httpConfig.base_uri : "http://api.pvbid.com/v2";
        this.repositories = {
            projects: new ProjectRepository(this._httpConfig),
            bids: new BidRepository(this._httpConfig),
            projectStatuses: new ProjectStatusRepository(this._httpConfig),
            snapshots: new SnapshotRepository(this._httpConfig),
            assemblies: new AssemblyRepository(this._httpConfig)
        };

        this._projectLoader = new ProjectLoader(this.repositories);
    }

    /**
     * Gets an initiated Project instance witn included Bids.
     * 
     * @param {number} projectId The project id in which to retrieve.
     * @param {boolean} forceReload Flags system to skip cache.
     * @returns {Promise<Project>}
     */
    async getProject(projectId, forceReload) {
        return this._projectLoader.load(projectId, forceReload);
    }

    /**
     * Recovers a bid from a snapshot. 
     * NOTE: Returns an initiated Project instance with the recovered bid.
     * The returned instance must replace the old Project instance.
     * 
     * @param {Bid} bid 
     * @param {number} snapshotId 
     * @returns  {Promise<Project>} Returns an initiated Project.
     */
    async recoverBid(bid, snapshotId) {
        try {
            await bid.project.save();
            await this.repositories.snapshots.recover(bid.id, snapshotId);
            const project = await this.getProject(bid.project.id, true);
            project.assess();
            return project;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async implementAssemblies(bid, assemblyMapIds) {
        try {
            await bid.project.save();
            const service = new AssemblyImplementService(this.repositories);
            await service.implement(bid, assemblyMapIds);
            const project = await this.getProject(bid.project.id, true);
            project.assess();
            return project;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async removeAssembly(bid, assemblyId) {
        try {
            await bid.project.save();
            await this.repositories.assemblies.delete(bid.id, assemblyId);
            const project = await this.getProject(bid.project.id, true);
            project.assess();
            return project;
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
