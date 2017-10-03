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

describe("When bid markup reset occurs", () => {
    beforeEach(async () => {
        return new Promise(resolve => {
            bid.project.once("updated", () => {
                resolve();
            });
            bid.price = 3000;
        });
    });

    test("all line item markup_percents should loose their overrides.", async () => {
        let lineItem = bid.entities.searchByTitle("line_item", "modules")[0];
        expect.assertions(_.toArray(bid.entities.lineItems()).length + 1);
        expect(lineItem.isOverridden("markup_percent")).toBe(true);

        return new Promise(resolve => {
            lineItem.bid.project.once("updated", () => {
                _.each(bid.entities.lineItems(), li => {
                    expect(li.isOverridden("markup_percent")).toBe(false);
                });
                resolve();
            });
            bid.resetMarkup();
        });
    });

    test("all line item prices should loose their overrides.", async () => {
        let lineItem = bid.entities.searchByTitle("line_item", "modules")[0];

        expect.assertions(_.toArray(bid.entities.lineItems()).length + 1);
        expect(lineItem.isOverridden("price")).toBe(true);

        return new Promise(resolve => {
            lineItem.bid.project.once("updated", () => {
                _.each(bid.entities.lineItems(), li => {
                    expect(li.isOverridden("price")).toBe(false);
                });
                resolve();
            });

            bid.resetMarkup();
        });
    });
});

//TODO: Test locking/unlocking bid based on user permission, user in project, user being admin.
