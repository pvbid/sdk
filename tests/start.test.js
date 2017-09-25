//const PVBid = require("../src/pvbid.js");
//import { pvbid } from "../src/pvbid";
import _ from "lodash";
import jest from "jest";
var axios = require("axios");
var jsonfile = require("jsonfile");
const PVBid = require("../src/pvbid.js");
var MockAdapter = require("axios-mock-adapter");
import LineItemScaffolding from "../src/domain/scaffolding/LineItemScaffolding";

const token =
    "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImEzN2MzNTdjZWQ1MGFjYTM1ZWRmM2ZjZjdjMThkYzk4NzQxMWExYjE3YTUxYTBhZjExYTUzMmRkMTNiZjc3NjY4MzBmNjljNDlkYTQ2YmViIn0.eyJhdWQiOiIyIiwianRpIjoiYTM3YzM1N2NlZDUwYWNhMzVlZGYzZmNmN2MxOGRjOTg3NDExYTFiMTdhNTFhMGFmMTFhNTMyZGQxM2JmNzc2NjgzMGY2OWM0OWRhNDZiZWIiLCJpYXQiOjE1MDYyOTE0NjMsIm5iZiI6MTUwNjI5MTQ2MywiZXhwIjoxNTM3ODI3NDYzLCJzdWIiOiIzIiwic2NvcGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWRlZmluaXRpb25zIiwibWFuYWdlLWJpZHMiLCJzeXN0ZW0tYWRtaW4iXX0.j8LWOljtj-L4DOE_fc-4MJ7qVTV2E64eYPAceqldfFpi8GAtINYNhKegGK9NdI5t7KD9UR7p6KpQtjFL3WVLst4hbcBqctzWMdXpudJaQGsisxE3WI3BmcvWXFyrJAGLERT_vEe5wU-ES8cOkWHCLDlnn7euVZBlIivRIZKAGluRVijTgwGxklqB6A-mks4F7ctoUFAuGXeNLlrB5m2LzGwuSI4eUeKBFsFM8vEqJL5uAKk3Jhe-5p6JLc6fk69MOJlz8kjZnzDYAn3PyTi6gX9JSZ39Nms8qMddx2mmE65X48rAB4Se3Jx-ISArGA_KJzV17yBki3n3YofM4WetsnLyztGNcUXTYoISnspNtTuEKbMpSevuGPlWwxy-N2ztD6Iks81giw8yXMFhbNsKdiWzyiPt7pjl59xKZAjyf90Kzqlp9xZm2YGOZe8lZXc1d-x_MOyGAbgV_v187oburBVBZYat1CrcMF24UexvD7kPJmdSBoFaSaD3SKlXaKv5HU7zeaxT88PD1Yzf0MpdIYn-JMucw65pNFm7IPZURPkXxswPqTAIrs-LSdA_SgQkjkV3u1EWEegDk5W8SOqrSNlC64weQaNt7IK_W7q93ICbFEarekZYzfQANISYOXztY8AP3IJ0ti8kSqzJ81y2gDmLFqpeXhjX4kqzKUT64MA";

let context = PVBid.createContext({ token: token, base_uri: "http://api.pvbid.local/v2" });
let project;
let bid;
let lineItem;

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
        jsonfile.readFile("./tests/test-data.json", (err, data) => {
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
        bid.reassessAll(true);
        project.once("assessed", () => {
            resolve();
        });
    });
}

test("dumb test", () => {
    expect(1).toBe(1);
});

test("trial test", () => {
    expect(_.round(project.cost)).toBe(78347);
});

test("add new line item", () => {
    expect.assertions(2);

    return bid
        .addLineItem()
        .then(li => {
            expect(li.title).toBe("The New Line Item");
            expect(li.id).toBe(1000001);
            lineItem = li;
        })
        .catch(e => {
            console.log(e);
        });
});

