import _ from "lodash";
import Bid from "../Bid";
import Field from "../Field";
import Metric from "../Metric";
import Assembly from "../Assembly";
import LineItem from "../LineItem";
import Component from "../Component";
import Datatable from "../Datatable";
import FieldGroup from "../FieldGroup";
import BidVariable from "../BidVariable";
import ComponentGroup from "../ComponentGroup";

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
    create(bidData, bidService) {
        this._keyBidEntities(bidData);
        let bid = new Bid(bidData, bidService);
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
