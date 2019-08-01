import WorkupService from "@/domain/services/WorkupService";
import { loadTestProject } from "./TestProjectLoader";
import Bid from "@/domain/Bid";
import Project from "@/domain/Project";
import { Workup, WorkupItem } from "@/types";
import Field from "@/domain/Field";

describe("Workup Service", () => {
  let bid: Bid;
  let project: Project;

  beforeAll(async () => {
    project = await loadTestProject();
    bid = project.bids[190];
    await bid.reassessAsync();
  });

  describe("evaluating a workup", () => {
    describe("workup item", () => {
      it("should be quantity x per quantity", () => {
        const val = WorkupService.evaluateItem({ quantity: 2, per_quantity: 25 });
        expect(val).toBe(50);
      });

      it("should be zero if quantity or per quantity are not set", () => {
        const val = WorkupService.evaluateItem({});
        expect(val).toBe(0);
      });

      it("should use a referenced field value for per quantity", () => {
        const field = bid.entities.fields(18262);
        const item = { quantity: 1, per_quantity_ref: "clpa" };
        const val = WorkupService.evaluateItem(item, field);
        expect(val).toBe(450);
      });
    });

    it("should be null if reference quantity is zero", () => {
      const workup: Workup = { reference_quantity: 0, items: [{}] };
      const val = WorkupService.evaluateWorkup(workup);
      expect(val).toBe(null);
    });

    it("should be null if there are no items", () => {
      const workup: Workup = { reference_quantity: 10, items: [] };
      const val = WorkupService.evaluateWorkup(workup);
      expect(val).toBe(null);
    });

    it("should calculate correctly", () => {
      const workup: Workup = {
        reference_quantity: 10,
        items: [{ quantity: 2, per_quantity: 25 }, { quantity: 10, per_quantity: 10 }],
      };
      const val = WorkupService.evaluateWorkup(workup);
      expect(val).toBe(15);
    });

    it("should calculate correctly with a reference", () => {
      const workup: Workup = {
        reference_quantity: 10,
        field_id: 18262,
        items: [
          { quantity: 2, per_quantity: 25 },
          { quantity: 1, per_quantity: 10, per_quantity_ref: "clpa" }, // 450
        ],
      };
      const val = WorkupService.evaluateWorkup(workup, bid);
      expect(val).toBe(50);
    });
  });

  describe("field reference", () => {
    it("should remove references from items", () => {
      const items = WorkupService.removeFieldReferences([{ per_quantity_ref: "clpa" }]);
      expect(items[0].per_quantity_ref).toBeUndefined();
    });

    it("should find the referenced field", () => {
      const workup: Workup = { field_id: 18262 };
      const field = WorkupService.getDependency(workup, bid);
      expect(field.id).toBe(18262);
      expect(field).toBeInstanceOf(Field);
    });

    it("should get valid options for per quantity", () => {
      const workup: Workup = { field_id: 18262 };
      const field = WorkupService.getDependency(workup, bid);
      const expected = {
        at57: {
          id: "at57",
          is_key: true,
          title: "Module",
        },
        clpa: {
          id: "clpa",
          is_key: false,
          title: "Watts",
        },
        d674: {
          id: "d674",
          is_key: false,
          title: "Empty",
        },
        tp7q: {
          id: "tp7q",
          is_key: false,
          title: "Unit Price",
        },
      };
      expect(WorkupService.getPerQuantityOptions(field)).toStrictEqual(expected);
    });

    describe("determining hasNullDependency", () => {
      afterAll(() => {
        const field = bid.entities.fields(18262);
        field.value = "mhzk"; // reset the field value
      });

      it("should be false if there are no items", () => {
        const workup: Workup = { reference_quantity: 1, items: [], field_id: 18262 };
        expect(WorkupService.hasNullDependency(workup, bid)).toBe(false);
      });

      it("should be false if there is not field dependency", () => {
        const workup: Workup = { reference_quantity: 1, items: [{ per_quantity_ref: "clpa" }] };
        expect(WorkupService.hasNullDependency(workup, bid)).toBe(false);
      });

      it("should be false if reference quantity is 0", () => {
        const workup: Workup = { reference_quantity: 0, items: [{}], field_id: 18262 };
        expect(WorkupService.hasNullDependency(workup, bid)).toBe(false);
      });

      it("should be false if the items do not use reference values", () => {
        const workup: Workup = { reference_quantity: 1, items: [{}], field_id: 18262 };
        expect(WorkupService.hasNullDependency(workup, bid)).toBe(false);
      });

      it("should be false if the reference is fully defined", () => {
        const workup: Workup = {
          reference_quantity: 1,
          items: [{ per_quantity_ref: "clpa" }],
          field_id: 18262,
        };
        expect(WorkupService.hasNullDependency(workup, bid)).toBe(false);
      });

      it("should be true if the field value is not set", () => {
        const workup: Workup = {
          reference_quantity: 1,
          items: [{ per_quantity_ref: "clpa" }],
          field_id: 18262,
        };
        const field = WorkupService.getDependency(workup, bid);
        field.value = null;
        expect(WorkupService.hasNullDependency(workup, bid)).toBe(true);
      });

      it("should be true if the datatable value is empty", () => {
        const workup: Workup = {
          reference_quantity: 1,
          items: [{ per_quantity_ref: "d674" }],
          field_id: 18262,
        };
        const field = WorkupService.getDependency(workup, bid);
        field.value = null;
        expect(WorkupService.hasNullDependency(workup, bid)).toBe(true);
      });
    });
  });
});