test(
    "change line item cost (includes tax in markup)",
    () => {
        expect.assertions(19);

        return new Promise(resolve => {
            lineItem.once("assessed", () => {
                expect(_.round(lineItem.cost, 3)).toBe(10);

                expect(_.round(lineItem.markup, 3)).toBe(1.944);
                expect(_.round(lineItem.tax, 1)).toBe(0.8);
                expect(_.round(lineItem.price, 2)).toBe(12.74);

                expect(_.round(lineItem.base, 2)).toBe(0);
                expect(_.round(lineItem.quantity, 2)).toBe(0);
                expect(_.round(lineItem.perQuantity, 2)).toBe(0);

                expect(_.round(lineItem.multiplier, 2)).toBe(1);
                expect(_.round(lineItem.escalator, 2)).toBe(1);
                expect(_.round(lineItem.laborHours, 2)).toBe(0);
                expect(_.round(lineItem.wage, 2)).toBe(0);
                expect(_.round(lineItem.burden, 2)).toBe(0);

                expect(lineItem.isOverridden("cost")).toBe(true);
                expect(lineItem.isOverridden("price")).toBe(false);
                expect(lineItem.isOverridden("markup")).toBe(false);
                expect(lineItem.isOverridden("tax")).toBe(false);

                expect(lineItem.isOverridden("base")).toBe(false);
                expect(lineItem.isOverridden("quantity")).toBe(false);
                expect(lineItem.isOverridden("per_quantity")).toBe(false);

                resolve();
            });
            lineItem.cost = 10;
        });
    },
    20000
);

test(
    "change line item price after cost",
    () => {
        expect.assertions(22);

        return new Promise(resolve => {
            lineItem.once("assessed", () => {
                expect(lineItem.isOverridden("cost")).toBe(true);
                expect(lineItem.isOverridden("price")).toBe(true);
                expect(lineItem.isOverridden("markup")).toBe(false);
                expect(lineItem.isOverridden("markup_percent")).toBe(true);

                expect(lineItem.isOverridden("tax")).toBe(false);
                expect(lineItem.isOverridden("tax_percent")).toBe(false);

                expect(lineItem.isOverridden("base")).toBe(false);
                expect(lineItem.isOverridden("quantity")).toBe(false);
                expect(lineItem.isOverridden("per_quantity")).toBe(false);

                expect(_.round(lineItem.price, 2)).toBe(15);
                expect(_.round(lineItem.markup, 2)).toBe(4.2);
                expect(_.round(lineItem.markupPercent, 2)).toBe(38.89);

                expect(_.round(lineItem.tax, 2)).toBe(0.8);
                expect(_.round(lineItem.cost, 2)).toBe(10.0); // cost remains 10 as it is overridden.

                expect(_.round(lineItem.multiplier, 2)).toBe(1);
                expect(_.round(lineItem.escalator, 2)).toBe(1);
                expect(_.round(lineItem.laborHours, 2)).toBe(0);
                expect(_.round(lineItem.wage, 2)).toBe(0);
                expect(_.round(lineItem.burden, 2)).toBe(0);

                expect(_.round(lineItem.base, 2)).toBe(0);
                expect(_.round(lineItem.quantity, 2)).toBe(0);
                expect(_.round(lineItem.perQuantity, 2)).toBe(0);

                resolve();
            });
            lineItem.price = 15;
        });
    },
    20000
);

test(
    "change line item base/quantity",
    () => {
        expect.assertions(23);

        return new Promise(resolve => {
            lineItem.onDelay("assessed", 100, "test", () => {
                expect(lineItem.isOverridden("cost")).toBe(false);
                expect(lineItem.isOverridden("price")).toBe(false);
                expect(lineItem.isOverridden("markup")).toBe(false);
                expect(lineItem.isOverridden("markup_percent")).toBe(true);

                expect(lineItem.isOverridden("tax")).toBe(false);
                expect(lineItem.isOverridden("tax_percent")).toBe(false);

                expect(lineItem.isOverridden("base")).toBe(true);
                expect(lineItem.isOverridden("quantity")).toBe(true);
                expect(lineItem.isOverridden("per_quantity")).toBe(true);

                expect(_.round(lineItem.cost, 2)).toBe(15.0); // cost remains 10 as it is overridden.
                expect(_.round(lineItem.tax, 2)).toBe(1.2);
                expect(_.round(lineItem.markup, 2)).toBe(6.3);
                expect(_.round(lineItem.markupPercent, 2)).toBe(38.89);

                expect(_.round(lineItem.price, 2)).toBe(22.5);
                expect(_.round(lineItem.subtotal, 2)).toBe(15);

                expect(_.round(lineItem.multiplier, 2)).toBe(1);
                expect(_.round(lineItem.escalator, 2)).toBe(1);
                expect(_.round(lineItem.laborHours, 2)).toBe(0);
                expect(_.round(lineItem.wage, 2)).toBe(0);
                expect(_.round(lineItem.burden, 2)).toBe(0);

                expect(_.round(lineItem.base, 2)).toBe(5);
                expect(_.round(lineItem.quantity, 2)).toBe(1);
                expect(_.round(lineItem.perQuantity, 2)).toBe(10);

                resolve();
            });
            lineItem.quantity = 1;
            lineItem.perQuantity = 10;
            lineItem.base = 5;
        });
    },
    20000
);

