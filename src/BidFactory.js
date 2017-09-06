import _ from "lodash";
import Bid from "./domain/Bid";
import Field from "./domain/Field";
import Metric from "./domain/Metric";
import Assembly from "./domain/Assembly";
import LineItem from "./domain/LineItem";
import Component from "./domain/Component";
import Datatable from "./domain/Datatable";
import FieldGroup from "./domain/FieldGroup";
import BidVariable from "./domain/BidVariable";
import ComponentGroup from "./domain/ComponentGroup";

export default class BidFactory {
    constructor() {
        this._map = [
            "fields",
            "metrics",
            "line_items",
            "component_groups",
            "components",
            "datatables",
            "field_groups",
            "assemblies",
            "assembly_maps",
            "variables"
        ];
    }
    create(bidData) {
        this._keyBidEntities(bidData);
        let bid = new Bid(bidData);
        this._createBidEntities(bid, bidData);

        return bid;
    }
    _keyBidEntities(bidData) {
        for (let key of this._map) {
            if (key !== "variables") {
                bidData[key] = _.keyBy(bidData[key], "id");
            }
        }
    }

    _createBidEntities(bid, bidData) {
        for (let key of this._map) {
            switch (key) {
                case "line_items":
                    for (let i in bidData[key]) {
                        bidData[key][i] = new LineItem(bidData[key][i], bid);
                    }
                    break;
                case "metrics":
                    for (const i in bidData[key]) {
                        bidData[key][i] = new Metric(bidData[key][i], bid);
                    }
                    break;
                case "components":
                    for (const i in bidData[key]) {
                        bidData[key][i] = new Component(bidData[key][i], bid);
                    }
                    break;
                case "fields":
                    for (const i in bidData[key]) {
                        bidData[key][i] = new Field(bidData[key][i], bid);
                    }
                    break;
                case "assemblies":
                    for (const i in bidData[key]) {
                        bidData[key][i] = new Assembly(bidData[key][i], bid);
                    }
                    break;
                case "datatables":
                    for (const i in bidData[key]) {
                        bidData[key][i] = new Datatable(bidData[key][i], bid);
                    }
                    break;
                case "variables":
                    for (const i in bidData[key]) {
                        bidData[key][i] = new BidVariable(bidData[key][i], bid);
                    }

                default:
                    break;
            }
        }
    }
}
