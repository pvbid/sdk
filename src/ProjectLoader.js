import _ from "lodash";
import Project from "./domain/Project";
import BidFactory from "./domain/factories/BidFactory";
import ProjectService from "./domain/services/ProjectService";

/**
 * This class serves to quickly load a {@link Project} instance with included {@link Bid}s
 * 
 * @class ProjectLoader
 */
export default class ProjectLoader {
    /**
     * Creates an instance of ProjectLoader.
     * @param {object} repositories 
     */
    constructor(repositories) {
        this._repos = repositories;
    }

    /**
     * Loads a project and bid instances.
     * 
     * @param {number} projectId 
     * @param {boolean} forceReload Forces underlying system to skip the cache.
     * @returns {Promise<Project>}
     */
    async load(projectId, forceReload) {
        try {
            const projectData = await this._repos.projects.findById(projectId, forceReload);
            const bidIds = projectData.bids.map(b => b.id);
            const projectService = new ProjectService(this._repos);
            const project = new Project(projectData, projectService);
            const bids = await this._loadBids(bidIds, project, forceReload);
            _.each(bids, b => project.attachBid(b));
            project.bind();
            return project;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Loads a bid instance.
     * 
     * @param {number} bidId 
     * @param {Project} project 
     * @param {boolean} forceReload Forces underlying system to skeip the cache.
     * @returns {Promise<Bid>}
     */
    async _loadBid(bidId, project, forceReload) {
        try {
            const bidObject = await this._repos.bids.findById(bidId, forceReload);
            return new BidFactory().create(bidObject, this._repos, project);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Loads all bid instances for a project.
     * 
     * @param {array} bidIds 
     * @param {Project} project 
     * @param {boolean} forceReload Forces underlying system to skeip the cache.
     * @returns {Promise<Bid[]>}
     */
    async _loadBids(bidIds, project, forceReload) {
        let promises = [];

        _.each(bidIds, id => {
            promises.push(this._repos.bids.findById(id, forceReload));
        });

        return Promise.all(promises)
            .then(bidsJson => {
                let bids = {};
                for (let bidObject of bidsJson) {
                    const bid = new BidFactory().create(bidObject, this._repos, project);
                    bids[bid.id] = bid;
                }

                return bids;
            })
            .catch(err => {
                console.log(err);
            });
    }
}
