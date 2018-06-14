import _ from "lodash";

import BaseRepository from "./BaseRepository";

export default class ProjectRepository extends BaseRepository {
    constructor(config) {
        super(config.base_uri + "/projects/", "project", "projects", config);
    }

    /**
     * Retrieves a list of projects
     *
     * @param {Object} [params] A set of parameters to filter the projects by.
     * @param {number} params.per_page Number of projects to to display per request (max 100)
     * @param {number} params.page Page number
     * @param {string} params.search Search term to apply to project's title
     * @param {string} params.sort_order 'asc' or 'desc'
     * @param {string} params.order_by The name of the property to sort the results by
     * @param {number[]} params.tag_ids List of tags to filter by (excluding this will include all tags)
     * @param {number[]} params.user_ids List of users to filter by (excluding this will include all users)
     * @return {object[]} Filtered list of projects
     */
    async get(params) {
        return super.get(params);
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
