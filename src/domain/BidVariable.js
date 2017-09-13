import BidEntity from "./BidEntity";

/**
 * Bid Variable Class
 */
export default class BidVariable extends BidEntity {
    /**
     * Creates an instance of BidVariable.
     * @param {object} bidVariableData 
     * @param {Bid} bid 
     */
    constructor(bidVariableData, bid) {
        super(25);
        /**
         * Reference to the bid that the bid variable belongs to.
         * @type {Bid}
         */
        this.bid = bid;
        this._data = bidVariableData;
    }

    /**
     * Gets the bid entity type. 
     */
    get type() {
        return "bid_variable";
    }

    get valueType() {
        return this._data.type;
    }

    set valueType(val) {
        this._data.type = val;
        this.dirty();
    }

    get title() {
        return this._data.title;
    }
    set title(val) {
        this._data.title = val;
        this.dirty();
    }

    get value() {
        return this._data.value;
    }
    set value(val) {
        this._data.value = val;
        this.dirty();
        this.emit("updated");
    }
}
