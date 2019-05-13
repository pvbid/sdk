import _ from "lodash";
var axios = require("axios");
var jsonfile = require("jsonfile");
const PVBid = require("../src/pvbid.js");
var MockAdapter = require("axios-mock-adapter");
import LineItemScaffolding from "../src/domain/scaffolding/LineItemScaffolding";

let context = PVBid.createContext({ token: "Bearer Token", base_uri: "http://api.pvbid.local/v2" });
let project;
let bid;
let lineItem;

const resetLineItem = ($lineItem) => {
    return new Promise(resolve => {
        $lineItem.bid.project.once("assessed", resolve);
        $lineItem.reset();
    });
}

beforeAll(() => {
    return init();
}, 50000);

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
        project.once("assessed", () => {
            resolve();
        });
        bid.reassessAll(true);
    });
}
test("add new null tag and ensure config.tags is empty array", () => {
    expect.assertions(1);

    const $lineItem = bid.entities.searchByTitle("line_item", "General Line Item")[0];

    $lineItem.config.dependencies.tag_0 = {
        "type": null, "field": null, "bid_entity_id": null
    };

    $lineItem.assess();

    expect($lineItem.config.tags).toEqual([]);
});


test("add new tags and ensure they are pushed to config.tags", () => {
    expect.assertions(1);

    const $lineItem = bid.entities.searchByTitle("line_item", "General Line Item")[0];

    $lineItem.config.dependencies.tag_0 = {
        "type": "field", "field": "at57", "bid_entity_id": 18262
    };

    $lineItem.config.dependencies.tag_1 = {
        "type": "field", "field": "tp7q", "bid_entity_id": 18262
    };

    $lineItem.assess();

    expect($lineItem.config.tags).toEqual(["Module 1", "400.00"]);
});


test("add new line item", () => {
    expect.assertions(2);

    return bid
        .addLineItem()
        .then(li => {
            expect(li.title).toBe("The New Line Item");
            expect(li.id).toBe(1000001);
            lineItem = li;
            bid.entities.variables("markup_strategy").value = true;
            bid.entities.variables("markup").value = 18;
            bid.entities.variables("tax").value = 8;
        })
        .catch(e => {
            console.log(e);
        });
});