test(
    "change line item cost - impacts multiplier",
    () => {
        expect.assertions(23);

        return new Promise(resolve => {
            lineItem.onDelay("assessed", 100, "test", () => {
                expect(lineItem.isOverridden("cost")).toBe(true);
                expect(lineItem.isOverridden("price")).toBe(false);
                expect(lineItem.isOverridden("markup")).toBe(false);
                expect(lineItem.isOverridden("markup_percent")).toBe(true);

                expect(lineItem.isOverridden("tax")).toBe(false);
                expect(lineItem.isOverridden("tax_percent")).toBe(false);

                expect(lineItem.isOverridden("base")).toBe(true);
                expect(lineItem.isOverridden("quantity")).toBe(true);
                expect(lineItem.isOverridden("per_quantity")).toBe(true);

                expect(_.round(lineItem.cost, 2)).toBe(20.0);
                expect(_.round(lineItem.multiplier, 2)).toBe(1.33);

                expect(_.round(lineItem.tax, 2)).toBe(1.6);
                expect(_.round(lineItem.markup, 2)).toBe(8.4);
                expect(_.round(lineItem.markupPercent, 2)).toBe(38.89);

                expect(_.round(lineItem.price, 2)).toBe(30);
                expect(_.round(lineItem.subtotal, 2)).toBe(15);

                expect(_.round(lineItem.escalator, 2)).toBe(1);
                expect(_.round(lineItem.laborHours, 2)).toBe(0);
                expect(_.round(lineItem.wage, 2)).toBe(0);
                expect(_.round(lineItem.burden, 2)).toBe(0);

                expect(_.round(lineItem.base, 2)).toBe(5);
                expect(_.round(lineItem.quantity, 2)).toBe(1);
                expect(_.round(lineItem.perQuantity, 2)).toBe(10);

                resolve();
            });
            lineItem.cost = 20;
        });
    },
    20000
);

test(
    "change line item markup percent",
    () => {
        expect.assertions(23);

        return new Promise(resolve => {
            lineItem.onDelay("assessed", 100, "test", () => {
                expect(lineItem.isOverridden("cost")).toBe(true);
                expect(lineItem.isOverridden("price")).toBe(false);
                expect(lineItem.isOverridden("markup")).toBe(false);
                expect(lineItem.isOverridden("markup_percent")).toBe(true);

                expect(lineItem.isOverridden("tax")).toBe(false);
                expect(lineItem.isOverridden("tax_percent")).toBe(false);

                expect(lineItem.isOverridden("base")).toBe(true);
                expect(lineItem.isOverridden("quantity")).toBe(true);
                expect(lineItem.isOverridden("per_quantity")).toBe(true);

                expect(_.round(lineItem.cost, 2)).toBe(20.0);
                expect(_.round(lineItem.multiplier, 2)).toBe(1.33);

                expect(_.round(lineItem.tax, 2)).toBe(1.6);
                expect(_.round(lineItem.markup, 2)).toBe(10.8);
                expect(_.round(lineItem.markupPercent, 2)).toBe(50);

                expect(_.round(lineItem.price, 2)).toBe(32.4);
                expect(_.round(lineItem.subtotal, 2)).toBe(15);

                expect(_.round(lineItem.escalator, 2)).toBe(1);
                expect(_.round(lineItem.laborHours, 2)).toBe(0);
                expect(_.round(lineItem.wage, 2)).toBe(0);
                expect(_.round(lineItem.burden, 2)).toBe(0);

                expect(_.round(lineItem.base, 2)).toBe(5);
                expect(_.round(lineItem.quantity, 2)).toBe(1);
                expect(_.round(lineItem.perQuantity, 2)).toBe(10);

                resolve();
            });
            lineItem.markupPercent = 50;
        });
    },
    20000
);

