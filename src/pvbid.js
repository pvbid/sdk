import PVBidContext from "./PVBidContext";
import UserRepository from "./repositories/UserRepository";
import Helpers from "./utils/Helpers";
import BaseWorkupService from "./domain/services/BaseWorkupService";
/**
 * @module PVBid
 */

/**
 * Creates a authorized context instance.
 *
 * @param {object} config
 * @param {string} config.token The auth token to access account data..
 * @param {string} [config.base_uri=https://api.pvbid.com/v2]
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
 * @param {string} [config.base_uri=https://api.pvbid.com/v2]
 * @returns {Promise<object>}
 * @property {string} token_type
 * @property {number} expires_in - Unix timestamp
 * @property {string} access_token
 * @property {string} refresh_token
 */
export const getAuthToken = function(username, password, config) {
  config = config ? config : {};
  config.base_uri = config.base_uri ? config.base_uri : "https://api.pvbid.com/v2";
  delete config.token; // auth header not required for token request

  const repo = new UserRepository(config);
  return repo.getAuthToken(username, password);
};

export const helpers = Helpers;
export const services = {
  BaseWorkupService: BaseWorkupService,
};