test(
    "change line item cost (includes tax in markup)",
    () => {
        expect.assertions(22);

        return new Promise(resolve => {
            lineItem.once("assessed", () => {
                expect(_.round(lineItem.cost, 3)).toBe(10);
                expect(_.round(lineItem.costWatt, 3)).toBe(0.007); // test bid is 1350 watt

                expect(_.round(lineItem.markup, 3)).toBe(1.944);
                expect(_.round(lineItem.tax, 1)).toBe(0.8);
                expect(_.round(lineItem.price, 2)).toBe(12.74);
                expect(_.round(lineItem.priceWatt, 3)).toBe(0.009); // test bid is 1350 watt
                expect(_.round(lineItem.costWithTax, 3)).toBe(10.8);

                expect(_.round(lineItem.base, 2)).toBe(0);
                expect(_.round(lineItem.quantity, 2)).toBe(0);
                expect(_.round(lineItem.perQuantity, 2)).toBe(1);

                expect(_.round(lineItem.multiplier, 2)).toBe(1);
                expect(_.round(lineItem.escalator, 2)).toBe(1);
                expect(_.round(lineItem.laborHours, 2)).toBe(0);
                expect(_.round(lineItem.wage, 2)).toBe(35);
                expect(_.round(lineItem.burden, 2)).toBe(5);

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
        expect.assertions(23);

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
                expect(_.round(lineItem.priceWatt, 3)).toBe(0.011); // test bid is 1350 watt

                expect(_.round(lineItem.tax, 2)).toBe(0.8);
                expect(_.round(lineItem.cost, 2)).toBe(10.0); // cost remains 10 as it is overridden.

                expect(_.round(lineItem.multiplier, 2)).toBe(1);
                expect(_.round(lineItem.escalator, 2)).toBe(1);
                expect(_.round(lineItem.laborHours, 2)).toBe(0);
                expect(_.round(lineItem.wage, 2)).toBe(35);
                expect(_.round(lineItem.burden, 2)).toBe(5);

                expect(_.round(lineItem.base, 2)).toBe(0);
                expect(_.round(lineItem.quantity, 2)).toBe(0);
                expect(_.round(lineItem.perQuantity, 2)).toBe(1);

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
        expect.assertions(24);

        return new Promise(resolve => {
            lineItem.once("assessed", () => {
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
                expect(_.round(lineItem.priceWatt, 3)).toBe(0.017); // test bid is 1350 watt

                expect(_.round(lineItem.multiplier, 2)).toBe(1);
                expect(_.round(lineItem.escalator, 2)).toBe(1);
                expect(_.round(lineItem.laborHours, 2)).toBe(0);
                expect(_.round(lineItem.wage, 2)).toBe(35);
                expect(_.round(lineItem.burden, 2)).toBe(5);

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
        expect.assertions(24);

        return new Promise(resolve => {
            lineItem.once("assessed", () => {
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
                expect(_.round(lineItem.priceWatt, 3)).toBe(0.022); // test bid is 1350 watt

                expect(_.round(lineItem.escalator, 2)).toBe(1);
                expect(_.round(lineItem.laborHours, 2)).toBe(0);
                expect(_.round(lineItem.wage, 2)).toBe(35);
                expect(_.round(lineItem.burden, 2)).toBe(5);

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
        expect.assertions(24);

        return new Promise(resolve => {
            lineItem.once("assessed", () => {
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
                expect(_.round(lineItem.priceWatt, 3)).toBe(0.024); // test bid is 1350 watt

                expect(_.round(lineItem.escalator, 2)).toBe(1);
                expect(_.round(lineItem.laborHours, 2)).toBe(0);
                expect(_.round(lineItem.wage, 2)).toBe(35);
                expect(_.round(lineItem.burden, 2)).toBe(5);

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
        expect.assertions(25);

        return new Promise(resolve => {
            lineItem.once("assessed", () => {
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
                expect(_.round(lineItem.wage, 2)).toBe(35);
                expect(_.round(lineItem.burden, 2)).toBe(5);

                expect(_.round(lineItem.multiplier, 2)).toBe(1.33);
                expect(_.round(lineItem.escalator, 2)).toBe(1);
                expect(_.round(lineItem.cost, 2)).toBe(20.0);

                expect(_.round(lineItem.tax, 2)).toBe(2.0);
                expect(_.round(lineItem.taxPercent, 2)).toBe(10.0);

                expect(_.round(lineItem.markup, 2)).toBe(11.0);
                expect(_.round(lineItem.markupPercent, 2)).toBe(50);

                expect(_.round(lineItem.price, 2)).toBe(33);
                expect(_.round(lineItem.priceWatt, 3)).toBe(0.024); // test bid is 1350 watt

                resolve();
            });
            lineItem.taxPercent = "10";
        });
    },
    20000
);

test("change line item escalator", () => {
    expect.assertions(26);

    return new Promise(resolve => {
        lineItem.once("assessed", () => {
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
            expect(_.round(lineItem.wage, 2)).toBe(35);
            expect(_.round(lineItem.burden, 2)).toBe(5);

            expect(_.round(lineItem.multiplier, 2)).toBe(1.33);
            expect(_.round(lineItem.escalator, 2)).toBe(1.5);
            expect(_.round(lineItem.cost, 2)).toBe(30.0);

            expect(_.round(lineItem.tax, 2)).toBe(3.0);
            expect(_.round(lineItem.taxPercent, 2)).toBe(10.0);

            expect(_.round(lineItem.markup, 2)).toBe(16.5);
            expect(_.round(lineItem.markupPercent, 2)).toBe(50);

            expect(_.round(lineItem.price, 2)).toBe(49.5);
            expect(_.round(lineItem.priceWatt, 3)).toBe(0.037); // test bid is 1350 watt

            resolve();
        });
        lineItem.override("price", true); // set to true to check if it resets to false;
        expect(lineItem.isOverridden("price")).toBe(true); //verify

        lineItem.escalator = "1.5";
    });
});

test("change line item cost per watt", () => {
    expect.assertions(3);

    return new Promise(resolve => {
        lineItem.once("assessed", () => {
            expect(_.round(lineItem.costWatt, 3)).toBe(0.025); // 1350 watt bid
            expect(_.round(lineItem.cost, 3)).toBe(33.75);

            expect(lineItem.isOverridden("cost")).toBe(true);

            resolve();
        });
        lineItem.costWatt = 0.025;
    });

});

test("change line item price per watt", () => {
    expect.assertions(3);

    return new Promise(resolve => {
        lineItem.once("assessed", () => {
            expect(_.round(lineItem.priceWatt, 3)).toBe(0.025); // 1350 watt bid
            expect(_.round(lineItem.price, 3)).toBe(33.75);

            expect(lineItem.isOverridden("price")).toBe(true);

            resolve();
        });
        lineItem.priceWatt = 0.025;
    });

});

test("reset line item", () => {
    expect.assertions(25);

    return new Promise(resolve => {
        lineItem.once("assessed", () => {
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
            expect(_.round(lineItem.perQuantity, 2)).toBe(1);
            expect(_.round(lineItem.subtotal, 2)).toBe(0);

            expect(_.round(lineItem.laborHours, 2)).toBe(0);
            expect(_.round(lineItem.wage, 2)).toBe(35);
            expect(_.round(lineItem.burden, 2)).toBe(5);

            expect(_.round(lineItem.multiplier, 2)).toBe(1);
            expect(_.round(lineItem.escalator, 2)).toBe(1);
            expect(_.round(lineItem.cost, 2)).toBe(0);

            expect(_.round(lineItem.tax, 2)).toBe(0);
            expect(_.round(lineItem.taxPercent, 2)).toBe(8);

            expect(_.round(lineItem.markup, 2)).toBe(0);
            expect(_.round(lineItem.markupPercent, 2)).toBe(18);

            expect(_.round(lineItem.price, 2)).toBe(0);
            expect(_.round(lineItem.priceWatt, 3)).toBe(0);

            resolve();
        });
        lineItem.reset();
    });
});

test("test multiplier", () => {
    expect.assertions(26);

    return new Promise(resolve => {
        lineItem.once("assessed", () => {
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
            expect(_.round(lineItem.perQuantity, 2)).toBe(1);
            expect(_.round(lineItem.subtotal, 2)).toBe(5);

            expect(_.round(lineItem.laborHours, 2)).toBe(0);
            expect(_.round(lineItem.wage, 2)).toBe(35);
            expect(_.round(lineItem.burden, 2)).toBe(5);

            expect(_.round(lineItem.multiplier, 2)).toBe(2);
            expect(_.round(lineItem.escalator, 2)).toBe(1);
            expect(_.round(lineItem.cost, 2)).toBe(10);

            expect(_.round(lineItem.tax, 2)).toBe(0.8);
            expect(_.round(lineItem.taxPercent, 2)).toBe(8);

            expect(_.round(lineItem.markup, 2)).toBe(1.94);
            expect(_.round(lineItem.markupPercent, 2)).toBe(18);

            expect(_.round(lineItem.price, 2)).toBe(12.74);
            expect(_.round(lineItem.priceWatt, 3)).toBe(0.009); // test bid is 1350 watt

            resolve();
        });
        lineItem.base = "5";
        lineItem.cost = "15";
        lineItem.override("price", true);
        lineItem.multiplier = "2";
    });
});

test("test markup not including tax", async () => {
    expect.assertions(26);

    await new Promise(resolve => {
        lineItem.once("assessed", resolve);
        lineItem.reset();
    });

    return new Promise(resolve => {
        lineItem.bid.project.once("assessed", () => {
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
            expect(_.round(lineItem.perQuantity, 2)).toBe(1);
            expect(_.round(lineItem.subtotal, 2)).toBe(0);

            expect(_.round(lineItem.laborHours, 2)).toBe(0);
            expect(_.round(lineItem.wage, 2)).toBe(35);
            expect(_.round(lineItem.burden, 2)).toBe(5);

            expect(_.round(lineItem.multiplier, 2)).toBe(1);
            expect(_.round(lineItem.escalator, 2)).toBe(1);
            expect(_.round(lineItem.cost, 2)).toBe(10);

            expect(_.round(lineItem.tax, 2)).toBe(0.8);
            expect(_.round(lineItem.taxPercent, 2)).toBe(8);

            expect(_.round(lineItem.markup, 2)).toBe(1.8);
            expect(_.round(lineItem.markupPercent, 2)).toBe(18);

            expect(_.round(lineItem.price, 2)).toBe(12.6);
            expect(_.round(lineItem.priceWatt, 3)).toBe(0.009); // test bid is 1350 watt

            resolve();
        });

        lineItem.cost = "10";
        let strategy = lineItem.bid.entities.variables("markup_strategy");
        strategy.value = false;
    });
});

test("test markup not including tax", async () => {
    expect.assertions(28);

    await new Promise(resolve => {
        lineItem.config.type = "labor";
        lineItem.reset();
        lineItem.wage = "15";
        lineItem.once("assessed", resolve);
        lineItem.burden = "6";
    });
    return new Promise(resolve => {
        lineItem.bid.project.once("assessed", () => {
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
            expect(_.round(lineItem.perQuantity, 2)).toBe(1);
            expect(_.round(lineItem.subtotal, 2)).toBe(5);

            expect(_.round(lineItem.laborHours, 2)).toBe(5);
            expect(_.round(lineItem.wage, 2)).toBe(15);
            expect(_.round(lineItem.burden, 2)).toBe(6);

            expect(_.round(lineItem.multiplier, 2)).toBe(1);
            expect(_.round(lineItem.escalator, 2)).toBe(1);
            expect(_.round(lineItem.cost, 2)).toBe(105);

            expect(_.round(lineItem.tax, 2)).toBe(0);
            expect(_.round(lineItem.taxPercent, 2)).toBe(8);

            expect(_.round(lineItem.markup, 2)).toBe(18.9);
            expect(_.round(lineItem.markupPercent, 2)).toBe(18);

            expect(_.round(lineItem.price, 2)).toBe(123.9);
            expect(_.round(lineItem.priceWatt, 3)).toBe(0.092); // test bid is 1350 watt

            resolve();
        });

        lineItem.base = "5";
    });
});

describe("When changing a line item's config values", () => {
    let $lineItem;
    beforeEach(async () => {
        $lineItem = bid.entities.lineItems(49665);
        await resetLineItem($lineItem);
    });

    afterAll(async () => {
        $lineItem.config.formula = "1"; // reset to original value
        await resetLineItem($lineItem);
    });

    test("should be set dirty when config is changed", () => {
        $lineItem.config.formula = "1"; // ensure start with original value
        $lineItem.assess();
        $lineItem.pristine();

        expect($lineItem.isDirty()).toBe(false);
        $lineItem.config.formula = "2";
        expect($lineItem.isDirty()).toBe(true);
    });

    test("should be set dirty when config is changed back to its original value", () => {
        $lineItem.config.formula = "2";
        $lineItem.assess();
        $lineItem.pristine();

        expect($lineItem.isDirty()).toBe(false);
        $lineItem.config.formula = "1";
        expect($lineItem.isDirty()).toBe(true);
    });
});

describe("When line item is a labor type", () => {
    describe("changing the multiplier", () => {
        beforeAll(async () => {
            await resetLineItem(lineItem);

            return new Promise(resolve => {
                lineItem.bid.project.once("assessed", resolve);
                lineItem.override("cost", true);
                lineItem.override("price", true);
                lineItem.override("labor_hours", true);
                lineItem.base = 5;
                lineItem.multiplier = 2;
            });
        });

        test("should override the multipler", () => {
            expect(lineItem.isOverridden("multiplier")).toBe(true);
            expect(lineItem.multiplier).toBe(2);
        });
        test("should release cost override, if exists", () => {
            expect(lineItem.isOverridden("cost")).toBe(false);
        });
        test("should release price override, if exists", () => {
            expect(lineItem.isOverridden("price")).toBe(false);
        });
        test("should release labor hours override, if exists", () => {
            expect(lineItem.isOverridden("labor_hours")).toBe(false);
        });
        test("should directly impact labor hour results", () => {
            expect(lineItem.laborHours).toBe(10);
        });
        test("should indirectly impact cost results ", () => {
            expect(lineItem.cost).toBe(400);
        });
    });
    describe("and the subtotal is zero", () => {
        describe("changing the cost", () => {
            beforeAll(async () => {
                await resetLineItem(lineItem);

                return new Promise(resolve => {
                    lineItem.bid.project.once("assessed", resolve);
                    lineItem.cost = 300;
                });
            });

            test("should override and back calculate the labor hours.", () => {
                expect(lineItem.isOverridden("cost")).toBe(true);
                expect(lineItem.isOverridden("multiplier")).toBe(false);
                expect(lineItem.isOverridden("labor_hours")).toBe(true);
                expect(_.round(lineItem.subtotal, 2)).toBe(0);
                expect(_.round(lineItem.laborHours, 2)).toBe(7.5);
                expect(_.round(lineItem.cost, 2)).toBe(300);
                expect(_.round(lineItem.price, 2)).toBe(354);
            });

            test("should have a multiplier of 1", () => {
                expect(lineItem.multiplier).toBe(1);
            });
        });

        describe("changing the labor hours", () => {
            beforeAll(async () => {
                await resetLineItem(lineItem);

                return new Promise(resolve => {
                    lineItem.bid.project.once("assessed", resolve);
                    lineItem.override("price", true);
                    lineItem.override("cost", true);
                    lineItem.multiplier = 0.5;
                    lineItem.laborHours = 10;
                });
            });

            test("should override the labor hours", () => {
                expect(lineItem.isOverridden("labor_hours")).toBe(true);
                expect(_.round(lineItem.subtotal, 2)).toBe(0);
                expect(_.round(lineItem.laborHours, 2)).toBe(10);
                expect(_.round(lineItem.cost, 2)).toBe(400);
            });
            test("should release the cost override, if exists", () => {
                expect(lineItem.isOverridden("price")).toBe(false);
            });
            test("should release the price override, if exists", () => {
                expect(lineItem.isOverridden("price")).toBe(false);
            });

            test("should release override and set multiplier to 1", () => {
                expect(lineItem.isOverridden("multiplier")).toBe(false);
                expect(lineItem.multiplier).toBe(1);
            });
        });
    });

    describe("and the subtotal is greater than zero", () => {
        describe("changing the cost", () => {
            beforeAll(async () => {
                await resetLineItem(lineItem);

                return new Promise(resolve => {
                    lineItem.bid.project.once("assessed", resolve);
                    lineItem.override("labor_hours", true);
                    lineItem.base = 50;
                    lineItem.cost = 300;
                });
            });
            test("should release labor hours override, if exists.", () => {
                expect(lineItem.isOverridden("labor_hours")).toBe(false);
            });
            test("should override the multiplier", () => {
                expect(lineItem.isOverridden("multiplier")).toBe(true);
            });
            test("should back calculate the multipler.", () => {
                expect(lineItem.isOverridden("cost")).toBe(true);
                expect(_.round(lineItem.subtotal, 2)).toBe(50);
                expect(_.round(lineItem.laborHours, 2)).toBe(7.5);
                expect(_.round(lineItem.multiplier, 2)).toBe(0.15);
                expect(_.round(lineItem.cost, 2)).toBe(300);
                expect(_.round(lineItem.price, 2)).toBe(354);
            });
        });

        describe("changing the labor hours", () => {
            beforeAll(async () => {
                await resetLineItem(lineItem);

                return new Promise(resolve => {
                    lineItem.bid.project.once("assessed", resolve);
                    lineItem.override("price", true);
                    lineItem.override("cost", true);
                    lineItem.base = 5;
                    lineItem.laborHours = 10;
                });
            });

            test("should override the labor hours", () => {
                expect(lineItem.isOverridden("labor_hours")).toBe(true);
                expect(_.round(lineItem.laborHours, 2)).toBe(10);
                expect(_.round(lineItem.cost, 2)).toBe(400);
            });
            test("should persist the original subtotal", () => {
                expect(_.round(lineItem.subtotal, 2)).toBe(5);
            });
            test("should back calculate and override the multiplier", () => {
                expect(lineItem.isOverridden("multiplier")).toBe(true);
                expect(lineItem.multiplier).toBe(2);
            });
            test("should release the cost override, if exists", () => {
                expect(lineItem.isOverridden("price")).toBe(false);
            });
            test("should release the price override, if exists", () => {
                expect(lineItem.isOverridden("price")).toBe(false);
            });
        });
    });
    describe("Labor tax variable", () => {
        let $lineItem;
        beforeAll(async () => {
            $lineItem = bid.entities.searchByTitle("line_item", "Labor Line Item")[0];
            $lineItem.reset();
            $lineItem.config.type = "labor";
            $lineItem.cost = 300;
            $lineItem.taxPercent = 10;
        });

        afterAll(async () => {
            await new Promise((resolve) => {
                lineItem.bid.project.once("assessed", resolve);
                bid.entities.variables("taxable_labor").value = false;
                $lineItem.reset();
                $lineItem.assess();
            });
        });

        test("Tax should be zero if its false", () => {
            bid.entities.variables("taxable_labor").value = false;
            $lineItem.assess();
            expect($lineItem.tax).toBe(0);
        });

        test("Tax should have tax value if its true", () => {
            bid.entities.variables("taxable_labor").value = true;
            $lineItem.assess();
            expect($lineItem.tax).toBe(30);
        });
    });
});

describe("Consider whether a line item property depends on an undefined dependency value", () => {
    let $lineItem;
    let originalLineItemDependencies;
    beforeAll(() => {
        $lineItem = bid.entities.searchByTitle("line_item", "General Line Item")[0];
        originalLineItemDependencies = _.cloneDeep($lineItem.config.dependencies);
    });

    afterEach(() => {
        $lineItem.config.dependencies = _.cloneDeep(originalLineItemDependencies);
        $lineItem.config.formula = '1';
        $lineItem.reset();
    });

    test("should not be considered to have null depenency if not referencing null dependencies", () => {
        expect.assertions(4);

        expect($lineItem.hasNullDependency("cost")).toBe(false);
        expect($lineItem.hasNullDependency("tax")).toBe(false);
        expect($lineItem.hasNullDependency("markup")).toBe(false);
        expect($lineItem.hasNullDependency("price")).toBe(false);
    });

    test("should be considered to have null depenency for markup and price if markup references a null dependency", () => {
        expect.assertions(4);
        $lineItem.config.dependencies.markup = {
            field: "value",
            type: "metric",
            bid_entity_id: 36095,
        };
        $lineItem.assess();

        expect($lineItem.hasNullDependency("cost")).toBe(false);
        expect($lineItem.hasNullDependency("tax")).toBe(false);
        expect($lineItem.hasNullDependency("markup")).toBe(true);
        expect($lineItem.hasNullDependency("price")).toBe(true);
    });

    test("should be considered to have null depenency for cost, tax, markup and price if scalar references a null dependency", () => {
        expect.assertions(4);
        $lineItem.config.dependencies.scalar = {
            field: "value",
            type: "metric",
            bid_entity_id: 36095,
        };
        $lineItem.config.formula = 'X';
        $lineItem.base = 10;
        $lineItem.assess();

        expect($lineItem.hasNullDependency("price")).toBe(true);
        expect($lineItem.hasNullDependency("markup")).toBe(true);
        expect($lineItem.hasNullDependency("tax")).toBe(true);
        expect($lineItem.hasNullDependency("cost")).toBe(true);
    });

    test("should not be considered to have null depenency if scalar references a null dependency but not used in formula", () => {
        expect.assertions(4);
        $lineItem.config.dependencies.scalar = {
            field: "value",
            type: "metric",
            bid_entity_id: 36095,
        };
        $lineItem.assess();

        expect($lineItem.hasNullDependency("cost")).toBe(false);
        expect($lineItem.hasNullDependency("tax")).toBe(false);
        expect($lineItem.hasNullDependency("markup")).toBe(false);
        expect($lineItem.hasNullDependency("price")).toBe(false);
    });

    test("should not be considered to have null depenency if undefined references is overridden", () => {
        expect.assertions(4);
        $lineItem.config.dependencies.scalar = {
            field: "value",
            type: "metric",
            bid_entity_id: 36095,
        };
        $lineItem.config.formula = "X";
        $lineItem.perQuantity = 1;
        $lineItem.assess();

        expect($lineItem.hasNullDependency("cost")).toBe(false);
        expect($lineItem.hasNullDependency("tax")).toBe(false);
        expect($lineItem.hasNullDependency("markup")).toBe(false);
        expect($lineItem.hasNullDependency("price")).toBe(false);
    });
});
//TODO: Test to ensuring assessing/assessed events only fire once
// even after bind() is called multiple times on the instance
