import { cloneDeep, keyBy, mapValues } from "lodash";
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
     * @param {number} projectId The id of the project to be loaded
     * @param {object} options Loading options
     * @param {boolean} [options.loadBidEntities=true] Determines if the bids should be loaded with their entities. They can be loaded later with bid.load() if 
     * @returns {Promise<Project>}
     */
    async load(projectId, { loadBidEntities = true } = {}) {
        try {
            // load project data
            const projectData = await this.context.repositories.projects.findById(projectId);
            projectData.prediction_models = await this._loadPredictionModels();

            // instantiate project and bids
            const project = new Project(projectData, new ProjectService(this.context));
            projectData.bids.forEach(bidData => {
                const bid = new BidFactory().create(bidData, this.context, project);
                project.attachBid(bid);
            });

            // load bid data
            if (loadBidEntities) {
                const loadingPromises = Object.values(project.bids).map(bid => bid.load({ skipSave: true }));
                await Promise.all(loadingPromises);
            }

            project.bind();
            return project;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Generate a new project instance based on the original data from the given project.
     * For safety, any methods involving repositories or persistance are absent in the clone.
     *
     * @param {Project} project The project instance to make a virtual clone of.
     * @param {number[]} bidIds Optionally limit the bids that get cloned into the virtual project clone by giving their IDs here.
     * @return {Project}
     */
    loadVirtualClone(project, bidIds=null) {
        const projectData = cloneDeep(project._original);
        const virtualProject = new Project(projectData, new ProjectService(this.context));

        // remove dangerous properties and methods that allow for persistance or repo access
        const dangerousMethods = ["attachUser", "detachUser", "createBid", "save", "clone"];
        dangerousMethods.forEach(method => {
            virtualProject[method] = undefined;
        });

        // load the bids
        let originalBids = bidIds
            ? bidIds.map(id => project.bids[id])
            : Object.values(project.bids);

        const bids = this._loadVirtualBids(originalBids, virtualProject);
        bids.forEach(bid => {
            virtualProject.attachBid(bid);
        });

        virtualProject.bind();
        return virtualProject;
    }

    /**
     * Generates virtual bid clones for the virtual project clone.
     *
     * @param {Bid[]} originalBids Bid instances from the original project
     * @param {Project} virtualProject The virtual project clone to attach bid clones too
     * @return {Bid[]} Clones of the given bids
     */
    _loadVirtualBids(originalBids, virtualProject) {
        let bids = [];
        const dangerousMethods = [
            "removeAssembly",
            "addAssemblies",
            "recover",
            "clone",
            "delete",
            "addLineItem",
            "addMetric",
            "addField"
        ];
        originalBids.forEach(originalBid => {
            const bidObject = originalBid.exportDataWithEntities();
            const bid = new BidFactory().create(bidObject, this.context, virtualProject);

            // remove dangerous methods from the bid (dangerous methods involve repositories and persistance)
            dangerousMethods.forEach(method => {
                bid[method] = undefined;
            });

            bids.push(bid);
        });
        return bids;
    }

    /**
     * Load a formatted list of prediction models keyed by their line item def id
     *
     * @return {Promise<Object>} Prediction models keyed by their line item def id
     */
    async _loadPredictionModels() {
        const predictionModels = await this.context.repositories.predictionModels.get();
        const keyedPredictionModels = keyBy(predictionModels, 'line_item_def_id');
        const formattedPredictionModels = mapValues(keyedPredictionModels, (model) => ({
            models: model.models,
            contribution_weight: model.contribution_weight,
            use_count: model.use_count,
        }));
        return formattedPredictionModels;
    }
}
