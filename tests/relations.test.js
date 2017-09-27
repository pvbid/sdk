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

test("test search by title", () => {
    field = bid.entities.searchByTitle("field", "module type")[0];
    expect(field.title).toBe("Module Type");
});

test("test field options", () => {
    let options = field.getListOptions();
    expect(options[0].title).toBe("Module 1");
    expect(options[1].title).toBe("Module 2");
});

test("field list selection value", () => {
    let options = field.getListOptions();
    field.value = options[0].row_id;
    let selectedOption = field.getSelectedOption();
    expect(selectedOption.row_id).toBe(options[0].row_id);

    field.value = options[1].row_id;
    selectedOption = field.getSelectedOption();
    expect(selectedOption.row_id).toBe(options[1].row_id);
});
