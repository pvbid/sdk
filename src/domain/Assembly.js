import BidEntity from "./BidEntity";

export default class Assembly extends BidEntity {
    constructor(assemblyData, bid) {
        super();
        this.bid = bid;
        this._data = assemblyData;
    }

    get title() {
        return this._data.title;
    }
    set title(val) {
        this._data.title = val;
    }

    get config() {
        return this._data.config;
    }
    set config(val) {
        throw "Setting assembly config is not permitted.";
    }
}
