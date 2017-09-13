import CacheRepository from "./CacheRepository";

export default class TagRepository extends CacheRepository {
    constructor(config) {
        super(config.base_uri + "tags/", "tag", "tags", config);
    }
}
