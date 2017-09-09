import PVBidContext from "./PVBidContext";

/**
 * @namespace PVBid
 */

/**
  * @param {object} config
  */
export const createContext = function(config) {
    return new PVBidContext(config);
};
