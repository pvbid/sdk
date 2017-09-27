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

    /**
     * @type {string}
     */
    get valueType() {
        return this._data.type;
    }

    /**
     * @type {string}
     */
    set valueType(val) {
        this._data.type = val;
        this.dirty();
    }

    /**
     * @type {string}
     */
    get title() {
        return this._data.title;
    }

    /**
     * @type {string}
     */
    set title(val) {
        this._data.title = val;
        this.dirty();
    }

    /**
     * @type {?(number|string|boolean)}
     */
    get value() {
        return this._data.value;
    }

    /**
     * @type {?(number|string|boolean)}
     */
    set value(val) {
        this._data.value = val;
        this.dirty();
        this.emit("updated");
    }

    /**
     * @type {object}
     */
    get config() {
        return {};
    }

    /**
     * Gets an array of dependant bid entities that rely on the Bid Variable.
     * 
     * @returns {BidEntity[]}
     */
    dependants() {
        return this.bid.entities.getDependants("bid_variable", this.id);
    }
}
