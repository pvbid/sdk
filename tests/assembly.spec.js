import { loadTestProject } from './TestProjectLoader';
import Field from '../src/domain/Field';

describe("Testing Line Item Predictive Pricing", () => {
  let project, bid;
  beforeAll(async (done) => {
    project = await loadTestProject();
    bid = project.bids[190];
    project.on("assessed", "test", () => {
      done();
    });
    bid.reassessAll(true);
  });

  describe("getFieldByAnchor", () => {
    let assembly;
    beforeAll(() => {
      assembly = bid.entities.assemblies(84);
    });

    it("should return UNDEFINED if an unknown anchor value is given", () => {
      const field = assembly.getFieldByAnchor("not_a_real_anchor");

      expect(field).toBeUndefined();      
    });

    it("should return UNDEFINED if no anchor value is given", () => {
      const field = assembly.getFieldByAnchor();

      expect(field).toBeUndefined();
    });

    it("should return a Field entity if a matching anchor is found", () => {
      const field = assembly.getFieldByAnchor("test_anchor");

      expect(field).toBeInstanceOf(Field);
    });

    it("should return a Field entity that has the anchor value that was given", () => {
      const field = assembly.getFieldByAnchor("test_anchor");

      expect(field.anchor).toBe("test_anchor");
    });
  });

});