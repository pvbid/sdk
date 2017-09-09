import BidEntity from "./BidEntity";

/**
 * Field Group Class
 * 
 * @export
 * @class FieldGroup
 * @memberof module:PVBid/Core
 * @extends {BidEntity}
 */
export default class FieldGroup extends BidEntity {
    /**
     * Creates an instance of FieldGroup.
     * @param {object} fieldGroupData 
     * @param {Bid} bid 
     */
    constructor(fieldGroupData, bid) {
        super();
        this.bid = bid;
        this._data = fieldGroupData;
    }

    get title() {
        return this._data.title;
    }
    set title(val) {
        this._data.title = val;
    }

    get type() {
        return this._data.type;
    }
    set type(val) {
        throw "Chainging type is not permitted.";
    }

    get config() {
        return this._data.config;
    }
    set config(val) {
        throw "Setting field group config is not permitted.";
    }
}
