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

describe("Line item OH&P", () => {
    beforeEach(() => {
        // This line item has an ohp dependency contract to the ohp bid variable with a value of 1.5
        let lineItem = bid.entities.searchByTitle("line_item", "Labor Line Item")[0];
        return new Promise(resolve => {
            lineItem.once("updated", () => {
                resolve();
            });
            lineItem.reset();
        });
    });

    describe("should default to 1", () => {
        test("when there is not a configured dependency.", () => {
            // This line item data does not have a set ohp dependency contract.
            let lineItemWithoutOhp = bid.entities.searchByTitle("line_item", "general line item")[0];
            expect(lineItemWithoutOhp.config.dependencies.ohp).toBeUndefined();
            expect(lineItemWithoutOhp.ohp).toBe(1);
        });
        test("when ohp value is not a valid integer", () => {
            let lineItem = bid.entities.searchByTitle("line_item", "general line item")[0];
            lineItem.ohp = "a";
            expect(lineItem.ohp).toBe(1);
        });
    });

    test("should be overridable.", () => {
        let lineItem = bid.entities.searchByTitle("line_item", "Labor Line Item")[0];
        lineItem.override("ohp", false);

        expect(lineItem.ohp).toBe(1.5);
        lineItem.ohp = 2.2;
        expect(lineItem.ohp).toBe(2.2);
        expect(lineItem.isOverridden("ohp")).toBe(true);
    });

    describe("should change the line item cost", () => {
        test("when a set dependency contract not equal to 1", async () => {
            expect.assertions(2);

            let lineItem = bid.entities.searchByTitle("line_item", "Labor Line Item")[0];
            expect(lineItem.ohp).toBe(1.5);

            return new Promise(resolve => {
                lineItem.once("updated", () => {
                    expect(lineItem.cost).toBe(6);
                    resolve();
                });
                lineItem.base = 4;
            });
        });

        test("when the ohp is overriden", async () => {
            expect.assertions(2);

            // This line item has an ohp dependency contract to the ohp bid variable with a value of 1.5
            let lineItem = bid.entities.searchByTitle("line_item", "Labor Line Item")[0];
            expect(lineItem.ohp).toBe(1.5);

            return new Promise(resolve => {
                lineItem.once("updated", () => {
                    expect(lineItem.cost).toBe(8);
                    resolve();
                });
                lineItem.base = 4;
                lineItem.ohp = 2;
            });
        });
    });

    test("should set to 1 if cost is overriden", () => {
        expect.assertions(4);

        let lineItem = bid.entities.searchByTitle("line_item", "Labor Line Item")[0];
        expect(lineItem.ohp).toBe(1.5);
        expect(lineItem.cost).toBe(0);
        return new Promise(resolve => {
            lineItem.once("updated", () => {
                expect(lineItem.cost).toBe(5);
                expect(lineItem.ohp).toBe(1);

                resolve();
            });
            lineItem.cost = 5;
        });
    });
});

describe("Line item markup percent", () => {
    describe("should update to an equally distributed ratio", () => {
        test("when bid markup changes and line item is included.", async () => {
            expect.assertions(5);

            let lineItem = bid.entities.searchByTitle("line_item", "general line item")[0];
            expect(lineItem.isIncluded).toBe(true);
            expect(lineItem.markupPercent).toBe(15);
            expect(lineItem.isOverridden("markup_percent")).toBe(false);

            return new Promise(resolve => {
                lineItem.once("updated", () => {
                    expect(_.round(lineItem.markupPercent, 2)).toBe(21.74);
                    expect(lineItem.isOverridden("markup_percent")).toBe(true);
                    resolve();
                });
                bid.markup = 300;
            });
        });

        test("when bid margin changes and line item is included.", async () => {
            expect.assertions(5);
            let lineItem = bid.entities.searchByTitle("line_item", "general line item")[0];

            await new Promise(resolve => {
                lineItem.once("assessed", resolve);
                lineItem.reset();
            });

            expect(lineItem.isIncluded).toBe(true);
            expect(lineItem.markupPercent).toBe(15);
            expect(lineItem.isOverridden("markup_percent")).toBe(false);

            return new Promise(resolve => {
                lineItem.once("updated", () => {
                    expect(_.round(lineItem.markupPercent, 2)).toBe(17.25);
                    expect(lineItem.isOverridden("markup_percent")).toBe(true);
                    resolve();
                });
                bid.marginPercent = 20;
            });
        });
    });
});

//TODO: Test to ensuring assessing/assessed events only fire once
// even after bind() is called multiple times on the instance
