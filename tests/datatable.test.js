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
let project, bid, field, datatable;

beforeAll(() => {
    return init();
}, 50000);

afterAll(() => setTimeout(() => process.exit(), 1000));

async function init() {
    // This sets the mock adapter on the default instance
    var mock = new MockAdapter(axios);

    // Mock any GET request to /users
    // arguments for reply are (status, data, headers)
    let mockedLineItem = LineItemScaffolding.create(179, "The New Line Item");
    mockedLineItem.id = 1000001;
    mock.onPost("http://api.pvbid.local/v2/bids/179/line_items/").reply(200, {
        data: {
            line_item: mockedLineItem
        }
    });
    project = await new Promise(resolve => {
        jsonfile.readFile("./tests/simple-test-project.json", (err, data) => {
            mock.onGet("http://api.pvbid.local/v2/projects/123").reply(200, {
                data: { project: data.project }
            });
            mock.onGet("http://api.pvbid.local/v2/bids/179").reply(200, {
                data: { bid: data.bid }
            });

            context.getProject(123).then(p => {
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

test("test search for datatable by title", () => {
    datatable = bid.entities.searchByTitle("datatable", "modules")[0];
    expect(datatable.title).toBe("Modules");
});

test("test get column values", () => {
    const expected = [{ id: "mhzk", value: "450" }, { id: "be6f", value: "250" }];
    const values = datatable.getColumnValues("clpa");
    expect(values).toEqual(expected);
});

test("test get cell value", () => {
    expect(datatable.getValue("clpa", "mhzk")).toBe("450");
    expect(datatable.getValue("clpa", "be6f")).toBe("250");
    expect(datatable.getValue("tp7q", "mhzk")).toBe("400.00");
    expect(datatable.getValue("tp7q", "be6f")).toBe("300.00");
});
