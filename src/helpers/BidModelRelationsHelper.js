import _ from "lodash";
import Helpers from "../Helpers";

export default class BidModelRelationsHelper {
    constructor(bid) {
        this.bid = bid;
    }

    getDependency(dependencyContract) {
        if (!_.isUndefined(dependencyContract) && !_.isUndefined(dependencyContract.type)) {
            switch (dependencyContract.type) {
                case "line_item":
                case "field":
                case "metric":
                case "datatable":
                case "component":
                case "assembly":
                    return this.getBidEntity(dependencyContract.type, dependencyContract.bid_entity_id);
                case "bid_variable":
                    return this.bid._data.variables[dependencyContract.field];
                case "bid":
                    return this.bid;
                default:
                    return null;
            }
        } else return null;
    }

    getDependencyValue(dependencyContract) {
        var bidEntity = this.getDependency(dependencyContract);

        if (!_.isNull(bidEntity) && !_.isUndefined(bidEntity)) {
            switch (dependencyContract.type) {
                case "bid_variable":
                    return bidEntity.value;
                case "line_item":
                    return !_.isNull(bidEntity[dependencyContract.field]) && bidEntity.isIncluded
                        ? Helpers.confirmNumber(bidEntity[dependencyContract.field])
                        : 0;
                case "component":
                    return !_.isNull(bidEntity[dependencyContract.field])
                        ? Helpers.confirmNumber(bidEntity[dependencyContract.field])
                        : 0;
                case "field":
                    if (!_.isNull(bidEntity.value)) {
                        return this.getFieldValue(bidEntity, dependencyContract.field);
                    } else return null;
                    break;
                case "datatable":
                    return this.getDatatableValue(
                        bidEntity,
                        dependencyContract.field.column,
                        dependencyContract.field.row
                    );
                case "metric":
                    return _.isNull(bidEntity.value) ? 0 : parseFloat(bidEntity.value);
                case "bid":
                    return _.isNull(bidEntity[dependencyContract.field])
                        ? 0
                        : Helpers.confirmNumber(bidEntity[dependencyContract.field]);
                default:
                    return null;
            }
        } else return null;
    }

    getFieldValue(field, dataColumnId) {
        if (!_.isUndefined(field) && !_.isNull(field.value)) {
            if (field.config.type === "list") {
                let datatable = this.getBidEntity("datatable", field.config.dependencies.datatable.bid_entity_id);
                return this.getDatatableValue(datatable, dataColumnId, field.value);
            } else return field.value;
        } else return null;
    }

    getBidEntitiesByDefId(type, defId) {
        if (type === "metric") {
            return _.filter(this.getBidEntity("metric"), {
                definition_id: defId
            });
        } else if (type === "field") {
            return _.filter(this.getBidEntity("field"), {
                definition_id: defId
            });
        }
    }

    getBidEntity(type, id) {
        //make typeKey plural.
        let typeKey = type === "assembly" ? "assemblies" : type + "s";

        if (!_.isUndefined(id)) {
            if (_.isNull(id)) {
                return null;
            }

            if (typeKey === "bid_variables") {
                return !_.isUndefined(this.bid._data.variables[id]) ? this.bid._data.variables[id].value : null;
            } else {
                return !_.isUndefined(this.bid._data[typeKey][id]) ? this.bid._data[typeKey][id] : null;
            }
        } else {
            if (typeKey === "bid_variables") {
                return this._variables;
            } else {
                return !_.isUndefined(this.bid._data[typeKey]) ? this.bid._data[typeKey] : null;
            }
        }
    }

    getComponentByDefId(defId) {
        if (_.isUndefined(this._componentsKeyedByDefinitionId)) {
            this._componentsKeyedByDefinitionId = _.keyBy(this.bid.components(), "definitionId");
        }
        return !_.isUndefined(this._componentsKeyedByDefinitionId[defId])
            ? this._componentsKeyedByDefinitionId[defId]
            : null;
    }

    getDatatableValue(datatable, columnId, rowId) {
        if (!_.isUndefined(datatable) && !_.isUndefined(columnId)) {
            if (datatable && columnId && rowId) {
                var columnIndex = datatable.config.columns.findIndex(c => c.id === columnId);
                var row = datatable.config.rows.find(r => r.id === rowId);

                return row ? row.values[columnIndex] : null;
            } else return null;
        } else throw "Datatable is not defined.";
    }

    getDatatableColumnRows(datatableId, columnId) {
        var bidDatatable = this.getBidEntity("datatable", datatableId);

        var keyPlacement = null;
        bidDatatable.config.columns.forEach(function(column, index) {
            if (column.id == columnId) {
                keyPlacement = index;
                return false;
            }
        });

        var options = _.reduce(
            bidDatatable.config.rows,
            function(results, row) {
                results.push({
                    id: row.id,
                    value: row.values[keyPlacement]
                });
                return results;
            },
            []
        );

        return options;
    }

    bidEntityExists(type, id) {
        let bidEntity = this.getBidEntity(type, id);
        return bidEntity ? true : false;
    }
}
