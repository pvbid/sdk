import _ from "lodash";
import Helpers from "../../utils/Helpers";

export default class BidModelRelationsHelper {
    constructor(bid) {
        this.bid = bid;
        this._types = [
            "line_item",
            "metric",
            "variable",
            "field",
            "field_group",
            "component",
            "component_group",
            "assembly",
            "datatable"
        ];
    }

    fields(id) {
        return id ? this.getBidEntity("field", id) : this.bid._data.fields;
    }

    fieldGroups(id) {
        return id ? this.getBidEntity("field_group", id) : this.bid._data.field_groups;
    }

    metrics(id) {
        return id ? this.getBidEntity("metric", id) : this.bid._data.metrics;
    }

    lineItems(id) {
        return id ? this.getBidEntity("line_item", id) : this.bid._data.line_items;
    }

    datatables(id) {
        return id ? this.getBidEntity("datatable", id) : this.bid._data.datatables;
    }

    assemblies(id) {
        return id ? this.getBidEntity("assembly", id) : this.bid._data.assemblies;
    }

    /**
     * Gets a bid variable entity by id.  If no id is passed, will return an object of keyed bid variables by their id.
     * 
     * @example <caption>Example of returned keyed object.</caption>
     * {
     *    "xyg4" : <BidVariable>,
     *    "burden" : <BidVariable>
     * }
     * 
     * @param {string} [id] - The id of the component to retrieve.
     * @returns {(Component|Object.<string, Component>|null)}
     */
    variables(id) {
        return id ? this.getBidEntity("bid_variable", id) : this.bid._data.variables;
    }

    /**
     * Gets a component entity by id.  If no id is passed, will return an object of keyed components by their id.
     * 
     * @example <caption>Example of returned keyed object.</caption>
     * {
     *    "92" : <Component>,
     *    "103" : <Component>
     * }
     * 
     * @param {number} [id] - The id of the component to retrieve.
     * @returns {(Component|Object.<string, Component>|null)}
     */
    components(id) {
        return id ? this.getBidEntity("component", id) : this.bid._data.components;
    }

    /**
     * Gets a component group entity by id.  If no id is passed, will return an of object of keyed component groups by their id..
     * 
     * @example <caption>Example of returned keyed object.</caption>
     * {
     *    "92" : <ComponentGroup>,
     *    "103" : <ComponentGroup>
     * }
     * 
     * @param {number} id 
     * @returns {(ComponentGroup|Object.<string, ComponentGroup>|null)}
     */
    componentGroups(id) {
        return id ? this.getBidEntity("component_group", id) : this.bid._data.component_groups;
    }

    assemblyMaps(id) {
        return id ? this.getBidEntity("assembly_map", id) : this.bid._data.assembly_maps;
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
                    return _.isNull(bidEntity.value) ? 0 : Helpers.confirmNumber(bidEntity.value);
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

    /**
     * Gets all the dependants for a bid bid entity.
     * 
     * @param {string} type The type of bid enity. IE. line_item, field, metric, component, etc.
     * @param {int} id The id of the bid entity.
     * @returns [array]
     */
    getDependants(type, id) {
        let dependants = [];
        try {
            _.each(this._types, entityType => {
                const typeKey = entityType === "assembly" ? "assemblies" : entityType + "s";
                const entities = this.getCollection(typeKey);
                _.each(entities, entity => {
                    _.each(entity.dependencies(), dependency => {
                        if (dependency.type === type && dependency.id === id) {
                            dependants.push(entity);
                        }
                    });
                });
            });
        } catch (error) {
            console.log(error, type, typeKey, entity);
        }

        return dependants;
    }

    getBidEntity(type, id) {
        //make typeKey plural.
        let typeKey = type === "assembly" ? "assemblies" : type + "s";
        const collection = this.getCollection(typeKey);
        if (!_.isUndefined(id)) {
            if (_.isNull(id)) {
                return null;
            }

            return !_.isUndefined(collection[id]) ? collection[id] : null;
        } else {
            return collection;
        }
    }

    getCollection(type) {
        if (type === "bid_variables") {
            return this.bid._data.variables;
        } else if (!_.isUndefined(this.bid._data[type])) {
            return this.bid._data[type];
        } else throw `Bid entity collection ${type} does not exist`;
    }

    getComponentByDefId(defId) {
        if (_.isUndefined(this._componentsKeyedByDefinitionId)) {
            this._componentsKeyedByDefinitionId = _.keyBy(this.bid.entities.components(), "definitionId");
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

    dependencyExists(dependencyContract) {
        var dependency = null;
        try {
            dependency = this.getDependency(dependencyContract);
        } catch (e) {
            console.log(e);
        }

        return !_.isUndefined(dependency) && !_.isNull(dependency);
    }

    bidEntityExists(type, id) {
        let bidEntity = this.getBidEntity(type, id);
        return bidEntity ? true : false;
    }

    /**
     * Searches and returns an array of bid entities by their title.
     * Results are case-insensitive.
     * 
     * @param {string} type The type of bid entity to search for: line_item, field, metric, component, assembly, etc.
     * @param {string} query 
     * @returns {BidEntity[]}
     */
    searchByTitle(type, query) {
        let collection = this.getCollection(type);
        return _.filter(collection, item => {
            return item.title.toLowerCase().indexOf(query.trim().toLowerCase()) >= 0;
        });
    }
}