test(
    "change line item tax percent",
    () => {
        expect.assertions(24);

        return new Promise(resolve => {
            lineItem.onDelay("assessed", 100, "test", () => {
                expect(lineItem.isOverridden("cost")).toBe(true);
                expect(lineItem.isOverridden("price")).toBe(false);
                expect(lineItem.isOverridden("markup")).toBe(false);
                expect(lineItem.isOverridden("markup_percent")).toBe(true);
                expect(lineItem.isOverridden("tax")).toBe(false);
                expect(lineItem.isOverridden("tax_percent")).toBe(true);
                expect(lineItem.isOverridden("base")).toBe(true);
                expect(lineItem.isOverridden("quantity")).toBe(true);
                expect(lineItem.isOverridden("per_quantity")).toBe(true);

                expect(_.round(lineItem.base, 2)).toBe(5);
                expect(_.round(lineItem.quantity, 2)).toBe(1);
                expect(_.round(lineItem.perQuantity, 2)).toBe(10);
                expect(_.round(lineItem.subtotal, 2)).toBe(15);

                expect(_.round(lineItem.laborHours, 2)).toBe(0);
                expect(_.round(lineItem.wage, 2)).toBe(0);
                expect(_.round(lineItem.burden, 2)).toBe(0);

                expect(_.round(lineItem.multiplier, 2)).toBe(1.33);
                expect(_.round(lineItem.escalator, 2)).toBe(1);
                expect(_.round(lineItem.cost, 2)).toBe(20.0);

                expect(_.round(lineItem.tax, 2)).toBe(2.0);
                expect(_.round(lineItem.taxPercent, 2)).toBe(10.0);

                expect(_.round(lineItem.markup, 2)).toBe(11.0);
                expect(_.round(lineItem.markupPercent, 2)).toBe(50);

                expect(_.round(lineItem.price, 2)).toBe(33);

                resolve();
            });
            lineItem.taxPercent = 10;
        });
    },
    20000
);

test("change line item escalator", () => {
    expect.assertions(25);

    return new Promise(resolve => {
        lineItem.onDelay("assessed", 100, "test escalator", () => {
            expect(lineItem.isOverridden("cost")).toBe(false);
            expect(lineItem.isOverridden("price")).toBe(false);
            expect(lineItem.isOverridden("markup")).toBe(false);
            expect(lineItem.isOverridden("markup_percent")).toBe(true);
            expect(lineItem.isOverridden("tax")).toBe(false);
            expect(lineItem.isOverridden("tax_percent")).toBe(true);
            expect(lineItem.isOverridden("base")).toBe(true);
            expect(lineItem.isOverridden("quantity")).toBe(true);
            expect(lineItem.isOverridden("per_quantity")).toBe(true);

            expect(_.round(lineItem.base, 2)).toBe(5);
            expect(_.round(lineItem.quantity, 2)).toBe(1);
            expect(_.round(lineItem.perQuantity, 2)).toBe(10);
            expect(_.round(lineItem.subtotal, 2)).toBe(15);

            expect(_.round(lineItem.laborHours, 2)).toBe(0);
            expect(_.round(lineItem.wage, 2)).toBe(0);
            expect(_.round(lineItem.burden, 2)).toBe(0);

            expect(_.round(lineItem.multiplier, 2)).toBe(1.33);
            expect(_.round(lineItem.escalator, 2)).toBe(1.5);
            expect(_.round(lineItem.cost, 2)).toBe(30.0);

            expect(_.round(lineItem.tax, 2)).toBe(3.0);
            expect(_.round(lineItem.taxPercent, 2)).toBe(10.0);

            expect(_.round(lineItem.markup, 2)).toBe(16.5);
            expect(_.round(lineItem.markupPercent, 2)).toBe(50);

            expect(_.round(lineItem.price, 2)).toBe(49.5);

            resolve();
        });
        lineItem.override("price", true); // set to true to check if it resets to false;
        expect(lineItem.isOverridden("price")).toBe(true); //verify

        lineItem.escalator = 1.5;
    });
});

