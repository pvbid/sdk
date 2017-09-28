import CacheRepository from "./CacheRepository";

export default class UserRepository extends CacheRepository {
    constructor(config) {
        super(config.base_uri + "users/", "user", "users", config);
    }

    /**
     * Obtains an access token for a user
     * 
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<object>}
     * @property {string} token_type
     * @property {number} expires_in - Unix timestamp
     * @property {string} access_token
     * @property {string} refresh_token
     */
    async getAuthToken(username, password) {
        this.endpoint = `${this.httpConfig.base_uri}/auth/token`;

        try {
            let response = await this.http.post(this.endpoint, { username: username, password: password });

            return response.data;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Gets the current user.
     * 
     * @returns {Promis<object>}
     * @property {number} id
     * @property {string} name
     * @property {string} email
     * @property {string} timezone
     * @property {string[]} permissions
     * @property {string[]} roles
     * @property {object} account
     * 
     */
    async me() {
        this.endpoint = `${this.httpConfig.base_uri}/users/me`;

        try {
            let response = await this.http.get(this.endpoint);

            return response.data.data.user;
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
