import _ from "lodash";
import Project from "./domain/Project";

export default class ProjectService {
    constructor(projectRepository, bidService) {
        this.repository = projectRepository;
        this._bidService = bidService;
        this._projects = {};
    }

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

    async save(project) {
        return project;
    }

    async reconcile(project) {
        throw "reconciliation is not implemented";
    }
}
