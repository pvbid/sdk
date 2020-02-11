import { loadTestProject } from "./TestProjectLoader";

describe("Un-loaded bid", () => {
  let project;
  let bid;
  beforeAll(async () => {
    project = await loadTestProject(false);
    bid = project.bids[190];
  });

  test("should still be able to activate/deactivate", () => {
    expect(bid.isActive).toBe(true);
    bid.isActive = false;
    expect(bid.isActive).toBe(false);
    bid.isActive = true;
    expect(bid.isActive).toBe(true);
  });

  test("isLoaded should be false", () => {
    expect(bid.isLoaded).toBe(false);
  });

  test("should not be assessable", () => {
    expect(bid.isAssessable()).toBe(false);
  });

  test("should be loadable", async () => {
    await bid.load({ skipSave: true });
    expect(bid.isLoaded).toBe(true);
  });
});

describe("Loaded Bid", () => {
  let project;
  let bid;
  beforeAll(async () => {
    project = await loadTestProject();
    bid = project.bids[190];
    await bid.reassessAsync();
  });

  test("isLoaded should be true", () => {
    expect(bid.isLoaded).toBe(true);
  });

  test("should be assessable", () => {
    expect(bid.isAssessable()).toBe(true);
  });

  describe("When bid markup reset occurs", () => {
    beforeEach(async () => {
      return new Promise(resolve => {
        bid.project.once("updated", () => {
          resolve();
        });
        bid.price = 3000;
      });
    });

    test("all line item markup_percents should loose their overrides.", async () => {
      let lineItem = bid.entities.searchByTitle("line_item", "modules")[0];
      expect.assertions(Object.keys(bid.entities.lineItems()).length + 1);
      expect(lineItem.isOverridden("markup_percent")).toBe(true);

      return new Promise(resolve => {
        lineItem.bid.project.once("updated", () => {
          Object.values(bid.entities.lineItems()).forEach(li => {
            expect(li.isOverridden("markup_percent")).toBe(false);
          });
          resolve();
        });
        bid.resetMarkup();
      });
    });
  });

  describe("When bid markup percent override occurs", () => {
    const targetBidMarkupPercent = 25;
    let zeroMarkupLineItem;
    beforeAll(async () => {
      bid.resetMarkup();
      zeroMarkupLineItem = bid.entities.lineItems(49975);
      zeroMarkupLineItem.isIncluded = true;
      await bid.reassessAsync();

      bid.markupPercent = targetBidMarkupPercent;
      await bid.reassessAsync();
    });

    afterAll(async () => {
      bid.resetMarkup();
      zeroMarkupLineItem.isIncluded = false;
      await bid.reassessAsync();
    });

    test("bid markup matches the given override", () => {
      expect(bid.markupPercent).toBe(targetBidMarkupPercent);
    });

    test("zero markup line items are not given a markup value", () => {
      expect(zeroMarkupLineItem.isIncluded).toBe(true);
      expect(zeroMarkupLineItem.markup).toBe(0);
      expect(zeroMarkupLineItem.markupPercent).toBe(0);
    });

    describe("When markup is overridden from zero", () => {
      beforeAll(async () => {
        bid.markupPercent = 0;
        await bid.reassessAsync();
        bid.markupPercent = targetBidMarkupPercent;
        await bid.reassessAsync();
      });

      test("bid markup matches the given override", async () => {
        expect(bid.markupPercent).toBe(targetBidMarkupPercent);
      });
    });
  });

  describe("when a bid uses predictive pricing", () => {
    beforeAll(() => {
      return new Promise(resolve => {
        bid.project.once("updated", resolve);
        bid.entities.variables().predictive_pricing.value = true;
      });
    });

    afterAll(() => {
      return new Promise(resolve => {
        bid.project.once("updated", resolve);
        bid.entities.variables().use_computed.value = true;
        bid.entities.variables().predictive_pricing.value = false;
      });
    });

    describe("isPredicted status should represent that of the bids line items", () => {
      test("when line items are not predicted", () => {
        expect.assertions(2);
        expect(bid.isPredicted("cost")).toBe(false);
        expect(bid.isPredicted("price")).toBe(false);
      });

      test("when line items are predicted", async () => {
        expect.assertions(2);
        await new Promise(resolve => {
          bid.project.once("updated", resolve);
          bid.entities.variables().use_computed.value = false;
        });
        expect(bid.isPredicted("cost")).toBe(true);
        expect(bid.isPredicted("price")).toBe(true);
      });
    });
  });
});

//TODO: Test locking/unlocking bid based on user permission, user in project, user being admin.
