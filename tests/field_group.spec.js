import { loadTestProject } from "./TestProjectLoader";

let project;
let bid;
beforeAll(async () => {
  project = await loadTestProject();
  bid = project.bids[190];
  await bid.reassessAsync();
});

describe("When modifying a field group list of fields", () => {
  let group;

  beforeAll(() => {
    group = bid.entities.searchByTitle("field_group", "general")[0];
    group.config.fields.push(333);
  });

  afterAll(() => {
    group.config.fields.pop();
  });

  test("the field group should flag as dirty.", () => {
    expect(group.isDirty()).toBe(true);
  });
});

describe("Getting the fields in the group", () => {
  let group;
  let originalFieldList;

  beforeAll(() => {
    group = bid.entities.searchByTitle("field_group", "general")[0];
    originalFieldList = [...group.config.fields];
  });

  afterAll(() => {
    // reset fields list
    group.config.fields = originalFieldList;
  });

  it("should return all the fields in the group", () => {
    const fields = group.getFields();
    const expectedFieldIds = group.config.fields;
    expectedFieldIds.forEach(id => {
      expect(fields[id]).toBeDefined();
    });
  });

  it("should not include fields that do not exists", () => {
    const INVALID_FIELD_ID = 111;
    group.config.fields.push(INVALID_FIELD_ID);
    const fields = group.getFields();
    expect(Object.keys(fields)).not.toContain(INVALID_FIELD_ID);
  });
});
