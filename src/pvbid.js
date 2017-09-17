import PVBidContext from "./PVBidContext";

/**
 * @module PVBid
 */

/**
  * @param {object} config
  */
export const createContext = function(config) {
    return new PVBidContext(config);
};
