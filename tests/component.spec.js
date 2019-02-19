import _ from "lodash";
import jest from "jest";

const axios = require("axios");
const jsonfile = require("jsonfile");
const MockAdapter = require("axios-mock-adapter");
const PVBid = require("../src/pvbid.js");

const context = PVBid.createContext({ token: "Bearer Token", base_uri: "http://api.pvbid.local/v2" });
let project;
let bid;
beforeAll(() => init());

async function init() {
    // This sets the mock adapter on the default instance
    const mock = new MockAdapter(axios);

    project = await new Promise((resolve) => {
        jsonfile.readFile("./tests/simple-test-project.json", (err, data) => {
            mock.onGet("http://api.pvbid.local/v2/projects/461").reply(200, {
                data: { project: data.project },
            });
            mock.onGet("http://api.pvbid.local/v2/bids/190").reply(200, {
                data: { bid: data.bid },
            });
            mock.onGet("http://api.pvbid.local/v2/users/me").reply(200, {
                data: { user: data.user },
            });
            mock.onGet("http://api.pvbid.local/v2/predictions/").reply(200, {
                data: { prediction_models: data.prediction_models },
            });

            context.getProject(461).then((p) => {
                resolve(p);
            });
        });
    });
    return new Promise((resolve) => {
        bid = _.toArray(project.bids)[0];
        project.on("assessed", "test", () => {
            resolve();
        });
        bid.reassessAll(true);
    });
}

describe("Component data modal", () => {
    test("should expose componentGroupId", () => {
        const component = bid.entities.searchByTitle("component", "Modules")[0];
        expect(component.componentGroupId).toBe(813);
    });
});

describe("Overwrite indication", () => {
    let $component;
    beforeEach(async () => {
        $component = bid.entities.components()[62472];
        await new Promise((resolve) => {
            bid.project.once("updated", resolve);
            $component.reset();
        });
    });

    afterAll(async () => {
        await new Promise((resolve) => {
            bid.project.once("updated", resolve);
            $component.reset();
        });
    });

    it("should not be overridden if its sub components and line items are not overridden", async () => {
        expect($component.isOverridden()).toBe(false);
    });

    it("should be overridden if one of its line items is overridden", async () => {
        const lineItem = bid.entities.lineItems()[$component.config.line_items[0]];
        await new Promise((resolve) => {
            bid.project.once("updated", resolve);
            lineItem.quantity = 100;
        });
        expect($component.isOverridden()).toBe(true);
    });

    it("should be overridden if one of its line items is_included value is overridden", async () => {
        const lineItem = bid.entities.lineItems()[$component.config.line_items[0]];
        await new Promise((resolve) => {
            bid.project.once("updated", resolve);
            lineItem.isIncluded = !lineItem.isIncluded;
        });
        expect($component.isOverridden()).toBe(true);
    });

    it("should be overridden if one of its subcomponents is overridden", async () => {
        const subComponent = bid.entities.components()[$component.config.components[0]];
        const lineItem = bid.entities.lineItems()[subComponent.config.line_items[0]];
        await new Promise((resolve) => {
            bid.project.once("updated", resolve);
            lineItem.quantity = 100;
        });
        expect($component.isOverridden()).toBe(true);
        expect($component.isOverridden("quantity")).toBe(true);
        expect($component.isOverridden("tax")).toBe(false);
    });
});

describe("Predictive pricing in use", () => {
    beforeAll(() => new Promise((resolve) => {
        bid.project.once("updated", resolve);
        bid.entities.variables().predictive_pricing.value = true;
    }));

    afterAll(() => new Promise((resolve) => {
        bid.project.once("updated", resolve);
        bid.entities.variables().use_computed.value = true;
        bid.entities.variables().predictive_pricing.value = false;
    }));

    describe("isPredicted() should represent the components line items and sub components", () => {
        it("should not be predicted if no sub items or components are predicted", async () => {
            const component = bid.entities.components(62472);
            expect.assertions(2);
            await new Promise((resolve) => {
                bid.project.once("updated", resolve);
                bid.entities.variables().use_computed.value = true;
            });
            expect(component.isPredicted("cost")).toBe(false);
            expect(component.isPredicted("price")).toBe(false);
        });

        it("should be predicted if the sub items or components are predicted", async () => {
            const component = bid.entities.components(62472);
            expect.assertions(2);
            await new Promise((resolve) => {
                bid.project.once("updated", resolve);
                bid.entities.variables().use_computed.value = false;
            });
            expect(component.isPredicted("cost")).toBe(true);
            expect(component.isPredicted("price")).toBe(true);
        });
    });
});
// TODO: test when all line items in component are excluded that they all enable with an equally distributed value.
// TODO: test when application of component value distrbutes to included line items only, unless there are no included line items.
