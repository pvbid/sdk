import jest from "jest";
import { loadTestProject } from './TestProjectLoader';

let project;
let bid;
beforeAll(async () => {
    project = await loadTestProject();
    bid = project.bids[190];
    await bid.reassessAsync();
});

describe("When modifying a field group list of fields", () => {
    test("the field group should flag as dirty.", () => {
        let fieldGroup = bid.entities.searchByTitle("field_group", "general")[0];

        fieldGroup.config.fields.push(333);
        expect(fieldGroup.isDirty()).toBe(true);
    });
});

describe("Getting the fields in the group", () => {
    it("should return all the fields in the group", () => {
        const fieldGroup = bid.entities.searchByTitle("field_group", "general")[0];
        const fields = fieldGroup.getFields();
        const expectedFieldIds = fieldGroup.config.fields;
        expectedFieldIds.forEach(id => {
            expect(fields[id]).toBeDefined();
        });
    })
});
