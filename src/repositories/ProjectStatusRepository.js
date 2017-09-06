import BaseRepository from "./BaseRepository";

export default class ProjectStatusRepository extends BaseRepository {
    constructor(baseUri, httpProvider) {
        super(baseUri + "/project_statuses/", "project_status", "project_statuses", httpProvider);
    }
}
