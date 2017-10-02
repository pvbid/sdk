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

test("get field value", () => {
    let field = bid.entities.searchByTitle("field", "module type")[0];
    let options = field.getListOptions();
    field.value = options[0].row_id;

    expect(field.getSelectedOptionValue("clpa")).toBe("450");
});

test("field selected option", () => {
    let field = bid.entities.searchByTitle("field", "module type")[0];
    let options = field.getListOptions();
    field.value = options[1].row_id;

    expect(field.getSelectedOption()).toEqual({ row_id: "be6f", title: "Module 2" });
});

describe("Field's default value", () => {
    test("should be true", () => {
        expect.assertions(1);
        let field = bid.entities.searchByTitle("field", "boolean field")[0];
        field.config.default_value = true;
        return new Promise(resolve => {
            field.once("assessed", () => {
                expect(field.value).toBe(true);
                resolve();
            });
            field.assess();
        });
    });

    test("should be false", () => {
        expect.assertions(1);
        let field = bid.entities.searchByTitle("field", "boolean field")[0];
        field.config.default_value = false;

        return new Promise(resolve => {
            field.once("assessed", () => {
                expect(field.value).toBe(false);
                resolve();
            });
            field.value = null;
        });
    });
});

test("field value inputs should convert to boolean", () => {
    let field = bid.entities.searchByTitle("field", "boolean field")[0];
    field.value = "1";
    expect(field.value).toBe(true);
    field.value = 1;
    expect(field.value).toBe(true);
    field.value = "true";
    expect(field.value).toBe(true);
    field.value = true;
    expect(field.value).toBe(true);
    field.value = "0";
    expect(field.value).toBe(false);
    field.value = 0;
    expect(field.value).toBe(false);
    field.value = "false";
    expect(field.value).toBe(false);
    field.value = false;
    expect(field.value).toBe(false);

    field.config.type = "text";

    field.value = 0;
    expect(field.value).toBe(0);
    field.value = "0";
    expect(field.value).toBe("0");
    field.value = "false";
    expect(field.value).toBe("false");
});

describe("Propagation of supporting datatable update event", () => {
    test("should force field 'update' event even with no changes to the field value.", async () => {
        expect.assertions(1);
        let field = bid.entities.searchByTitle("field", "module type")[0];
        let dt = field.getDatatable();

        await new Promise(resolve => {
            field.once("updated", () => {
                expect(true).toBe(true);
                resolve();
            });
            dt.emit("updated");
        });
    });

    test("should update line items that depend on field lists.", async () => {
        expect.assertions(2);

        let field = bid.entities.searchByTitle("field", "module type")[0];
        let options = field.getListOptions();
        field.value = options[1].row_id;

        let lineItem = await bid.addLineItem();

        //column id: tp7qn is the unit price column.
        lineItem.config.dependencies.wage = { type: "field", field: "tp7q", bid_entity_id: field.id };
        lineItem.bind();

        await new Promise(resolve => {
            lineItem.once("assessed", resolve);
            lineItem.assess();
        });

        expect(lineItem.wage).toBe(300);

        await new Promise(resolve => {
            lineItem.once("assessed", () => {
                expect(lineItem.wage).toBe(305);
                resolve();
            });
            let dt = field.getDatatable();
            dt.config.rows[1].values[1] = 305;
            dt.emit("updated");
        });
    });
});

