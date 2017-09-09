import BidEntity from "./BidEntity";

/**
 * Assembly Class
 * 
 * @export
 * @class Assembly
 * @memberof module:PVBid/Domain
 * @extends {module:PVBid/Domain.BidEntity}
 */
export default class Assembly extends BidEntity {
    /**
     * Creates an instance of Assembly.
     * @param {object} assemblyData 
     * @param {module:PVBid/Domain.Bid} bid 
     */
    constructor(assemblyData, bid) {
        super();
        this.bid = bid;
        this._data = assemblyData;
    }

    get config() {
        return this._data.config;
    }
    set config(val) {
        throw "Setting assembly config is not permitted.";
    }
}
