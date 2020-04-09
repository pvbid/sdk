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
   * @return {Promise<BidEntity[]>} Filtered list of projects
   */
  async get(params) {
    return super.get(params);
  }

  /**
   * Adds a bid to a project
   *
   * @param {number} projectId The project's id
   * @param {number} bidId The bid's id
   * @return {Promise<Object>} API response status
   */
  async attachBid(projectId, bidId) {
    return this.http.post(this.endpoint + projectId + "/bids/" + bidId).then(function(response) {
      return response.data.data;
    });
  }

  /**
   * Removes a bid from a project
   *
   * @param {number} projectId The project's id
   * @param {number} bidId The bid's id
   * @return {Promise<Object>} API response status
   */
  async detachBid(projectId, bidId) {
    return this.http.delete(this.endpoint + projectId + "/bids/" + bidId).then(function(response) {
      return response.data.data;
    });
  }

  /**
   * Adds a user to a project
   *
   * @param {number} projectId The project's id
   * @param {number} userId The user's id
   * @return {Promise<Object>} API response status
   */
  async attachUser(projectId, userId) {
    return this.http.post(this.endpoint + projectId + "/users/" + userId).then(function(response) {
      return response.data.data;
    });
  }

  /**
   * Removes a user from a project
   *
   * @param {number} projectId The project's id
   * @param {number} userId The user's id
   * @return {Promise<Object>} API response status
   */
  async detachUser(projectId, userId) {
    return this.http.delete(this.endpoint + projectId + "/users/" + userId).then(function(response) {
      return response.data.data;
    });
  }

  /**
   * Allows persistance of underlying bid data along with project
   *
   * @param {number} projectId
   * @param {Object} data The project data to update
   * @param {object} options
   * @param {boolean} options.isAutoSave Indicates that this batch update is due to the auto-save. Useful for debugging.
   * @return {Promise<Object>} The API response
   */
  async batchUpdate(projectId, data, { isAutoSave = false } = {}) {
    const config = isAutoSave ? { params: { is_auto: isAutoSave } } : {};
    return this.http
      .put(this.endpoint + projectId + "/batch/", data, config)
      .then(response => response.data.data);
  }

  /**
   * Clones a project
   *
   * @param {number} projectId
   * @return {Promise<BidEntity>} Project clone
   */
  async clone(projectId) {
    return this.http.post(this.endpoint + projectId + "/clone").then(function(response) {
      return response.data.data.project;
    });
  }
}
