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
let project, bid, datatable;

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

test("get options", () => {
    const expected = [
        { row_id: "mhzk", title: "Module 1" },
        { row_id: "be6f", title: "Module 2" },
    ];
    expect(datatable.getOptions()).toEqual(expected);
});

describe("Datatable with linked inventory", () => {
    let linkedDatatable;
    beforeAll(() => {
        linkedDatatable = bid.entities.datatables(7581);
    });

    test("get column values", () => {
        const expected = [
            { id: "6nq6", value: "1000" },
            { id: "w0wb", value: "" },
            { id: "3t2n", value: "" },
        ];
        const values = linkedDatatable.getColumnValues("pvlink_example_prop");
        expect(values).toEqual(expected);
    });

    test("get cell values", () => {
        expect(linkedDatatable.getValue("pvlink_example_prop", "6nq6")).toBe("1000");
        expect(linkedDatatable.getValue("pvlink_pvbid_part_name", "6nq6")).toBe("Test Manufacturer - Test Module I");
        expect(linkedDatatable.getValue("pvbid_inventory_item_id", "6nq6")).toBe("5c9be3b759e8a459715c82ae");
        expect(linkedDatatable.getValue("pvlink_example_prop", "w0wb")).toBe("");
        expect(linkedDatatable.getValue("pvlink_pvbid_part_name", "w0wb")).toBe("");
        expect(linkedDatatable.getValue("pvbid_inventory_item_id", "w0wb")).toBe("");
    });

    describe("get row id by linked external part ID", () => {
        it("should return the row id of the row containing the linked part", () => {
            expect(linkedDatatable.findRowByExternalPartId("test_vendor_a", "9876")).toBe("6nq6");
            expect(linkedDatatable.findRowByExternalPartId("test_vendor_b", "1234")).toBe("6nq6");
        });

        it("should return undefined if no matching part is found", () => {
            expect(linkedDatatable.findRowByExternalPartId("test_vendor_b", "8888")).toBeUndefined();
        });
    });
});
