import { loadTestProject } from "./TestProjectLoader";
let project, bid, field, lineItem;

const assessChangeAsync = async (entity, changes) => {
  await new Promise(res => {
    entity.once("assessed", res);
    changes();
  });
};

describe("Testing Line Item Rules", () => {
  beforeAll(async () => {
    project = await loadTestProject();
    bid = project.bids[190];
    await bid.reassessAsync();
  });

  test("line item should be excluded when no rules are available", async () => {
    expect.assertions(1);

    return new Promise(resolve => {
      let lineItem = bid.entities.searchByTitle("line_item", "General Line Item")[0];
      lineItem.once("assessed", () => {
        expect(lineItem.isIncluded).toBe(false);
        resolve();
      });
      lineItem.config.rules = [];
      lineItem.assess();
    });
  });

  describe("Rule type 'always_include'", () => {
    test("should always include when enabled.", () => {
      expect.assertions(3);
      // line item should have no rules due to previous test.
      let lineItem = bid.entities.searchByTitle("line_item", "General Line Item")[0];
      expect(lineItem.config.rules).toEqual([]);
      return new Promise(resolve => {
        lineItem.once("assessed", () => {
          expect(lineItem.config.rules[0].type).toBe("always_include");
          expect(lineItem.isIncluded).toBe(true);
          resolve();
        });
        lineItem.config.rules.push({ title: "Always Include", type: "always_include" });
        lineItem.assess();
      });
    });
  });
  describe("Rule type expression", () => {
    test("should include line item when (a > b)", async () => {
      expect.assertions(5);

      let lineItem = bid.entities.searchByTitle(
        "line_item",
        "On With Rule Value Expression - Watts > Wage"
      )[0];
      let wattsMetric = bid.entities.searchByTitle("metric", "watts")[0];
      await new Promise(resolve => {
        lineItem.once("assessed", () => {
          expect(lineItem.isIncluded).toBe(false);
          resolve();
        });
        wattsMetric.value = 0;
      });

      await new Promise(resolve => {
        expect(lineItem.isIncluded).toBe(false);

        lineItem.once("assessed", () => {
          expect(lineItem.isIncluded).toBe(true);
          resolve();
        });
        wattsMetric.value = 36;
      });

      await new Promise(resolve => {
        expect(lineItem.isIncluded).toBe(true);

        lineItem.once("assessed", () => {
          expect(lineItem.isIncluded).toBe(false);
          resolve();
        });
        wattsMetric.value = 15;
      });
    });

    test("should exclude line item when (a > b)", async () => {
      expect.assertions(5);

      let lineItem = bid.entities.searchByTitle(
        "line_item",
        "On With Rule Value Expression - Watts > Wage"
      )[0];
      lineItem.config.rules[0].activate_on = false;

      let wattsMetric = bid.entities.searchByTitle("metric", "watts")[0];
      await new Promise(resolve => {
        lineItem.once("assessed", () => {
          expect(lineItem.isIncluded).toBe(true);
          resolve();
        });
        wattsMetric.value = 0;
      });

      await new Promise(resolve => {
        expect(lineItem.isIncluded).toBe(true);

        lineItem.once("assessed", () => {
          expect(lineItem.isIncluded).toBe(false);
          resolve();
        });
        wattsMetric.value = 36;
      });

      await new Promise(resolve => {
        expect(lineItem.isIncluded).toBe(false);

        lineItem.once("assessed", () => {
          expect(lineItem.isIncluded).toBe(true);
          resolve();
        });
        wattsMetric.value = 15;
      });
    });
  });

  describe("Rule toggle list", () => {
    test("should exclude line item with no field selection", () => {
      field = bid.entities.searchByTitle("field", "module type")[0];

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

    test("should include line item with field selection", () => {
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
  });

  describe("Handle undefined dependency in expression", () => {
    let $lineItem;
    let $undefinedField;
    let $wattsMetric;
    let $originalDef;

    beforeAll(() => {
      $undefinedField = bid.entities.searchByTitle("field", "Undefined Number")[0];
      $wattsMetric = bid.entities.searchByTitle("metric", "watts")[0];
      $wattsMetric.value = 100;
      $lineItem = bid.entities.searchByTitle("line_item", "On With Rule Value Expression - Watts > Wage")[0];
      $lineItem.config.rules[0].activate_on = true;
      $originalDef = { ...$lineItem.config.rules[0].dependencies.b };
      $lineItem.config.rules[0].dependencies.b.type = "field";
      $lineItem.config.rules[0].dependencies.b.bid_entity_id = $undefinedField.id;
      $lineItem.config.rules[0].dependencies.b.field = "value";
      $lineItem.bind();
    });

    afterAll(() => {
      bid.entities.variables().predictive_pricing.value = false;
      $wattsMetric.reset();
      $lineItem.config.rules[0].dependencies.b = { ...$originalDef };
      $lineItem.config.rules[0].expression = "a > b";
      $lineItem.bind();
    });

    describe("Predictive pricing is 'off'", () => {
      beforeAll(async () => {
        bid.entities.variables().predictive_pricing.value = false;
        await assessChangeAsync($lineItem, () => {
          $lineItem.reset();
        });
      });

      test("Rules should evaluate undefined dependencies as zero", async () => {
        expect($lineItem.isIncluded).toBe(true); // 100 > 0

        $lineItem.config.rules[0].expression = "a*b";
        await assessChangeAsync($lineItem, () => {
          $lineItem.assess();
        });
        expect($lineItem.isIncluded).toBe(false);
      });
    });

    describe("Predictive pricing is 'on'", () => {
      beforeAll(async () => {
        bid.entities.variables().predictive_pricing.value = true;
        await assessChangeAsync($lineItem, () => {
          $lineItem.reset();
        });
      });

      test("Rules should always be true", async () => {
        expect($lineItem.isIncluded).toBe(true);

        $lineItem.config.rules[0].expression = "a*b*0";
        await assessChangeAsync($lineItem, () => {
          $lineItem.assess();
        });
        expect($lineItem.isIncluded).toBe(true);
      });
    });
  });

  describe("Determine if line item should be weighted", () => {
    afterAll(() => {
      lineItem.bid.entities.variables().predictive_pricing.value = false;
      lineItem.bid.entities.variables().wage.value = 35;
    });

    test("Line item should not be weighted if predictive pricing is off", () => {
      expect.assertions(1);
      lineItem.bid.entities.variables().predictive_pricing.value = false;
      lineItem.reset();

      expect(lineItem.isWeighted).toBe(false);
    });

    test("Line item should not be weighted if predictive pricing is on but all rules are defined", () => {
      expect.assertions(1);
      lineItem.bid.entities.variables().predictive_pricing.value = true;
      lineItem.reset();

      expect(lineItem.isWeighted).toBe(false);
    });

    test("Line item should not be weighted if it is not predicted and a rule is undefined", () => {
      let $lineItem = bid.entities.searchByTitle(
        "line_item",
        "On With Rule Value Expression - Watts > Wage"
      )[0];
      expect.assertions(1);
      $lineItem.bid.entities.variables().predictive_pricing.value = true;
      $lineItem.bid.entities.variables().wage.value = null;
      $lineItem.reset();

      expect($lineItem.isWeighted).toBe(false);
    });

    test("Line item should be weighted if it is predicted and a rule is undefined", () => {
      let $lineItem = bid.entities.searchByTitle(
        "line_item",
        "On With Rule Value Expression - Watts > Wage"
      )[0];
      expect.assertions(1);
      $lineItem.bid.entities.variables().predictive_pricing.value = true;
      $lineItem.bid.entities.variables().wage.value = null;
      $lineItem.useComputedValueWhenAvailable = false;

      expect($lineItem.isWeighted).toBe(true);
    });

    test("Line item should not be weighted if it is predicted but a rule does not depend on the undefined dependency", () => {
      let $lineItem = bid.entities.searchByTitle(
        "line_item",
        "On With Rule Value Expression - Watts > Wage"
      )[0];
      expect.assertions(1);
      $lineItem.config.rules[0].expression = 1;
      $lineItem.bid.entities.variables().predictive_pricing.value = true;
      $lineItem.bid.entities.variables().wage.value = null;
      $lineItem.useComputedValueWhenAvailable = false;

      expect($lineItem.isWeighted).toBe(false);
    });
  });
});
