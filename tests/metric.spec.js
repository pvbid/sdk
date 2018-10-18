//const PVBid = require("../src/pvbid.js");
//import { pvbid } from "../src/pvbid";
import _ from "lodash";
import jest from "jest";
var axios = require("axios");
var jsonfile = require("jsonfile");
const PVBid = require("../src/pvbid.js");
var MockAdapter = require("axios-mock-adapter");
import MetricScaffolding from "../src/domain/scaffolding/MetricScaffolding";

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
    let mockedMetric = MetricScaffolding.create(190, "My New Metric");
    mockedMetric.id = 1000001;
    mockedMetric.config.dependencies.a = { type: "bid_variable", field: "wage", bid_entity_id: "bid_variable" };
    mockedMetric.config.formula = "3 * a";

    mock.onPost("http://api.pvbid.local/v2/bids/190/metrics/").reply(200, {
        data: {
            metric: mockedMetric
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
        project.once("assessed", () => {
            resolve();
        });
        bid.reassessAll(true);
    });
}

describe("When creating a new metric", () => {
    test("users with the 'create-bid' permission should be permitted.", async () => {
        let metric = await bid.addMetric("My New Metric");
        expect(metric.id).toBe(1000001);
    });

    test("users without the 'create-bid' permission should be prevented.", async () => {
        let user = bid._bidService.context.user;
        user._data.permissions.splice("create-bid", 1);

        await expect(bid.addMetric("My New Metric")).rejects.toBeCalled;
    });

    test("it should be immediately assessable.", async () => {
        expect.assertions(1);
        let metric = bid.entities.searchByTitle("metric", "my new metric")[0];
        return new Promise(resolve => {
            metric.once("assessed", () => {
                expect(metric.value).toBe(105);
                resolve();
            });
            metric.assess();
        });
    });

    test("it should update based on dependency changes.", async () => {
        expect.assertions(1);
        let bidVariable = bid.entities.variables("wage");
        let metric = bid.entities.searchByTitle("metric", "my new metric")[0];
        return new Promise(resolve => {
            metric.once("assessed", () => {
                expect(metric.value).toBe(120);
                resolve();
            });
            bidVariable.value = 40;
        });
    });
});

describe("Metrics", () => {
    test("should report their dependencies", () => {
        let metric = bid.entities.searchByTitle("metric", "watts")[0];
        expect(metric.dependencies().length).toBe(2);
    });

    test("should report their dependants", () => {
        let metric = bid.entities.searchByTitle("metric", "watts")[0];
        expect(metric.dependants().length).toBeGreaterThan(0);
    });

    test("should consider their modifiers.", () => {
        let metric = bid.entities.searchByTitle("metric", "watts")[0];
        let burden = bid.entities.variables("burden");
        expect(metric.value).toBe(1350);
        metric._data.config.manipulations.push({
            title: "new modifier",
            dependencies: { a: { type: "bid_variable", field: "burden", bid_entity_id: "bid_variable" } },
            formula: "original + a"
        });
        metric.bind();
        return new Promise(resolve => {
            metric.once("assessed", () => {
                expect(metric.value).toBe(1356);
                resolve();
            });

            burden.value = 6;
        });
    });
});

describe("check if metric depends on undefined dependency value", () => {
    let $metric;
    beforeAll(() => {
        $metric = bid.entities.searchByTitle("metric", "Depends on undefined number")[0];
    });

    afterEach(() => {
        $metric.reset();
    });

    test("should be considered to have null dependency if it references an entity that depends on an undefined entity", () => {
        expect.assertions(3);
        expect($metric.value).toBe(0);
        expect($metric.bid.entities.getDependencyValue($metric.config.dependencies.a)).toBe(null);
        expect($metric.hasNullDependency()).toBe(true);
    });

    test("should not be considered to have null dependency if the value is overriden", () => {
        expect.assertions(2);
        $metric.value = 1;

        expect($metric.value).toBe(1);
        expect($metric.hasNullDependency()).toBe(false);
    });

    test("should not be considered to have null dependency if it depends on a fully defined entity", () => {
        expect.assertions(1);
        const definedMetric = bid.entities.searchByTitle("metric", "Depends on defined number")[0];
        
        expect(definedMetric.hasNullDependency()).toBe(false);
    });
});
