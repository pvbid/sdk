import CacheRepository from "./CacheRepository";

export default class ProjectStatusRepository extends CacheRepository {
    constructor(config) {
        super(config.base_uri + "/project_statuses/", "project_status", "project_statuses", config);
    }
}
