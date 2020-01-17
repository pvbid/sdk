import { cloneDeep } from "lodash";
import { loadTestProject } from "./TestProjectLoader";

describe("Testing Line Item Predictive Pricing", () => {
  let project, bid;
  beforeAll(async done => {
    project = await loadTestProject();
    bid = project.bids[190];
    project.on("assessed", "test", () => {
      done();
    });
    bid.reassessAll(true);
  });

  describe("determine if a line item property is predicted", () => {
    let lineItem;
    beforeAll(() => {
      lineItem = bid.entities.lineItems(49661);
    });

    describe("when predictive_pricing is off", () => {
      beforeAll(() => {
        bid.entities.variables().predictive_pricing.value = false;
      });

      it("should not be predicted", () => {
        expect(lineItem.isPredicted("cost")).toBe(false);
        expect(lineItem.isPredicted("labor_hours")).toBe(false);
        expect(lineItem.isPredicted("price")).toBe(false);
      });

      it("should not be cause the line item's component to be predicted", () => {
        const component = bid.entities.components(62472);
        expect(component.isPredicted("cost")).toBe(false);
        expect(component.isPredicted("labor_hours")).toBe(false);
        expect(component.isPredicted("price")).toBe(false);
      });

      it("should not be cause the line item's dynamic group to be predicted", () => {
        const group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cdd");
        expect(group.isPredicted("cost")).toBe(false);
        expect(group.isPredicted("labor_hours")).toBe(false);
        expect(group.isPredicted("price")).toBe(false);
      });
    });

    describe("when predictive_pricing is on", () => {
      beforeAll(() => {
        bid.entities.variables().predictive_pricing.value = true;
      });

      describe("when line item dependencies are defined", () => {
        describe("when use_computed is true", () => {
          beforeAll(() => {
            bid.entities.variables().use_computed.value = true;
          });

          it("should not be predicted", () => {
            expect(lineItem.isPredicted("cost")).toBe(false);
            expect(lineItem.isPredicted("labor_hours")).toBe(false);
            expect(lineItem.isPredicted("price")).toBe(false);
          });

          describe("when useComputedValueWhenAvailable is overridden in the line item", () => {
            afterEach(() => {
              lineItem.reset();
            });

            it("should be predicted", () => {
              lineItem.useComputedValueWhenAvailable = false;

              expect(lineItem.isPredicted("cost")).toBe(true);
              expect(lineItem.isPredicted("price")).toBe(true);
            });

            it("should be predicted in the dynamic group", async () => {
              const group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cdd");
              await new Promise(res => {
                group.once("assessed", () => res());
                lineItem.useComputedValueWhenAvailable = false;
              });

              expect(group.isPredicted("cost")).toBe(true);
              expect(group.isPredicted("price")).toBe(true);
            });

            it("should be predicted in the component", async () => {
              const component = bid.entities.components(62472);
              await new Promise(res => {
                component.once("assessed", () => res());
                lineItem.useComputedValueWhenAvailable = false;
              });

              expect(component.isPredicted("cost")).toBe(true);
              expect(component.isPredicted("price")).toBe(true);
            });
          });
        });

        describe("when use_computed is false", () => {
          beforeAll(() => {
            bid.entities.variables().use_computed.value = false;
          });
          afterAll(() => {
            bid.entities.variables().use_computed.value = true;
          });

          it("should be predicted", () => {
            expect(lineItem.isPredicted("cost")).toBe(true);
            expect(lineItem.isPredicted("price")).toBe(true);
          });

          describe("when useComputedValueWhenAvailable is overridden in the line item", () => {
            beforeAll(() => {
              lineItem.useComputedValueWhenAvailable = true;
            });
            afterAll(() => {
              lineItem.reset();
            });

            it("should not be predicted", () => {
              expect(lineItem.isPredicted("cost")).toBe(false);
              expect(lineItem.isPredicted("labor_hours")).toBe(false);
              expect(lineItem.isPredicted("price")).toBe(false);
            });
          });
        });
      });

      describe("when line item dependencies that influence the cost are not defined", () => {
        let originalDependencies;
        beforeAll(() => {
          bid.entities.variables().use_computed.value = true;
          originalDependencies = cloneDeep(lineItem.config.dependencies);
        });

        afterEach(() => {
          lineItem.config.dependencies = cloneDeep(originalDependencies);
          lineItem.assess();
        });

        afterAll(() => {
          lineItem.config.formula = "1";
          lineItem.assess();
        });

        it("should be predicted when escalator is undefined", () => {
          lineItem.config.dependencies.escalator = { type: "field", field: "value", bid_entity_id: 18264 };
          lineItem.assess();
          expect(lineItem.isPredicted("cost")).toBe(true);
        });

        describe("bid watts are zero", () => {
          beforeAll(() => {
            bid.entities.getBidEntity("metric", 36093).value = 0;
            return new Promise(resolve => {
              lineItem.bid.project.once("assessed", resolve);
            });
          });

          afterAll(() => {
            bid.entities.getBidEntity("metric", 36093).reset();
            return new Promise(resolve => {
              lineItem.bid.project.once("assessed", resolve);
            });
          });

          it("should not predict", async () => {
            lineItem.config.dependencies.escalator = { type: "field", field: "value", bid_entity_id: 18264 };
            lineItem.assess();
            expect(lineItem.isPredicted("cost")).toBe(false);

            bid.entities.getBidEntity("metric", 36093).reset();
            await new Promise(resolve => {
              lineItem.bid.project.once("assessed", resolve);
            });
            lineItem.assess();
            expect(lineItem.isPredicted("cost")).toBe(true);
          });
        });

        it("should not be predicted when tax is undefined", () => {
          lineItem.config.dependencies.tax = { type: "field", field: "value", bid_entity_id: 18264 };
          lineItem.assess();
          expect(lineItem.isPredicted("cost")).toBe(false);
        });

        it("should be predicted when a used scalar is undefined", () => {
          lineItem.config.formula = "x";
          lineItem.config.dependencies.scalar = { type: "field", field: "value", bid_entity_id: 18264 };
          lineItem.assess();
          expect(lineItem.isPredicted("cost")).toBe(true);
        });

        it("should not be predicted when an unused scalar is undefined", () => {
          lineItem.config.formula = "1";
          lineItem.config.dependencies.scalar = { type: "field", field: "value", bid_entity_id: 18264 };
          lineItem.assess();
          expect(lineItem.isPredicted("cost")).toBe(false);
        });

        it("should not be considered to have a null cost dependency when cost is predicted", () => {
          lineItem.config.dependencies.escalator = { type: "field", field: "value", bid_entity_id: 18264 };
          lineItem.assess();
          expect(lineItem.isPredicted("cost")).toBe(true);
          expect(lineItem.hasNullDependency("cost")).toBe(false);
        });

        describe("when undefined dependencies become defined", () => {
          beforeAll(() => {
            lineItem.bid.entities.fields(18264).value = 10;
            lineItem.assess();
          });

          afterAll(() => {
            lineItem.bid.entities.fields(18264).value = null;
          });

          it("should not be predicted", () => {
            expect(lineItem.isPredicted("cost")).toBe(false);
          });
        });
      });

      describe("when dependencies that do not influence the cost are undefined", () => {
        let originalDependencyContract;
        beforeAll(() => {
          bid.entities.variables().use_computed.value = true;
          originalDependencyContract = lineItem.config.dependencies.tax;
          lineItem.config.dependencies.tax = { type: "field", field: "value", bid_entity_id: 18264 };
          lineItem.assess();
        });

        afterAll(() => {
          lineItem.config.dependencies.tax = originalDependencyContract;
          lineItem.assess();
        });

        it("should not cause the cost to be predicted", () => {
          expect(lineItem.isPredicted("cost")).toBe(false);
        });
      });
    });

    describe("when cost is overridden", () => {
      beforeAll(() => {
        lineItem.cost = 100;
      });
      afterAll(() => {
        lineItem.reset();
      });

      it("should not be predicted", () => {
        expect(lineItem.isPredicted("cost")).toBe(false);
        expect(lineItem.isPredicted("price")).toBe(false);
      });
    });
  });

  describe("Correctly predict a line item's values using a prediction model", () => {
    let lineItem;
    beforeAll(() => {
      bid.entities.variables().predictive_pricing.value = true;
      bid.entities.variables().use_computed.value = false;
      lineItem = bid.entities.lineItems(49661);
    });

    afterAll(() => {
      lineItem.reset();
    });

    describe("Dollar line item", () => {
      it("should get the cost filtered models only", () => {
        expect(lineItem._predictionService.getCostPredictionModels().length).toBe(2);

        lineItem._predictionService.getCostPredictionModels().forEach(model => {
          expect(model.dependencies.y.field).toBe("cost");
        });
      });

      it("should evaluate the prediction models weighted by r2 to get cost", () => {
        expect(lineItem.laborHours).toBe(0);
        expect(lineItem.cost).toBeCloseTo(423, 0); // 1350 watts weighted average of predict models
      });
    });

    describe("Labor line item", () => {
      beforeAll(() => {
        lineItem.config.type = "labor";
      });
      afterAll(() => {
        lineItem.config.type = "dollar";
      });

      it("should evaluate the prediction model to get labor hours", () => {
        lineItem.assess();
        expect(lineItem.laborHours).toBe(135); // 1350 watts w/ 0.1*watt model
        expect(lineItem.isPredicted("labor_hours")).toBe(true);
        expect(lineItem.cost).toBe(5400); // not the predicted value - should be labor * wage * burden
      });
    });

    describe("When using contribution weight", () => {
      beforeAll(() => {
        lineItem.isWeighted = true;
      });
      afterAll(() => {
        lineItem.reset();
      });

      it("should weight the cost by the contribution weight", () => {
        lineItem.assess();
        expect(lineItem.cost).toBeCloseTo(317, 0); // 0.75 contribution weight
      });
    });

    describe("Patches", () => {
      describe("When the prediction model depends on an undefined dependency", () => {
        beforeAll(() => {
          lineItem._data.prediction_model.models.push({
            model: {
              r2: 0.45,
              type: "simple_linear",
              equation: "0.1a + 1400",
            },
            bounds: [],
            is_base: false,
            dependencies: {
              a: { type: "metric", field: "value", definition_id: 842 },
              y: { type: "line_item", field: "cost", definition_id: 1577 },
            },
          });
          lineItem.assess();
        });

        afterAll(() => {
          lineItem._data.prediction_model.models.pop();
        });

        it("should predict using only the prediction models with defined dependencies", () => {
          expect(lineItem.laborHours).toBe(0);
          expect(lineItem.cost).toBeCloseTo(423, 0); // 1350 watts weighted average of predict models
        });

        describe("When the prediction model was created before December 2019", () => {
          beforeAll(() => {
            lineItem._predictionService._canUsePatch.ignoreNullDependency = false;
            lineItem.assess();
          });

          afterAll(() => {
            lineItem._predictionService._canUsePatch.ignoreNullDependency = true;
            lineItem.assess();
          });

          it("should make an exception and use the undefined dependency", () => {
            expect(lineItem.cost).toBeCloseTo(661, 0);
          });
        });
      });

      describe("When the prediction model results in a non numeric value", () => {
        beforeAll(() => {
          lineItem._data.prediction_model.models.push({
            model: {
              r2: 0.95,
              type: "simple_linear",
              equation: "log(a) + 1400", // => -Infinity
            },
            bounds: [],
            is_base: false,
            dependencies: {
              a: { type: "metric", field: "value", definition_id: 844 }, // zero
              y: { type: "line_item", field: "cost", definition_id: 1577 },
            },
          });
          lineItem._predictionService._canUsePatch.nonNumericResult = true;
          lineItem.assess();
        });

        afterAll(() => {
          lineItem._data.prediction_model.models.pop();
        });

        it("should predict using only the prediction models with numeric results", () => {
          expect(lineItem.laborHours).toBe(0);
          expect(lineItem.cost).toBeCloseTo(423, 0);
        });

        describe("When the prediction model was created before January 2020", () => {
          beforeAll(() => {
            lineItem._predictionService._canUsePatch.nonNumericResult = false;
            lineItem.assess();
          });

          afterAll(() => {
            lineItem._predictionService._canUsePatch.nonNumericResult = true;
            lineItem.assess();
          });

          it("should make an exception and use the non numeric result", () => {
            expect(lineItem.cost).toBeCloseTo(252, 0);
          });
        });
      });
    });
  });

  describe("When a line item does not yet have a prediction model", () => {
    beforeAll(() => {
      bid.entities.variables().predictive_pricing.value = true;
    });
    afterAll(() => {
      bid.entities.variables().predictive_pricing.value = false;
    });

    it("should not predict", async () => {
      const $lineItem = bid.entities.lineItems(49973);
      $lineItem.useComputedValueWhenAvailable = false;
      $lineItem.assess();
      expect($lineItem.isPredicted("cost")).toBe(false);
    });
  });

  describe("When a line item does not have a definition id", () => {
    beforeAll(() => {
      bid.entities.variables().predictive_pricing.value = true;
    });
    afterAll(() => {
      bid.entities.variables().predictive_pricing.value = false;
    });

    it("should not predict", async () => {
      const $lineItem = await bid.addLineItem("New Line Item (no def)");
      $lineItem.quantity = 100;
      $lineItem.perQuantity = 1;
      $lineItem.useComputedValueWhenAvailable = true;
      $lineItem.assess();
      expect($lineItem.cost).toBe(100);
      expect($lineItem.isPredicted("cost")).toBe(false);
    });
  });
});
