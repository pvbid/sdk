import axios from "axios";
import _ from "lodash";
import BidService from "./BidService";
import ProjectService from "./ProjectService";
import ProjectRepository from "./repositories/ProjectRepository";
import BidRepository from "./repositories/BidRepository";
import ProjectStatusRepository from "./repositories/ProjectStatusRepository";

export default class PVBidContext {
    constructor(config) {
        if (_.isUndefined(config) || _.isUndefined(config.token)) {
            throw "Authoriziation token is not set. ";
        }

        this._token = config.token;
        axios.defaults.headers.common["Authorization"] = this._token;
        this._baseUrl = config.base_uri ? config.base_uri : "http://api.pvbid.com/v2";
        this.repositories = {
            projects: new ProjectRepository(this._baseUrl, axios),
            bids: new BidRepository(this._baseUrl, axios),
            projectStatuses: new ProjectStatusRepository(this._baseUrl, axios)
        };

        const _bidService = new BidService(this.repositories.bids);
        const _projectService = new ProjectService(this.repositories.projects, _bidService);

        this.services = {
            bids: _bidService,
            projects: _projectService
        };
    }
}
