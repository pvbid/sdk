import { xor } from "lodash";
import { loadTestProject } from "./TestProjectLoader";

describe("Component Groups", () => {
  let project, bid;
  beforeAll(async () => {
    project = await loadTestProject();
    bid = project.bids[190];
    await bid.reassessAsync();
  });

  describe("Finding components in the group", () => {
    let componentGroup;
    beforeAll(() => {
      componentGroup = bid.entities.componentGroups(813);
    });

    it("should get all the components in the component group (nested and top level)", () => {
      const expectedComponentIds = [62470, 62471, 62472, 62473, 62474];
      const components = componentGroup.getComponents();

      const componentIds = Object.values(components).map(c => c.id);
      expect(xor(componentIds, expectedComponentIds).length).toBe(0);
    });

    describe("Top level components only", () => {
      it("should only include top level components", () => {
        const expectedComponentIds = [62470, 62471, 62472, 62473];
        const components = componentGroup.getComponents(true);

        const componentIds = Object.values(components).map(c => c.id);
        expect(xor(componentIds, expectedComponentIds).length).toBe(0);
      });
    });
  });

});