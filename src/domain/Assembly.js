import BidEntity from "./BidEntity";

/**
 * Assembly Class
 */
export default class Assembly extends BidEntity {
    /**
     * Creates an instance of Assembly.
     * @param {object} assemblyData 
     * @param {Bid} bid 
     */
    constructor(assemblyData, bid) {
        super();
        /**
         * Reference to the bid that the assembly belongs to.
         * @type {Bid}
         */
        this.bid = bid;
        this._data = assemblyData;
    }

    removeBidEntity(type, id) {
        const typeKey = type + "s";
        _.pull(this._data.config[typeKey], id);
        this.dirty();
    }

    /**
     * @type {object}
     */
    get config() {
        return this._data.config;
    }
}
