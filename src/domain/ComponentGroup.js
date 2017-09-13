import BidEntity from "./BidEntity";

/**
 * Component Group Class
 * 
 * @class ComponentGroup
 */
export default class ComponentGroup extends BidEntity {
    /**
     * Creates an instance of ComponentGroup.
     * @param {object} componentGroupData 
     * @param {Bid} bid 
     */
    constructor(componentGroupData, bid) {
        super();
        /**
         * Reference to the bid that the component group belongs to.
         * @type {Bid}
         */
        this.bid = bid;

        /**
         * Internal data for bid entity.
         * @type {object}
         */
        this._data = componentGroupData;
    }

    /**
     * Config Getter.
     * @type {object}
     */
    get config() {
        return this._data.config;
    }
}
