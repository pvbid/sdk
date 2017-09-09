import PVBidContext from "./PVBidContext";

/**
 * @module PVBid
 */

/**
  * @param {object} config
  * @memberof module:PVBid
  */
export const createContext = function(config) {
    return new PVBidContext(config);
};
