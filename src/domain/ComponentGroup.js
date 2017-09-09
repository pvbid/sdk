import BidEntity from "./BidEntity";

/**
 * Component Group Class
 * 
 * @export
 * @class ComponentGroup
 * @memberof module:PVBid/Domain
 * @extends {module:PVBid/Domain.BidEntity}
 */
export default class ComponentGroup extends BidEntity {
    /**
     * Creates an instance of ComponentGroup.
     * @param {object} componentGroupData 
     * @param {module:PVBid/Domain.Bid} bid 
     */
    constructor(componentGroupData, bid) {
        super();
        this.bid = bid;
        this._data = componentGroupData;
    }

    /**
     * Config Getter.
     * 
     */
    get config() {
        return this._data.config;
    }
}
