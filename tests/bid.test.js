//const PVBid = require("../src/pvbid.js");
//import { pvbid } from "../src/pvbid";
import _ from "lodash";
var axios = require("axios");
var jsonfile = require("jsonfile");
const PVBid = require("../src/pvbid.js");
var MockAdapter = require("axios-mock-adapter");
import LineItemScaffolding from "../src/domain/scaffolding/LineItemScaffolding";

let context = PVBid.createContext({ token: "Bearer Token", base_uri: "http://api.pvbid.local/v2" });
let project;
let bid;

async function init(withEntities = true) {
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
            context.getProject(461, { loadBidEntities: withEntities }).then(p => {
                resolve(p);
            });
        });
    });
    bid = _.toArray(project.bids)[0];
    if (!withEntities) return;
    return new Promise(resolve => {
        project.on("assessed", "test", () => {
            resolve();
        });
        bid.reassessAll(true);
    });
}

describe("Un-loaded bid", () => {
    beforeAll(() => init(false));

    test('should still be able to activate/deactivate', () => {
        expect(bid.isActive).toBe(true);
        bid.isActive = false;
        expect(bid.isActive).toBe(false);
        bid.isActive = true;
        expect(bid.isActive).toBe(true);
    });

    test("isLoaded should be false", () => {
        expect(bid.isLoaded).toBe(false);
    });

    test("should not be assessable", () => {
        expect(bid.isAssessable()).toBe(false);
    });

    test("should be loadable", async () => {
        await bid.load({ skipSave: true });
        expect(bid.isLoaded).toBe(true);
    })
});

describe("Loaded Bid", () => {
    beforeAll(() => init());

    test("isLoaded should be true", () => {
        expect(bid.isLoaded).toBe(true);
    });

    test("should be assessable", () => {
        expect(bid.isAssessable()).toBe(true);
    });

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
    
    describe("when a bid uses predictive pricing", () => {
        beforeAll(() => {
            return new Promise(resolve => {
                bid.project.once("updated", resolve);
                bid.entities.variables().predictive_pricing.value = true;
            });
        });
    
        afterAll(() => {
            return new Promise(resolve => {
                bid.project.once("updated", resolve);
                bid.entities.variables().use_computed.value = true;
                bid.entities.variables().predictive_pricing.value = false;
            });
        });
    
        describe("isPredicted status should represent that of the bids line items", () => {
            test("when line items are not predicted", () => {
                expect.assertions(2);
                expect(bid.isPredicted("cost")).toBe(false);
                expect(bid.isPredicted("price")).toBe(false);
            });
    
            test("when line items are predicted", async () => {
                expect.assertions(2);
                await new Promise(resolve => {
                    bid.project.once("updated", resolve);
                    bid.entities.variables().use_computed.value = false;
                });
                expect(bid.isPredicted("cost")).toBe(true);
                expect(bid.isPredicted("price")).toBe(true);
            });
        });
    });
});


//TODO: Test locking/unlocking bid based on user permission, user in project, user being admin.
