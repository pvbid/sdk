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
    mock.onPut("http://api.pvbid.local/v2/projects/461/batch/").reply(200, {
        data: {}
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

describe("When enabled, projects should auto save", () => {
    beforeAll(() => {
        project.enableAutoSave(100);
    });

    test(
        "after no less than 1 second.",
        async () => {
            expect.assertions(2);

            return new Promise(resolve => {
                let start = 0;
                project.once("changed", () => {
                    start = Date.now();
                });
                project.once("saving", () => {
                    let diff = Date.now() - start;
                    console.log("saving diff", diff);
                    expect(diff).toBeGreaterThanOrEqual(1000);
                    expect(diff).toBeLessThan(1500);

                    resolve();
                });

                project.title = "new title";
            });
        },
        10000
    );

    test("after a project change.", async () => {
        expect.assertions(1);

        return new Promise(resolve => {
            project.once("saved", () => {
                expect(project.title).toBe("new title 2");
                resolve();
            });
            project.title = "new title 2";
        });
    });

    test("after a bid change.", async () => {
        expect.assertions(1);

        return new Promise(resolve => {
            bid.project.once("saved", () => {
                expect(bid.price).toBe(3000);
                resolve();
            });
            bid.price = 3000;
        });
    });

    test("after a line item change.", async () => {
        let lineItem = bid.entities.searchByTitle("line_item", "modules")[0];
        expect.assertions(1);

        return new Promise(resolve => {
            bid.project.once("saved", () => {
                expect(lineItem.price).toBe(3000);
                resolve();
            });
            lineItem.price = 3000;
        });
    });
});
