import BidEntity from "./BidEntity";

export default class BidVariable extends BidEntity {
    constructor(bidVariableData, bid) {
        super(25);
        this.bid = bid;
        this._data = bidVariableData;
    }
    get type() {
        return "bid_variable";
    }

    get title() {
        return this._data.title;
    }
    set title(val) {
        this._data.title = val;
    }

    get value() {
        return this._data.value;
    }
    set value(val) {
        this._data.value = val;
        this.emit("updated");
    }

    get config() {
        throw "Bid variables do not have config data.";
    }
    set config(val) {
        throw "Bid variables do not have config data.";
    }
}
