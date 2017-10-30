import _ from "lodash";

import BaseRepository from "./BaseRepository";

export default class ProjectRepository extends BaseRepository {
    constructor(config) {
        super(config.base_uri + "/projects/", "project", "projects", config);
    }

    async attachBid(projectId, bidId) {
        return this.http.post(this.endpoint + projectId + "/bids/" + bidId).then(function(response) {
            return response.data.data;
        });
    }

    async detachBid(projectId, bidId) {
        return this.http.delete(this.endpoint + projectId + "/bids/" + bidId).then(function(response) {
            return response.data.data;
        });
    }

    async attachUser(projectId, userId) {
        return this.http.post(this.endpoint + projectId + "/users/" + userId).then(function(response) {
            return response.data.data;
        });
    }

    async detachUser(projectId, userId) {
        return this.http.delete(this.endpoint + projectId + "/users/" + userId).then(function(response) {
            return response.data.data;
        });
    }

    async batchUpdate(projectId, data) {
        return this.http.put(this.endpoint + projectId + "/batch/", data).then(function(response) {
            return response.data.data;
        });
    }

    async clone(projectId) {
        return this.http.post(this.endpoint + projectId + "/clone").then(function(response) {
            return response.data.data.project;
        });
    }
}