test("reset line item", () => {
    expect.assertions(24);

    return new Promise(resolve => {
        lineItem.onDelay("assessed", 100, "test escalator", () => {
            expect(lineItem.isOverridden("cost")).toBe(false);
            expect(lineItem.isOverridden("price")).toBe(false);
            expect(lineItem.isOverridden("markup")).toBe(false);
            expect(lineItem.isOverridden("markup_percent")).toBe(false);
            expect(lineItem.isOverridden("tax")).toBe(false);
            expect(lineItem.isOverridden("tax_percent")).toBe(false);
            expect(lineItem.isOverridden("base")).toBe(false);
            expect(lineItem.isOverridden("quantity")).toBe(false);
            expect(lineItem.isOverridden("per_quantity")).toBe(false);

            expect(_.round(lineItem.base, 2)).toBe(0);
            expect(_.round(lineItem.quantity, 2)).toBe(0);
            expect(_.round(lineItem.perQuantity, 2)).toBe(0);
            expect(_.round(lineItem.subtotal, 2)).toBe(0);

            expect(_.round(lineItem.laborHours, 2)).toBe(0);
            expect(_.round(lineItem.wage, 2)).toBe(0);
            expect(_.round(lineItem.burden, 2)).toBe(0);

            expect(_.round(lineItem.multiplier, 2)).toBe(1);
            expect(_.round(lineItem.escalator, 2)).toBe(1);
            expect(_.round(lineItem.cost, 2)).toBe(0);

            expect(_.round(lineItem.tax, 2)).toBe(0);
            expect(_.round(lineItem.taxPercent, 2)).toBe(8);

            expect(_.round(lineItem.markup, 2)).toBe(0);
            expect(_.round(lineItem.markupPercent, 2)).toBe(18);

            expect(_.round(lineItem.price, 2)).toBe(0);

            resolve();
        });
        lineItem.reset();
    });
});

test("reset line item", () => {
    expect.assertions(25);

    return new Promise(resolve => {
        lineItem.onDelay("assessed", 200, "test escalator", () => {
            expect(lineItem.isOverridden("cost")).toBe(false);
            expect(lineItem.isOverridden("price")).toBe(false);
            expect(lineItem.isOverridden("markup")).toBe(false);
            expect(lineItem.isOverridden("markup_percent")).toBe(false);
            expect(lineItem.isOverridden("tax")).toBe(false);
            expect(lineItem.isOverridden("tax_percent")).toBe(false);
            expect(lineItem.isOverridden("base")).toBe(true);
            expect(lineItem.isOverridden("escalator")).toBe(true);
            expect(lineItem.isOverridden("quantity")).toBe(false);
            expect(lineItem.isOverridden("per_quantity")).toBe(false);

            expect(_.round(lineItem.base, 2)).toBe(5);
            expect(_.round(lineItem.quantity, 2)).toBe(0);
            expect(_.round(lineItem.perQuantity, 2)).toBe(0);
            expect(_.round(lineItem.subtotal, 2)).toBe(5);

            expect(_.round(lineItem.laborHours, 2)).toBe(0);
            expect(_.round(lineItem.wage, 2)).toBe(0);
            expect(_.round(lineItem.burden, 2)).toBe(0);

            expect(_.round(lineItem.multiplier, 2)).toBe(2);
            expect(_.round(lineItem.escalator, 2)).toBe(1);
            expect(_.round(lineItem.cost, 2)).toBe(10);

            expect(_.round(lineItem.tax, 2)).toBe(0.8);
            expect(_.round(lineItem.taxPercent, 2)).toBe(8);

            expect(_.round(lineItem.markup, 2)).toBe(1.94);
            expect(_.round(lineItem.markupPercent, 2)).toBe(18);

            expect(_.round(lineItem.price, 2)).toBe(12.74);

            resolve();
        });
        lineItem.base = 5;
        lineItem.cost = 15;
        lineItem.override("price", true);
        lineItem.multiplier = 2;
    });
});
