import BidEntity from "./BidEntity";
import _ from "lodash";

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
        this._original = _.cloneDeep(fieldGroupData);
        this._data = fieldGroupData;
    }

    /**
     * Holds the Field Group configuration information.
     * @type {object}
     */
    get config() {
        return this._data.config;
    }

    /**
     * Determines if the field group is changed for it's original data.
     * 
     * @returns {boolean} 
     */
    isDirty() {
        return this._is_dirty || !_.isEqual(this._data.config, this._original.config);
    }

    /**
     * Flags the field group and corresponding bid as dirty and to be saved.
     */
    dirty() {
        this.bid.dirty();
        super.dirty();
    }
}
