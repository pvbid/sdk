import { loadTestProject } from "./TestProjectLoader";

const assessChangeAsync = async (entity, changes) => {
  await new Promise(res => {
    entity.once("assessed", res);
    changes();
  });
};

describe("Dynamic Groups", () => {
  let project, bid;
  beforeAll(async () => {
    project = await loadTestProject();
    bid = project.bids[190];
    await bid.reassessAsync();
  });

  describe("A group with a line item", () => {
    let group;
    let lineItem;
    beforeAll(() => {
      group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cdd");
      lineItem = bid.entities.lineItems(group.lineItems[0]);
    });

    beforeEach(async () => {
      await assessChangeAsync(group, () => {
        lineItem.reset();
      });
    });

    it("should sum the price correctly", async () => {
      await assessChangeAsync(group, () => {
        lineItem.price = 50;
      });

      expect(group.price).toBe(50);
    });

    it("should sum the cost correctly", async () => {
      await assessChangeAsync(group, () => {
        lineItem.cost = 50;
      });

      expect(group.cost).toBe(50);
    });

    it("should calculate the markup and markup percent correctly", async () => {
      await assessChangeAsync(group, () => {
        lineItem.cost = 50;
      });

      expect(group.markup).toBe(8.625);
      expect(group.markupPercent).toBe(15); // (8.625) / (50 + 7.5) * 100%
    });

    it("should be overridden when the line item is overridden", async () => {
      expect(group.isOverridden()).toBe(false);

      await assessChangeAsync(group, () => {
        lineItem.cost = 50;
      });

      expect(group.isOverridden()).toBe(true);
      expect(group.isOverridden("cost")).toBe(true);
      expect(group.isOverridden("price")).toBe(false);
    });
  });

  describe("A group with a line item duplicated in a sub component", () => {
    let group;
    let lineItem;
    beforeAll(() => {
      group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cd6");
      lineItem = bid.entities.lineItems(group.lineItems[0]);
    });

    beforeEach(async () => {
      await assessChangeAsync(bid, () => {
        lineItem.reset();
      });
    });

    it("should sum the price correctly", async () => {
      await assessChangeAsync(group, () => {
        lineItem.price = 50;
      });

      expect(group.price).toBe(100);
    });

    it("should sum the cost correctly", async () => {
      await assessChangeAsync(bid, () => {
        lineItem.cost = 50;
      });

      expect(group.cost).toBe(100);
    });

    it("should be overridden when the line item is overridden", async () => {
      expect(group.isOverridden()).toBe(false);

      await assessChangeAsync(group, () => {
        lineItem.cost = 50;
      });

      expect(group.isOverridden()).toBe(true);
      expect(group.isOverridden("cost")).toBe(true);
      expect(group.isOverridden("price")).toBe(false);
    });

    it("should count the total number of included line items", () => {
      expect(group.includedLineItemCount).toBe(2);
    });

    it("should handle when the items are excluded", async () => {
      await assessChangeAsync(group, () => {
        lineItem.cost = 50;
        lineItem.isIncluded = false;
      });

      expect(group.cost).toBe(0);
      expect(group.includedLineItemCount).toBe(0);
      expect(group.isOverridden()).toBe(true);
      expect(group.isOverridden("is_included")).toBe(true);
    });
  });

  describe("A group with labor type items", () => {
    let group;
    let lineItem;
    beforeAll(() => {
      group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cd9");
      lineItem = bid.entities.lineItems(group.lineItems[0]);
    });

    beforeEach(async () => {
      await assessChangeAsync(group, () => {
        lineItem.reset();
        lineItem.config.type = "labor";
      });
    });

    it("should count the total number of included line items", () => {
      expect(group.includedLineItemCount).toBe(2);
    });

    it("should assess labor cost", async () => {
      await assessChangeAsync(group, () => {
        lineItem.cost = 50;
      });

      expect(group.laborCost).toBe(100);
      expect(group.nonLaborCost).toBe(0);
    });

    it("should calculate the wage average correctly", () => {
      expect(group.wageAvg).toBe(35); // (35 + 35)/2
    });

    it("should calculate the burden average correctly", () => {
      expect(group.burdenAvg).toBe(5); // (5 + 5)/2
    });
  });

  describe("A group with another group as a child", () => {
    let group;
    let lineItemA;
    let lineItemB;
    beforeAll(() => {
      group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cd8");
      lineItemA = bid.entities.lineItems(49661);
      lineItemB = bid.entities.lineItems(49662);
    });

    beforeEach(async () => {
      await assessChangeAsync(group, () => {
        lineItemA.reset();
        lineItemB.reset();
      });
    });

    it("should sum the price correctly", async () => {
      await assessChangeAsync(group, () => {
        lineItemA.price = 50;
        lineItemB.price = 60;
      });

      expect(group.price).toBe(170); // 50 + 60x2
    });

    it("should sum the cost correctly", async () => {
      await assessChangeAsync(group, () => {
        lineItemA.cost = 50;
        lineItemB.cost = 75;
      });

      expect(group.cost).toBe(200); // 50 + 75x2
    });

    it("should calculate the markup and markup percent correctly", async () => {
      await assessChangeAsync(group, () => {
        lineItemA.cost = 50;
        lineItemB.cost = 75;
      });

      expect(group.markup).toBe(34.5);
      expect(group.markupPercent).toBe(15);
    });

    it("should calculate the tax and tax percent correctly", async () => {
      await assessChangeAsync(group, () => {
        lineItemA.cost = 50;
        lineItemB.cost = 75;
      });

      expect(group.tax).toBe(30); // 50*.15 + 75*.15*2
      expect(group.taxPercent).toBe(15);
    });

    it("should be overridden when the line item is overridden", async () => {
      expect(group.isOverridden()).toBe(false);

      await assessChangeAsync(group, () => {
        lineItemA.cost = 50;
      });

      expect(group.isOverridden()).toBe(true);
      expect(group.isOverridden("cost")).toBe(true);
      expect(group.isOverridden("price")).toBe(false);
    });

    it("should count the total number of included line items", () => {
      expect(group.includedLineItemCount).toBe(3); // 2 + 1
    });
  });

  describe("adding and removing entities", () => {
    describe("add and remove a line item", () => {
      let group;
      let lineItem;
      beforeAll(() => {
        group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031ce0");
        lineItem = bid.entities.lineItems(49662);
      });

      it("should allow line items to be added to the group", async () => {
        expect(group.lineItems.includes(lineItem.id)).toBe(false);

        await assessChangeAsync(group, () => {
          lineItem.cost = 55;
          group.addChild(lineItem);
        });

        expect(group.cost).toBe(55);
        expect(group.lineItems.includes(lineItem.id)).toBe(true);
      });

      it("should allow line items to be removed from the group", async () => {
        expect(group.lineItems.includes(lineItem.id)).toBe(true);
        await assessChangeAsync(group, () => {
          group.removeChildById("line_item", lineItem.id);
        });

        expect(group.lineItems.includes(lineItem.id)).toBe(false);
        expect(group.cost).toBe(0);
      });
    });

    describe("add/remove components", () => {
      let group;
      let component;
      beforeAll(() => {
        group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031ce0");
        component = bid.entities.components(62474);
      });

      it("should allow components to be added to the group", () => {
        expect(group.components.includes(component.id)).toBe(false);
        group.addChild(component);
        expect(group.components.includes(component.id)).toBe(true);
      });

      it("should allow components to be removed from the group by index", () => {
        expect(group.components.includes(component.id)).toBe(true);
        group.removeChildByIndex("component", 0);
        expect(group.components.includes(component.id)).toBe(false);
      });
    });

    describe("add/remove dynamic groups", () => {
      it("should allow other dynamic groups to be added to the group", () => {
        const parent = bid.entities.dynamicGroups("5cb73e7559e8a45c17031ce0");
        const child = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cd9");

        expect(parent.dynamicGroups.includes(child.id)).toBe(false);
        parent.addChild(child);
        expect(parent.dynamicGroups.includes(child.id)).toBe(true);
      });

      it("should allow other dynamic groups to be removed from the group", () => {
        const parent = bid.entities.dynamicGroups("5cb73e7559e8a45c17031ce0");
        const child = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cd9");

        expect(parent.dynamicGroups.includes(child.id)).toBe(true);
        parent.removeChildById("dynamic_group", child.id);
        expect(parent.dynamicGroups.includes(child.id)).toBe(false);
      });

      it("should throw an error if adding a group would create a loop", async () => {
        const parent = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cdd");
        const badChild = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cd8"); // has 'parent' as a child

        expect(() => parent.addChild(badChild)).toThrow();
        expect(() => parent.addChild(parent)).toThrow();
      });

      it("should throw an error if adding a group would create a deep loop", async () => {
        const grandparent = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cdd");
        const parent = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cd9");
        const badGrandchild = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cd8"); // has 'grandparent' as a child (but not parent)

        grandparent.addChild(parent);
        expect(() => parent.addChild(badGrandchild)).toThrow();
      });
    });

    describe("convert a child component to a child group", () => {
      let component;
      let group;
      let newGroup;

      beforeAll(async () => {
        group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031ce0");
        component = bid.entities.components(62472);
        group.addChild(component);
        newGroup = await group.convertComponentToGroup(62472);
      });

      it("should remove the child component and add the new group as a child", () => {
        expect(group.components).not.toContain(62472);
        expect(group.dynamicGroups).toContain(newGroup.id);
      });

      it("should set the new group's title to match the component", () => {
        expect(newGroup.title).toBe(component.title);
      });

      it("should set the new group's line items to match the component", () => {
        expect(newGroup.lineItems).toEqual(component.config.line_items);
      });

      it("should set the new group's components to match the component", () => {
        expect(newGroup.components).toEqual(component.config.components);
      });

      it("should replace duplicates as well", async () => {
        group.addChild(component);
        group.addChild(component);
        const group2 = await group.convertComponentToGroup(62472);
        expect(group.components).not.toContain(62472);
        expect(group.dynamicGroups.filter(id => id === group2.id)).toHaveLength(2);
      });

      it("should throw an error if an invalid component id is given", () => {
        expect(group.convertComponentToGroup(1)).rejects.toThrow();
      });
    });

    it("should throw an error if entity is not the correct type", () => {
      const parent = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cdd");
      const childField = bid.entities.fields(18262);

      expect(() => parent.addChild(childField)).toThrow();
    });
  });

  describe("Dynamic Group recursion and updates", () => {
    let project, bid;
    beforeAll(async () => {
      project = await loadTestProject();
      bid = project.bids[190];
      await bid.reassessAsync();
    });

    describe("Finding sub line items", () => {
      it("should return LineItems from every depth", () => {
        const group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cd8");

        expect(group.getLineItemDescendants().length).toBe(3);
        expect(group.getUniqueLineItemDescendants().size).toBe(2);
      });
    });

    describe("Resetting sub line items", () => {
      it("should reset changes to line items at every depth", async () => {
        const group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cd8");
        const lineItem = group.getLineItemDescendants()[0];

        await assessChangeAsync(group, () => {
          lineItem.isIncluded = false;
        });
        expect(lineItem.isOverridden()).toBe(true);
        expect(group.isOverridden()).toBe(true);

        await assessChangeAsync(group, () => group.reset());
        expect(lineItem.isOverridden()).toBe(false);
        expect(group.isOverridden()).toBe(false);
      });
    });

    it("should propagate changes to Line Item children", async () => {
      const group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cdd");
      const liWithZeroCost = bid.entities.lineItems(49661);
      const liWithNonZeroCost = bid.entities.lineItems(49665);

      await assessChangeAsync(group, () => {
        group.addChild(liWithNonZeroCost);
        group.cost = 100;
      });

      expect(liWithZeroCost.cost).toBeCloseTo(0);
      expect(liWithNonZeroCost.cost).toBe(100);

      await assessChangeAsync(group, () => {
        group.reset();
        group.removeChildById("line_item", liWithNonZeroCost.id);
      });
    });

    it("should propagate percentage changes to Line Item children", async () => {
      const group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cdd");
      const liWithZeroCost = bid.entities.lineItems(49661);
      const liWithNonZeroCost = bid.entities.lineItems(49665);

      await assessChangeAsync(group, () => {
        group.addChild(liWithNonZeroCost);
      });
      await assessChangeAsync(group, () => {
        group.taxPercent = 100;
      });

      expect(group.taxPercent).toBe(100);
      expect(liWithZeroCost.taxPercent).toBeCloseTo(100);
      expect(liWithNonZeroCost.taxPercent).toBe(100);

      await assessChangeAsync(group, () => {
        group.reset();
        group.removeChildById("line_item", liWithNonZeroCost.id);
      });
    });

    it("should propagate changes to Line Item descendants", async () => {
      const parentGroup = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cd8");
      const subGroup = bid.entities.dynamicGroups("5cb73e7559e8a45c17031cdd");

      await assessChangeAsync(parentGroup, () => {
        parentGroup.cost = 100;
      });
      expect(parentGroup.cost).toBe(100);
      expect(subGroup.cost).toBeCloseTo(33.333);

      expect(bid.entities.lineItems(49661).cost).toBeCloseTo(33.333);
      expect(bid.entities.lineItems(49662).cost).toBeCloseTo(33.333);
      expect(bid.entities.lineItems(49970).cost).toBe(0);
      expect(bid.entities.lineItems(49971).cost).toBe(0);
      expect(bid.entities.lineItems(49972).cost).toBe(0);

      await assessChangeAsync(parentGroup, () => parentGroup.reset());
    });

    it("should set direct child Line Items to included when none are included", async () => {
      const group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031ce1");
      expect(group.includedLineItemCount).toBe(0);

      await assessChangeAsync(group, () => {
        group.cost = 100;
      });

      expect(group.cost).toBe(100);
      expect(group.includedLineItemCount).toBe(2);
      expect(bid.entities.lineItems(49970).cost).toBe(50);

      await assessChangeAsync(group, () => group.reset());
    });

    it("should set nested child Line Items to included when none are included", async () => {
      const group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031ce2");
      const lineItem = bid.entities.lineItems(49970);

      await assessChangeAsync(group, () => {
        lineItem.cost = 0;
        lineItem.isIncluded = false;
      });

      expect(group.includedLineItemCount).toBe(0);

      await assessChangeAsync(group, () => {
        group.cost = 100;
      });

      expect(group.cost).toBe(100);
      expect(lineItem.cost).toBe(50);
      expect(group.includedLineItemCount).toBe(2);

      await assessChangeAsync(group, () => {
        lineItem.reset();
      });
    });

    it("should set direct child Line Items percentages when none are included", async () => {
      const group = bid.entities.dynamicGroups("5cb73e7559e8a45c17031ce1");
      expect(group.includedLineItemCount).toBe(0);

      await assessChangeAsync(group, () => {
        bid.entities.lineItems(49970).cost = 50;
        bid.entities.lineItems(49970).isIncluded = false;
        group.markupPercent = 100;
      });

      expect(group.includedLineItemCount).toBe(2);
      expect(bid.entities.lineItems(49970).markupPercent).toBe(100);
      expect(group.markupPercent).toBe(100);

      await assessChangeAsync(group, () => group.reset());
    });
  });
});
