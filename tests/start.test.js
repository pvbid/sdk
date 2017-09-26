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

test("confirm test data", () => {
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
            lineItem.cost = "10";
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
            lineItem.price = "15";
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
            lineItem.quantity = "1";
            lineItem.perQuantity = "10";
            lineItem.base = "5";
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
            lineItem.markupPercent = "50";
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
            lineItem.taxPercent = "10";
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

        lineItem.escalator = "1.5";
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

test("test multiplier", () => {
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
        lineItem.base = "5";
        lineItem.cost = "15";
        lineItem.override("price", true);
        lineItem.multiplier = "2";
    });
});

test("test markup not including tax", () => {
    expect.assertions(25);

    return new Promise(resolve => {
        lineItem.onDelay("assessed", 200, "test escalator", () => {
            expect(lineItem.isOverridden("cost")).toBe(true);
            expect(lineItem.isOverridden("price")).toBe(false);
            expect(lineItem.isOverridden("markup")).toBe(false);
            expect(lineItem.isOverridden("markup_percent")).toBe(false);
            expect(lineItem.isOverridden("tax")).toBe(false);
            expect(lineItem.isOverridden("tax_percent")).toBe(false);
            expect(lineItem.isOverridden("base")).toBe(false);
            expect(lineItem.isOverridden("escalator")).toBe(true);
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
            expect(_.round(lineItem.cost, 2)).toBe(10);

            expect(_.round(lineItem.tax, 2)).toBe(0.8);
            expect(_.round(lineItem.taxPercent, 2)).toBe(8);

            expect(_.round(lineItem.markup, 2)).toBe(1.8);
            expect(_.round(lineItem.markupPercent, 2)).toBe(18);

            expect(_.round(lineItem.price, 2)).toBe(12.6);

            resolve();
        });
        let strategy = lineItem.bid.entities.variables("markup_strategy");
        strategy.value = false;
        lineItem.reset();
        lineItem.cost = "10";
    });
});

test("test markup not including tax", () => {
    expect.assertions(27);

    return new Promise(resolve => {
        lineItem.onDelay("assessed", 200, "test escalator", () => {
            expect(lineItem.isOverridden("cost")).toBe(false);
            expect(lineItem.isOverridden("price")).toBe(false);
            expect(lineItem.isOverridden("markup")).toBe(false);
            expect(lineItem.isOverridden("markup_percent")).toBe(false);
            expect(lineItem.isOverridden("tax")).toBe(false);
            expect(lineItem.isOverridden("tax_percent")).toBe(false);
            expect(lineItem.isOverridden("base")).toBe(true);
            expect(lineItem.isOverridden("escalator")).toBe(false);
            expect(lineItem.isOverridden("quantity")).toBe(false);
            expect(lineItem.isOverridden("per_quantity")).toBe(false);
            expect(lineItem.isOverridden("wage")).toBe(true);
            expect(lineItem.isOverridden("burden")).toBe(true);

            expect(_.round(lineItem.base, 2)).toBe(5);
            expect(_.round(lineItem.quantity, 2)).toBe(0);
            expect(_.round(lineItem.perQuantity, 2)).toBe(0);
            expect(_.round(lineItem.subtotal, 2)).toBe(5);

            expect(_.round(lineItem.laborHours, 2)).toBe(5);
            expect(_.round(lineItem.wage, 2)).toBe(15);
            expect(_.round(lineItem.burden, 2)).toBe(5);

            expect(_.round(lineItem.multiplier, 2)).toBe(1);
            expect(_.round(lineItem.escalator, 2)).toBe(1);
            expect(_.round(lineItem.cost, 2)).toBe(100);

            expect(_.round(lineItem.tax, 2)).toBe(0);
            expect(_.round(lineItem.taxPercent, 2)).toBe(8);

            expect(_.round(lineItem.markup, 2)).toBe(18);
            expect(_.round(lineItem.markupPercent, 2)).toBe(18);

            expect(_.round(lineItem.price, 2)).toBe(118.0);

            resolve();
        });

        lineItem.config.type = "labor";
        lineItem.reset();
        lineItem.wage = "15";
        lineItem.burden = "5";
        lineItem.base = "5";
    });
});

test("test labor hours override", () => {
    expect.assertions(28);

    return new Promise(resolve => {
        lineItem.onDelay("assessed", 200, "test escalator", () => {
            expect(lineItem.isOverridden("cost")).toBe(false);
            expect(lineItem.isOverridden("price")).toBe(false);
            expect(lineItem.isOverridden("markup")).toBe(false);
            expect(lineItem.isOverridden("markup_percent")).toBe(false);
            expect(lineItem.isOverridden("tax")).toBe(false);
            expect(lineItem.isOverridden("tax_percent")).toBe(false);
            expect(lineItem.isOverridden("base")).toBe(true);
            expect(lineItem.isOverridden("escalator")).toBe(false);
            expect(lineItem.isOverridden("quantity")).toBe(false);
            expect(lineItem.isOverridden("per_quantity")).toBe(false);
            expect(lineItem.isOverridden("wage")).toBe(true);
            expect(lineItem.isOverridden("burden")).toBe(true);
            expect(lineItem.isOverridden("labor_hours")).toBe(true);

            expect(_.round(lineItem.base, 2)).toBe(5);
            expect(_.round(lineItem.quantity, 2)).toBe(0);
            expect(_.round(lineItem.perQuantity, 2)).toBe(0);
            expect(_.round(lineItem.subtotal, 2)).toBe(5);

            expect(_.round(lineItem.laborHours, 2)).toBe(10);
            expect(_.round(lineItem.wage, 2)).toBe(15);
            expect(_.round(lineItem.burden, 2)).toBe(5);

            expect(_.round(lineItem.multiplier, 2)).toBe(1);
            expect(_.round(lineItem.escalator, 2)).toBe(1);
            expect(_.round(lineItem.cost, 2)).toBe(200);

            expect(_.round(lineItem.tax, 2)).toBe(0);
            expect(_.round(lineItem.taxPercent, 2)).toBe(8);

            expect(_.round(lineItem.markup, 2)).toBe(36);
            expect(_.round(lineItem.markupPercent, 2)).toBe(18);

            expect(_.round(lineItem.price, 2)).toBe(236.0);

            resolve();
        });

        lineItem.laborHours = "10";
    });
});
