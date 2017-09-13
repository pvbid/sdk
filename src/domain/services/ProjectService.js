import _ from "lodash";
import BidFactory from "../factories/BidFactory";
import ProjectSavingHelper from "./ProjectSavingHelper";

/**
 * 
 * @param {ProjectRepository} projectRepository 
 * @param {BidService} bidService 
 */
export default class ProjectService {
    constructor(repositories) {
        this.repositories = repositories;
        this._savingHelper = new ProjectSavingHelper();
    }

    /**
     * 
     * 
     * @param {Project} project 
     * @returns {Promise<null>}
     */
    async save(project) {
        const exported = this._savingHelper.extract(project);
        console.log("saved project data", exported);
        return this.repositories.projects
            .batchUpdate(project.id, exported)
            .then(() => {
                _.each(project.bids, bid => {
                    bid.pristine();
                });
                project.pristine();
                return;
            })
            .catch(err => console.log(err));
    }

    async reconcile(project) {
        throw "reconciliation is not implemented";
    }

    /**
     * Creates bid and attaches to project.
     * 
     * @param {Project} project
     * @param {string} [title=New Bid] 
     * @returns {Promise<Project}
     */
    async createBid(project, title) {
        try {
            title = title ? title : "New Bid";
            const bidData = await this.repositories.bids.create({ title: title, project_id: project.id });
            const bid = new BidFactory().create(bidData, this.repositories, project);
            bid.isActive = true;
            project.attachBid(bid);
            project.assess();
            return project;
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
