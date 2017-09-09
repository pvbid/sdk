import _ from "lodash";

export default class ProjectSavingHelper {
    extract(project) {
        const extracted = {
            project: project.is_dirty ? project.exportData() : {},
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
                if (bid.is_dirty) extracted.bids[bid.id] = bid.exportData();

                _.each(bid.lineItems(), item => {
                    if (item.is_dirty) extracted.line_items[item.id] = item.exportData();
                });

                _.each(bid.fields(), item => {
                    if (item.is_dirty) extracted.fields[item.id] = item.exportData();
                });

                _.each(bid.components(), item => {
                    if (item.is_dirty) extracted.components[item.id] = item.exportData();
                });

                _.each(bid.metrics(), item => {
                    if (item.is_dirty) extracted.metrics[item.id] = item.exportData();
                });

                _.each(bid.assemblies(), item => {
                    if (item.is_dirty) extracted.assemblies[item.id] = item.exportData();
                });

                _.each(bid.fieldGroups(), item => {
                    if (item.is_dirty) extracted.field_groups[item.id] = item.exportData();
                });

                _.each(bid.componentGroups(), item => {
                    if (item.is_dirty) extracted.component_groups[item.id] = item.exportData();
                });

                _.each(bid.datatables(), item => {
                    if (item.is_dirty) extracted.datatables[item.id] = item.exportData();
                });
            }
        });

        return extracted;
    }
}
