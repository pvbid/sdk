export default class AssemblyImplementService {
    constructor(repositories) {
        this._repos = repositories;
    }

    async implement(bid, assemblyMapIds) {
        try {
            for (let aId of assemblyMapIds) {
                await this._repos.assemblies.implement(bid.id, aId);
            }

            return true;
        } catch (err) {
            return Promise.reject(err);
        }
    }
}
