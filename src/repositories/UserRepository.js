import CacheRepository from "./CacheRepository";

export default class UserRepository extends CacheRepository {
    constructor(config) {
        super(config.base_uri + "users/", "user", "users", config);
    }
}
