import filter from "lodash/filter";
import keyBy from "lodash/keyBy";
import each from "lodash/each";
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
   * @param {object} options
   * @param {boolean} options.isAutoSave indicate if this is the result of an auto-save
   * @returns {Promise<null>}
   */
  async save(project, { isAutoSave = false } = {}) {
    const properties = [
      "line_items",
      "fields",
      "components",
      "metrics",
      "field_groups",
      "assemblies",
      "component_groups",
      "dynamic_groups",
      "datatables",
    ];
    const promises = [];

    const exported = this._savingHelper.extract(project);
    const exportedJSON = JSON.stringify(exported);
    const bidIds = Object.keys(exported.bids);
    if (bidIds.length > 0) {
      for (let i = 0; i < bidIds.length; i++) {
        const bid = exported.bids[bidIds[i]];

        const toSave = {
          bids: {},
          project: exported.project,
        };
        toSave.bids[bid.id] = bid;

        properties.forEach(key => {
          const filtered = filter(exported[key], el => el.bid_id === bid.id);
          toSave[key] = keyBy(filtered, "id");
        });

        promises.push(this.repositories.projects.batchUpdate(project.id, toSave, { isAutoSave }));
      }
    } else if (exported.project.id) {
      // project id will not be defined if not project data needs to be saved.
      promises.push(this.repositories.projects.save(exported.project));
    }
    await Promise.all(promises);

    // check for new changes before clearing dirty flags because changes may have been made
    // while saving the project asynchonously
    const compareJSON = JSON.stringify(this._savingHelper.extract(project));
    if (compareJSON === exportedJSON) {
      each(project.bids, bid => {
        bid.pristine();
      });
      project.pristine();
    }
  }

  /**
   * Creates bid and attaches to project.
   *
   * @param {Project} project
   * @param {string} [title=New Bid]
   * @returns {Promise<Bid>}
   */
  async createBid(project, title) {
    try {
      title = title ? title : "New Bid";
      const bidData = await this.repositories.bids.create({ title: title, project_id: project.id });
      const bid = new BidFactory().create(bidData, this.context, project);
      bid.isActive = true;
      project.attachBid(bid);
      project.assess();
      return bid;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
