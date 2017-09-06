import PVBidContext from "./PVBidContext";

export const createContext = function(config) {
    return new PVBidContext(config);
};
