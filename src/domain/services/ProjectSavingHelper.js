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
      datatables: {},
      dynamic_groups: {},
    };
    _.each(project.bids, bid => {
      if (!bid.isReadOnly()) {
        if (bid.isDirty()) {
          extracted.bids[bid.id] = bid.exportData();

          _.each(bid.entities.lineItems(), item => {
            if (item.isDirty()) {
              extracted.line_items[item.id] = item.exportData();
              delete extracted.line_items[item.id].prediction_model;
            }
          });

          _.each(bid.entities.fields(), item => {
            if (item.isDirty()) extracted.fields[item.id] = item.exportData();
          });

          _.each(bid.entities.components(), item => {
            if (item.isDirty()) extracted.components[item.id] = item.exportData();
          });

          _.each(bid.entities.metrics(), item => {
            if (item.isDirty()) extracted.metrics[item.id] = item.exportData();
          });

          _.each(bid.entities.assemblies(), item => {
            if (item.isDirty()) extracted.assemblies[item.id] = item.exportData();
          });

          _.each(bid.entities.fieldGroups(), item => {
            if (item.isDirty()) extracted.field_groups[item.id] = item.exportData();
          });

          _.each(bid.entities.componentGroups(), item => {
            if (item.isDirty()) extracted.component_groups[item.id] = item.exportData();
          });

          _.each(bid.entities.datatables(), item => {
            if (item.isDirty()) extracted.datatables[item.id] = item.exportData();
          });

          _.each(bid.entities.dynamicGroups(), item => {
            if (item.isDirty()) extracted.dynamic_groups[item.id] = item.exportData();
          });
        }
      } else if ((bid.isLocked() || !bid.isLoaded) && bid.isDirty()) {
        extracted.bids[bid.id] = {
          id: bid.id,
          title: bid.title,
          account_id: bid._data.account_id,
          is_locked: bid.isLocked(),
          is_active: bid._data.is_active,
        };
      }
    });

    return _.cloneDeep(extracted);
  }
}
