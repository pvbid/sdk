//const PVBid = require("../src/pvbid.js");
//import { pvbid } from "../src/pvbid";
import _ from "lodash";
import jest from "jest";
var axios = require("axios");
var jsonfile = require("jsonfile");
const PVBid = require("../src/pvbid.js");
var MockAdapter = require("axios-mock-adapter");
import LineItemScaffolding from "../src/domain/scaffolding/LineItemScaffolding";

let context = PVBid.createContext({ token: "Bearer Token", base_uri: "http://api.pvbid.local/v2" });
let project;
let bid;
let lineItem;
beforeAll(() => {
    return init();
});

async function init() {
    // This sets the mock adapter on the default instance
    var mock = new MockAdapter(axios);

    // Mock any GET request to /users
    // arguments for reply are (status, data, headers)
    let mockedLineItem = LineItemScaffolding.create(190, "The New Line Item");
    mockedLineItem.id = 1000001;
    mock.onPost("http://api.pvbid.local/v2/bids/190/line_items/").reply(200, {
        data: {
            line_item: mockedLineItem
        }
    });
    project = await new Promise(resolve => {
        jsonfile.readFile("./tests/simple-test-project.json", (err, data) => {
            mock.onGet("http://api.pvbid.local/v2/projects/461").reply(200, {
                data: { project: data.project }
            });
            mock.onGet("http://api.pvbid.local/v2/bids/190").reply(200, {
                data: { bid: data.bid }
            });
            mock.onGet("http://api.pvbid.local/v2/users/me").reply(200, {
                data: { user: data.user }
            });
            mock.onGet("http://api.pvbid.local/v2/predictions/").reply(200, {
                data: { prediction_models: data.prediction_models }
            });

            context.getProject(461).then(p => {
                resolve(p);
            });
        });
    });
    return new Promise(resolve => {
        bid = _.toArray(project.bids)[0];
        project.on("assessed", "test", () => {
            resolve();
        });
        bid.reassessAll(true);
    });
}

describe("Bid validator", () => {
    test("should catch invalid metric manipulation references.", () => {
        expect(bid.isValid()).toBe(true);
        let watts = bid.entities.searchByTitle("metric", "watts")[0];
        watts._data.config.manipulations = [
            {
                id: 4394,
                formula: "ORIGINAL + A",
                dependencies: { a: { type: "metric", field: "value", bid_entity_id: 477401 } }
            }
        ];
        let validations = bid.validate();
        expect(bid.isValid()).toBe(false);
        expect(validations[0].type).toBe("invalid_metric_manipulation_dependency");
    });

    test("should catch invalid metric manipulation assembly reference.", () => {
        let watts = bid.entities.searchByTitle("metric", "watts")[0];
        watts._data.config.manipulations = []; //reset
        bid.validate();
        expect(bid.isValid()).toBe(true);

        watts._data.config.manipulations = [
            {
                id: 4394,
                formula: "ORIGINAL + A",
                assembly_id: 15,
                dependencies: { a: { type: "bid", field: "cost", bid_entity_id: "bid" } }
            }
        ];
        let validations = bid.validate();
        expect(bid.isValid()).toBe(false);
        expect(validations[0].type).toBe("invalid_metric_manipulation_assembly_reference");
    });
});
//TODO: test all known validation error types to ensure they catch the problem.
//TODO: test bid rule list_field /list options
