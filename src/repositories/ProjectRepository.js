import _ from "lodash";

import BaseRepository from "./BaseRepository";

export default class ProjectRepository extends BaseRepository {
    constructor(baseUri, httpProvider) {
        super(baseUri + "/projects/", "project", "projects", httpProvider);
    }

    async findById(id, forceReload) {
        if (
            _.isEmpty(this.collection) ||
            _.isUndefined(this.collection[id]) ||
            _.isUndefined(this.collection[id].bids) ||
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
        return this.http.delete(this.endpoint + projectId + "/bids/" + bidId).then(function(response) {
            return response.data.data;
        });
    }

    batchUpdate(projectId, data) {
        return this.http.put(this.endpoint + projectId + "/batch/", data).then(function(response) {
            return response.data.data;
        });
    }
}
