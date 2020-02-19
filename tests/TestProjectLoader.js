var axios = require("axios");
var jsonfile = require("jsonfile");
const PVBid = require("../src/pvbid.js");
var MockAdapter = require("axios-mock-adapter");
import LineItemScaffolding from "../src/domain/scaffolding/LineItemScaffolding";

export const loadTestProject = async (withEntities = true) => {
  let context = PVBid.createContext({
    token: "Bearer Token",
    base_uri: "http://api.pvbid.local/v2",
  });

  const mock = new MockAdapter(axios);
  mockLineItem(mock);
  mockMakeDynamicGroup(mock);

  const project = await new Promise(resolve => {
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

      context.getProject(461, { loadBidEntities: withEntities }).then(p => {
        resolve(p);
      });
    });
  });

  return project;
};

const fakeId = () =>
  "5cb73e755948a45c155" +
  Math.random()
    .toString(36)
    .substring(7);

const mockLineItem = mock => {
  let mockedLineItem = LineItemScaffolding.create(190, "The New Line Item");
  mockedLineItem.id = 1000001;
  mock.onPost("http://api.pvbid.local/v2/bids/190/line_items/").reply(200, {
    data: {
      line_item: mockedLineItem,
    },
  });
};

const mockMakeDynamicGroup = mock => {
  mock.onPost("http://api.pvbid.local/v2/bids/190/dynamic_groups").reply(config => [
    200,
    {
      data: {
        dynamic_group: {
          ...JSON.parse(config.data),
          id: fakeId(),
        },
      },
    },
  ]);
};
