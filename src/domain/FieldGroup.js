import BidEntity from "./BidEntity";

/**
 * Field Group Class
 */
export default class FieldGroup extends BidEntity {
    /**
     * Creates an instance of FieldGroup.
     * @param {object} fieldGroupData 
     * @param {Bid} bid 
     */
    constructor(fieldGroupData, bid) {
        super();
        /**
         * Reference to the bid that the field group belongs to.
         * @type {Bid}
         */
        this.bid = bid;
        this._data = fieldGroupData;
    }

    /**
     * Holds the Field Group configuration information.
     * @type {object}
     */
    get config() {
        return this._data.config;
    }
}
