import BidEntity from "./BidEntity";

export default class ComponentGroup extends BidEntity {
    constructor(componentGroupData, bid) {
        super();
        this.bid = bid;
        this._data = componentGroupData;
    }
    get id() {
        return this._data.id;
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
        throw "Setting component group config is not permitted.";
    }
}
