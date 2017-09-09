import BidEntity from "./BidEntity";

/**
 * Bid Variable Class
 * 
 * @export
 * @class BidVariable
 * @memberof module:PVBid/Domain
 * @extends {module:PVBid/Domain.BidEntity}
 */
export default class BidVariable extends BidEntity {
    /**
     * Creates an instance of BidVariable.
     * @param {obect} bidVariableData 
     * @param {module:PVBid/Domain.Bid} bid 
     */
    constructor(bidVariableData, bid) {
        super(25);
        this.bid = bid;
        this._data = bidVariableData;
    }

    /**
     * Gets the bid entity type. 
     * 
     * @override
     * @readonly
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

    get config() {
        throw "Bid variables do not have config data.";
    }
    set config(val) {
        throw "Bid variables do not have config data.";
    }
}
