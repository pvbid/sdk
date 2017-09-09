import _ from "lodash";
import Project from "../Project";
import ProjectSavingHelper from "./ProjectSavingHelper";

/**
 * 
 * @param {ProjectRepository} projectRepository 
 * @param {BidService} bidService 
 */
export default class ProjectService {
    constructor(projectRepository, bidService) {
        this.repository = projectRepository;
        this._bidService = bidService;
        this._projects = {};
        this._savingHelper = new ProjectSavingHelper();
    }

    /**
     * 
     * @param {number} projectId 
     * @returns {Promise<Project>}
     */
    async get(projectId) {
        if (!_.isUndefined(this._projects[projectId])) {
            return Promise.resolve(this._projects[projectId]);
        } else {
            try {
                const projectData = await this.repository.findById(projectId);
                const project = new Project(projectData);
                const bidIds = project.bids.map(b => b.id);
                project.bids = await this._bidService.loadBids(bidIds, project);

                project.bind();
                this._projects[project.id] = project;
                return project;
            } catch (error) {
                return Promise.reject(error);
            }
        }
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
        return this.repository
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
}
