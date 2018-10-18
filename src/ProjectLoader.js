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
     * @param {PVBidContext} pvbidContext 
     */
    constructor(pvbidContext) {
        this.context = pvbidContext;
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
            const projectData = await this.context.repositories.projects.findById(projectId, forceReload);
            const bidIds = projectData.bids.map(b => b.id);
            const projectService = new ProjectService(this.context);
            projectData.prediction_models = await this._loadPredictionModels();
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
            const bidObject = await this.context.repositories.bids.findById(bidId, forceReload);
            return new BidFactory().create(bidObject, this.context, project);
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
            promises.push(this.context.repositories.bids.findById(id, forceReload));
        });

        return Promise.all(promises)
            .then(bidsJson => {
                let bids = {};
                for (let bidObject of bidsJson) {
                    const bid = new BidFactory().create(bidObject, this.context, project);
                    bids[bid.id] = bid;
                }

                return bids;
            })
            .catch(err => {
                console.log(err);
            });
    }

    /**
     * Load a formatted list of prediction models keyed by their line item def id
     *
     * @return {Promise<Object>} Prediction models keyed by thier line item def id
     */
    async _loadPredictionModels() {
        const predictionModels = await this.context.repositories.predictionModels.get();
        const keyedPredictionModels = _.keyBy(predictionModels, 'line_item_def_id');
        const formattedPredictionModels = _.mapValues(keyedPredictionModels, (model) => ({
            models: model.models,
            contribution_weight: model.contribution_weight,
            use_count: model.use_count,
        }));
        return formattedPredictionModels;
    }
}
