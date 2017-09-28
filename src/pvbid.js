import PVBidContext from "./PVBidContext";
import UserRepository from "./repositories/UserRepository";
/**
 * @module PVBid
 */

/**
 * Creates a authorized context instance.
 * 
 * @param {object} config 
 * @param {string} config.token The auth token to access account data..
 * @param {string} [config.base_uri=http://api.pvbid.com/v2] 
 * @return {PVBidContext}
 */
export const createContext = function(config) {
    return new PVBidContext(config);
};

/**
 * Obtains a user access token and refresh_token.
 * 
 * @param {string} username - The user's email address is used
 * @param {string} password
 * @param {object} config 
 * @param {string} [config.base_uri=http://api.pvbid.com/v2] 
 * @returns {Promise<object>}
 * @property {string} token_type
 * @property {number} expires_in - Unix timestamp
 * @property {string} access_token
 * @property {string} refresh_token
 */
export const getAuthToken = function(username, password, config) {
    config = config ? config : {};
    config.base_uri = config.base_uri ? config.base_uri : "https://api.pvbid.com/v2";

    const repo = new UserRepository(config);
    return repo.getAuthToken(username, password);
};
