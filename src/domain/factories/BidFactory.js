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
import BidService from "../services/BidService";

/**
 * Factory class to generate a {@link Bid} instance with internal bid entities.
 * 
 * @class BidFactory
 */
export default class BidFactory {
    /**
     * Creates an instance of BidFactory.
     */
    constructor() {
        this._entities = [
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

    /**
      * Creates a Bid object from bid data.
      * 
      * @param {object} bidData 
      * @param {PVBidContext} context       
      * @param {Project} project 
      * @returns  
      */
    create(bidData, context, project) {
        const bidService = new BidService(context);
        this._keyBidEntities(bidData);
        let bid = new Bid(bidData, bidService);
        this._createBidEntities(bid, bidData);
        bid.project = project;
        bid.bind();

        if (bid.isAssessable()) {
            bid.reassessAll();
        }

        return bid;
    }

    /**
     * Reloads a bids internal settings while keeping the Bid instance.
     * 
     * @param {Bid} bid 
     * @param {object} bidData 
     */
    reload(bid, bidData) {
        bid.clearEntityBindings();
        this._keyBidEntities(bidData);
        bid._data = bidData;
        bid._original = _.cloneDeep(bidData);
        this._createBidEntities(bid, bidData);
        bid.bind();

        if (bid.isAssessable()) {
            bid.reassessAll(true);
        }
    }

    /**
     * Keys all bid entities  by their id.
     * 
     * @param {object} bidData 
     */
    _keyBidEntities(bidData) {
        for (let key of this._entities) {
            if (key !== "variables") {
                bidData[key] = _.keyBy(bidData[key], "id");
            }
        }
    }

    /**
     * Creates the bid entity class for each bid entity data object.
     * 
     * @param {Bid} bid 
     * @param {object} bidData 
     */
    _createBidEntities(bid, bidData) {
        for (let key of this._entities) {
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
                case "component_groups":
                    for (const i in bidData[key]) {
                        bidData[key][i] = new ComponentGroup(bidData[key][i], bid);
                    }
                    break;
                case "field_groups":
                    for (const i in bidData[key]) {
                        bidData[key][i] = new FieldGroup(bidData[key][i], bid);
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
