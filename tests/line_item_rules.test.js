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
let project, bid, field, lineItem, metric;

describe("Testing Line Item Rules", () => {
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

    describe("Rule expression", () => {
        test("should include line item when (a > b)", async () => {
            expect.assertions(5);

            let lineItem = bid.entities.searchByTitle("line_item", "On With Rule Value Expression - Watts > Wage")[0];
            let wattsMetric = bid.entities.searchByTitle("metric", "watts")[0];
            await new Promise(resolve => {
                lineItem.once("assessed", () => {
                    expect(lineItem.isIncluded).toBe(false);
                    resolve();
                });
                wattsMetric.value = 0;
            });

            await new Promise(resolve => {
                expect(lineItem.isIncluded).toBe(false);

                lineItem.once("assessed", () => {
                    expect(lineItem.isIncluded).toBe(true);
                    resolve();
                });
                wattsMetric.value = 36;
            });

            await new Promise(resolve => {
                expect(lineItem.isIncluded).toBe(true);

                lineItem.once("assessed", () => {
                    expect(lineItem.isIncluded).toBe(false);
                    resolve();
                });
                wattsMetric.value = 15;
            });
        });

        test("should exclude line item when (a > b)", async () => {
            expect.assertions(5);

            let lineItem = bid.entities.searchByTitle("line_item", "On With Rule Value Expression - Watts > Wage")[0];
            lineItem.config.rules[0].activate_on = false;

            let wattsMetric = bid.entities.searchByTitle("metric", "watts")[0];
            await new Promise(resolve => {
                lineItem.once("assessed", () => {
                    expect(lineItem.isIncluded).toBe(true);
                    resolve();
                });
                wattsMetric.value = 0;
            });

            await new Promise(resolve => {
                expect(lineItem.isIncluded).toBe(true);

                lineItem.once("assessed", () => {
                    expect(lineItem.isIncluded).toBe(false);
                    resolve();
                });
                wattsMetric.value = 36;
            });

            await new Promise(resolve => {
                expect(lineItem.isIncluded).toBe(false);

                lineItem.once("assessed", () => {
                    expect(lineItem.isIncluded).toBe(true);
                    resolve();
                });
                wattsMetric.value = 15;
            });
        });
    });
});
