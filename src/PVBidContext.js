import _ from "lodash";
import User from "./domain/User";
import ProjectLoader from "./ProjectLoader";
import ProjectRepository from "./repositories/ProjectRepository";
import SnapshotRepository from "./repositories/SnapshotRepository";
import BidRepository from "./repositories/BidRepository";
import ProjectStatusRepository from "./repositories/ProjectStatusRepository";
import AssemblyRepository from "./repositories/AssemblyRepository";
import TagRepository from "./repositories/TagRepository";
import UserRepository from "./repositories/UserRepository";
import LineItemRepository from "./repositories/LineItemRepository";
import MetricRepository from "./repositories/MetricRepository";
import FieldRepository from "./repositories/FieldRepository";
import PredictionModelRepository from './repositories/PredictionModelRepository';
import DatatableRepository from './repositories/DatatableRepository';

/**
 * 
 * @class PVBid.PVBidContext
 */
export default class PVBidContext {
    /**
     * Creates an instance of PVBidContext.
     * @param {object} config 
     * @param {string} config.token The auth token to access account data..
     * @param {string} [config.base_uri=https://api.pvbid.com/v2] 
     */
    constructor(config) {
        if (_.isUndefined(config) || _.isUndefined(config.token)) {
            throw "Authoriziation token is not set. ";
        }

        /**
         * The current authorized user.  
         * {@link PVBidContext.loadAuthorizedUser} must get called first.
         * 
         * @type {User}
         */
        this.user = null;

        this._httpConfig = config;
        this._token = config.token;
        this._httpConfig.base_uri = this._httpConfig.base_uri ? this._httpConfig.base_uri : "https://api.pvbid.com/v2";

        /**
         * A property that provides quick access to initialized repositories.
         * 
         * @type {object}
         * @param {ProjectRepository} projects
         * @param {BidRepository} bids
         * @param {ProjectStatusRepository} projectStatuses
         * @param {SnapshotRepository} snapshots
         * @param {AssemblyRepository} assemblies
         * @param {TagRepository} tags
         * @param {UserRepository} users
         * @param {LineItemRepository} lineItems
         * @param {MetricRepository} metrics
         * @param {FieldRepository} fields
         */
        this.repositories = {
            projects: new ProjectRepository(this._httpConfig),
            bids: new BidRepository(this._httpConfig),
            projectStatuses: new ProjectStatusRepository(this._httpConfig),
            snapshots: new SnapshotRepository(this._httpConfig),
            assemblies: new AssemblyRepository(this._httpConfig),
            tags: new TagRepository(this._httpConfig),
            users: new UserRepository(this._httpConfig),
            lineItems: new LineItemRepository(this._httpConfig),
            metrics: new MetricRepository(this._httpConfig),
            fields: new FieldRepository(this._httpConfig),
            predictionModels: new PredictionModelRepository(this._httpConfig),
            datatables: new DatatableRepository(this._httpConfig),
        };
    }

    /**
     * Gets an initiated {@link Project} instance witn included bids.
     * 
     * @param {number} projectId The project id in which to retrieve.
     * @param {boolean} forceReload Flags system to skip cache.
     * @returns {Promise<Project>}
     */
    async getProject(projectId, forceReload) {
        try {
            await this.loadAuthorizedUser();
            return new ProjectLoader(this).load(projectId, forceReload);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Create a virtual clone of a project.
     * For safety, any methods involving repositories or peristance are absent in the clone.
     *
     * @param {Project} project The project to make a virtual clone of.
     * @param {number[]} [bidIds] Optionally limit the bids that will be cloned into the virtual project. Helps with performance.
     * @return {Project}
     */
    getVirtualProjectClone(project, bidIds=null) {
        return new ProjectLoader(this).loadVirtualClone(project, bidIds);
    }

    /**
     * Loads the authorized user for this context.  Calling {@link PVBidContext.getProject} auto loads the authorized user.
     * 
     * @returns  {Promise<User>}
     */
    async loadAuthorizedUser() {
        try {
            if (!this.user) {
                let userData = await this.repositories.users.me();
                this.user = new User(userData);
                if (this._httpConfig.impersonate_id) this.user._is_impersonating = true;
                return this.user;
            } else return Promise.resolve(this.user);
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
