import _ from "lodash";

export default class ProjectSavingHelper {
    extract(project) {
        const extracted = {
            project: project.isDirty() ? project.exportData() : {},
            bids: {},
            line_items: {},
            fields: {},
            components: {},
            metrics: {},
            field_groups: {},
            assemblies: {},
            component_groups: {},
            datatables: {}
        };
        _.each(project.bids, bid => {
            if (bid.isUpdateable()) {
                if (bid.isDirty()) extracted.bids[bid.id] = bid.exportData();

                _.each(bid.lineItems(), item => {
                    if (item.isDirty()) extracted.line_items[item.id] = item.exportData();
                });

                _.each(bid.fields(), item => {
                    if (item.isDirty()) extracted.fields[item.id] = item.exportData();
                });

                _.each(bid.components(), item => {
                    if (item.isDirty()) extracted.components[item.id] = item.exportData();
                });

                _.each(bid.metrics(), item => {
                    if (item.isDirty()) extracted.metrics[item.id] = item.exportData();
                });

                _.each(bid.assemblies(), item => {
                    if (item.isDirty()) extracted.assemblies[item.id] = item.exportData();
                });

                _.each(bid.fieldGroups(), item => {
                    if (item.isDirty()) extracted.field_groups[item.id] = item.exportData();
                });

                _.each(bid.componentGroups(), item => {
                    if (item.isDirty()) extracted.component_groups[item.id] = item.exportData();
                });

                _.each(bid.datatables(), item => {
                    if (item.isDirty()) extracted.datatables[item.id] = item.exportData();
                });
            }
        });

        return extracted;
    }
}
