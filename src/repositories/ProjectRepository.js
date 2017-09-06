import BaseRepository from "./BaseRepository";
import isEmpty from "lodash/isEmpty";
import isUndefined from "lodash/isUndefined";

export default class ProjectRepository extends BaseRepository {
    constructor(baseUri, httpProvider) {
        super(baseUri + "/projects/", "project", "projects", httpProvider);
    }

    async findById(id, forceReload) {
        if (
            isEmpty(this.collection) ||
            isUndefined(this.collection[id]) ||
            isUndefined(this.collection[id].bids) ||
            forceReload
        ) {
            let response = await this.http.get(this.endpoint + id);
            this.collection[id] = response.data.data[this.map.single];

            return this.collection[id];
        } else {
            return this.collection[id];
        }
    }

    attachBid(projectId, bidId) {
        return this.http.post(this.endpoint + projectId + "/bids/" + bidId).then(function(response) {
            return response.data.data;
        });
    }

    detachBid(projectId, bidId) {
        return this.http.delete(this.baseUri + projectId + "/bids/" + bidId).then(function(response) {
            return response.data.data;
        });
    }
}
