//const PVBid = require("../src/pvbid.js");
//import { pvbid } from "../src/pvbid";
import _ from "lodash";
import jest from "jest";
var axios = require("axios");
var jsonfile = require("jsonfile");
const PVBid = require("../src/pvbid.js");
var MockAdapter = require("axios-mock-adapter");
import FieldScaffolding from "../src/domain/scaffolding/FieldScaffolding";
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
    let mockedField = FieldScaffolding.create(190, "Auto Field", "number");
    mockedField.id = 1000001;
    mockedField.config.dependencies.auto_a = { type: "bid_variable", field: "wage", bid_entity_id: "bid_variable" };

    let mockedLineItem = LineItemScaffolding.create(190, "The New Line Item");
    mockedLineItem.id = 1000001;
    mock.onPost("http://api.pvbid.local/v2/bids/190/line_items/").reply(200, {
        data: {
            line_item: mockedLineItem
        }
    });

    mock.onPost("http://api.pvbid.local/v2/bids/190/fields/").reply(200, {
        data: {
            field: mockedField
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

describe("When creating a new field", () => {
    test("users with the 'create-bid' permission should be permitted.", async () => {
        let field = await bid.addField("My New Field", "number");
        expect(field.id).toBe(1000001);
    });

    test("users without the 'create-bid' permission should be prevented.", async () => {
        let user = bid._bidService.context.user;
        user._data.permissions.splice("create-bid", 1);

        await expect(bid.addField("My New Field")).rejects.toBeCalled;
    });

    test("it should be immediately assessable.", async () => {
        expect.assertions(1);
        let field = bid.entities.searchByTitle("field", "auto field")[0];
        return new Promise(resolve => {
            field.once("assessed", () => {
                expect(field.value).toBe(35);
                resolve();
            });
            field.assess();
        });
    });

    test("it should update based on dependency changes.", async () => {
        expect.assertions(1);
        let bidVariable = bid.entities.variables("wage");
        let field = bid.entities.searchByTitle("field", "auto field")[0];
        return new Promise(resolve => {
            field.once("assessed", () => {
                expect(field.value).toBe(40);
                resolve();
            });
            bidVariable.value = 40;
        });
    });
});

describe("Fields", () => {
    test("with number values should auto populated when configured.", async () => {
        expect.assertions(2);
        let field = bid.entities.searchByTitle("field", "auto field")[0];
        return new Promise(resolve => {
            field.once("assessed", () => {
                expect(field.value).toBe(40);
                expect(field.isAutoSelected).toBe(true);
                resolve();
            });
            field.assess();
        });
    });
});

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

describe("checking if it has null dependencies", () => {
    let $field;
    beforeAll(() => {
        $field = bid.entities.searchByTitle("field", "Number of Modules")[0];
    });

    afterEach(() => {
        $field.config.dependencies.auto_a = {};
        $field.value = 3;
    });

    test("should not have null dependencies when value is overriden", () => {
        expect.assertions(1);

        $field.value = 5;
        expect($field.hasNullDependency()).toBe(false);
    });

    test("should be considered to have null dependencies when value is null", () => {
        expect.assertions(2);
        $field.value = null;

        expect($field.value).toBe(null);
        expect($field.hasNullDependency()).toBe(true);
    });
    
    test("should be considered to have null dependencies when auto-select value depends on null dependency", () => {
        expect.assertions(3);
        $field.config.dependencies.auto_a = {
            type: "metric",
            field: "value",
            bid_entity_id: 36095, // depends on undefined field
        }
        $field.value = null;

        expect($field.isAutoSelected).toBe(true);
        expect($field.value).toBe(0);
        expect($field.hasNullDependency()).toBe(true);
    });
});
