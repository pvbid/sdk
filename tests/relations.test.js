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
      line_item: mockedLineItem,
    },
  });

  project = await new Promise(resolve => {
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

test("test search by title", () => {
  field = bid.entities.searchByTitle("field", "module type")[0];
  expect(field.title).toBe("Module Type");
});

test("test search by exact title", () => {
  const notExact = bid.entities.searchByTitle("field", "odule Typ", true)[0];
  const exact = bid.entities.searchByTitle("field", "Module Type", true)[0];

  expect(notExact).toBeUndefined();
  expect(exact).toBeDefined();
  expect(exact.title).toBe("Module Type");
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

test("line item include status with field select v1", () => {
  expect.assertions(2);

  lineItem = bid.entities.searchByTitle("line_item", "on with module selected")[0];
  expect(lineItem.isIncluded).toBe(true);

  return new Promise(resolve => {
    lineItem.once("assessed", () => {
      expect(lineItem.isIncluded).toBe(false);
      resolve();
    });
    field.value = null;
  });
});

test("line item include status with field select v2", () => {
  expect.assertions(2);

  return new Promise(resolve => {
    expect(lineItem.isIncluded).toBe(false);

    lineItem.once("assessed", () => {
      expect(lineItem.isIncluded).toBe(true);
      resolve();
    });
    let options = field.getListOptions();
    field.value = options[0].row_id;
  });
});
