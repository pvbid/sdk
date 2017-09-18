import PVBidContext from "./PVBidContext";

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
