import _ from "lodash";
import BidFactory from "../factories/BidFactory";
import ProjectSavingHelper from "./ProjectSavingHelper";

/**
 *
 * @param {ProjectRepository} projectRepository
 * @param {BidService} bidService
 */
export default class ProjectService {
    /**
     * Creates an instance of ProjectService.
     * @param {PVBidContext} context
     */
    constructor(context) {
        this.context = context;
        this.repositories = context.repositories;
        this._savingHelper = new ProjectSavingHelper();
    }

    /**
     * Saves project and underlying bids.
     *
     * @param {Project} project
     * @returns {Promise<null>}
     */
    async save(project) {
        const properties = [
            "line_items",
            "fields",
            "components",
            "metrics",
            "field_groups",
            "assemblies",
            "component_groups",
            "datatables"
        ];
        const promises = [];

        const exported = this._savingHelper.extract(project);
        const bidIds = Object.keys(exported.bids);
        for (let i = 0; i < bidIds.length; i++) {
            const bid = exported.bids[bidIds[i]];

            const toSave = {
                bids: {},
                project: exported.project
            };
            toSave.bids[bid.id] = bid;

            properties.forEach(key => {
                const filtered = _.filter(exported[key], el => el.bid_id === bid.id);
                toSave[key] = _.keyBy(filtered, "id");
            });

            promises.push(this.repositories.projects.batchUpdate(project.id, toSave));
        }

        await Promise.all(promises);
        _.each(project.bids, bid => {
            bid.pristine();
        });
        project.pristine();
    }

    /**
     * Creates bid and attaches to project.
     *
     * @param {Project} project
     * @param {string} [title=New Bid]
     * @returns {Promise<Project>}
     */
    async createBid(project, title) {
        try {
            title = title ? title : "New Bid";
            const bidData = await this.repositories.bids.create({ title: title, project_id: project.id });
            const bid = new BidFactory().create(bidData, this.context, project);
            bid.isActive = true;
            project.attachBid(bid);
            project.assess();
            return project;
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
