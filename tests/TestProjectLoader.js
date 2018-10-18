var axios = require("axios");
var jsonfile = require("jsonfile");
const PVBid = require("../src/pvbid.js");
var MockAdapter = require("axios-mock-adapter");
import LineItemScaffolding from "../src/domain/scaffolding/LineItemScaffolding";

export const loadTestProject = async () => {
  let context = PVBid.createContext({
    token: "Bearer Token",
    base_uri: "http://api.pvbid.local/v2"
  });

  const mock = new MockAdapter(axios);
  mockLineItem(mock);

  const project = await new Promise(resolve => {
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

  return project;
};

const mockLineItem = (mock) => {
  let mockedLineItem = LineItemScaffolding.create(190, "The New Line Item");
  mockedLineItem.id = 1000001;
  mock.onPost("http://api.pvbid.local/v2/bids/190/line_items/").reply(200, {
    data: {
      line_item: mockedLineItem
    }
  });
};
