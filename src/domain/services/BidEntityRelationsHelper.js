import _ from "lodash";
import Helpers from "../../utils/Helpers";

/**
 * Helper class to manage all bid entities in a bid.
 *
 * @class BidEntityRelationsHelper
 */
export default class BidEntityRelationsHelper {
    /**
     * Creates an instance of BidEntityRelationsHelper.
     * @param {Bid} bid
     */
    constructor(bid) {
        /**
         * @type {Bid}
         */
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

    /**
     * Gets a field entity by id.  If no id is passed, will return an of object of keyed fields by their id..
     *
     * @example <caption>Example of returned keyed object.</caption>
     * {
     *    "92" : <Field>,
     *    "103" : <Field>
     * }
     *
     * @param {number} id
     * @returns {?(Field|Object.<string, Field>)}
     */
    fields(id) {
        return id ? this.getBidEntity("field", id) : this.bid._data.fields;
    }

    /**
     * Gets a field group entity by id.  If no id is passed, will return an of object of keyed field groups by their id..
     *
     * @example <caption>Example of returned keyed object.</caption>
     * {
     *    "92" : <FieldGroup>,
     *    "103" : <FieldGroup>
     * }
     *
     * @param {number} id
     * @returns {?(FieldGroup|Object.<string, FieldGroup>)}
     */
    fieldGroups(id) {
        return id ? this.getBidEntity("field_group", id) : this.bid._data.field_groups;
    }

    /**
     * Gets a metric entity by id.  If no id is passed, will return an of object of keyed metrics by their id..
     *
     * @example <caption>Example of returned keyed object.</caption>
     * {
     *    "92" : <Metric>,
     *    "103" : <Metric>
     * }
     *
     * @param {number} id
     * @returns {?(Metric|Object.<string, Metric>)}
     */
    metrics(id) {
        return id ? this.getBidEntity("metric", id) : this.bid._data.metrics;
    }

    /**
     * Gets a line item entity by id.  If no id is passed, will return an of object of keyed line items by their id..
     *
     * @example <caption>Example of returned keyed object.</caption>
     * {
     *    "92" : <LineItem>,
     *    "103" : <LineItem>
     * }
     *
     * @param {number} id
     * @returns {?(LineItem|Object.<string, LineItem>)}
     */
    lineItems(id) {
        return id ? this.getBidEntity("line_item", id) : this.bid._data.line_items;
    }

    /**
     * Gets a datatable entity by id.  If no id is passed, will return an of object of keyed datatables by their id..
     *
     * @example <caption>Example of returned keyed object.</caption>
     * {
     *    "92" : <Datatable>,
     *    "103" : <Datatable>
     * }
     *
     * @param {number} id
     * @returns {?(Datatable|Object.<string, Datatable>)}
     */
    datatables(id) {
        return id ? this.getBidEntity("datatable", id) : this.bid._data.datatables;
    }

    /**
     * Gets an assembly entity by id.  If no id is passed, will return an of object of keyed assemblies by their id..
     *
     * @example <caption>Example of returned keyed object.</caption>
     * {
     *    "92" : <Assembly>,
     *    "103" : <Assembly>
     * }
     *
     * @param {number} id
     * @returns {?(Assembly|Object.<string, Assembly>)}
     */
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
     * @returns {?(Component|Object.<string, Component>)}
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
     * @returns {?(Component|Object.<string, Component>)}
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
     * @returns {?(ComponentGroup|Object.<string, ComponentGroup>)}
     */
    componentGroups(id) {
        return id ? this.getBidEntity("component_group", id) : this.bid._data.component_groups;
    }

    /**
     * Gets a dynamic group entity by id. If no id is passed, will return an of object of keyed dynamic groups by their id.
     *
     * @example <caption>Example of returned keyed object.</caption>
     * {
     *    "92" : <DynamicGroup>,
     *    "103" : <DynamicGroup>
     * }
     *
     * @param {string} id
     * @returns {?(DynamicGroup|Object.<string, DynamicGroup>)}
     */
    dynamicGroups(id) {
        return id ? this.getBidEntity("dynamic_group", id) : this.bid._data.dynamic_groups;
    }

    /**
     * Gets a assembly map entity by id.  If no id is passed, will return an object of keyed assembly maps by their id.
     *
     * @example <caption>Example of returned keyed object.</caption>
     * {
     *    "92" : <AssemblyMap>,
     *    "103" : <AssemblyMap>
     * }
     *
     * @param {number} [id] - The id of the assembly map to retrieve.
     * @returns {?(AssemblyMap|Object.<string, AssemblyMap>)}
     */
    assemblyMaps(id) {
        return id ? this.getBidEntity("assembly_map", id) : this.bid._data.assembly_maps;
    }

    /**
     * Gets a bid entity by a dependency contract.
     *
     * @example <caption>Example a dependency contract.</caption>
     * {
     *    "type" : <string>,
     *    "bid_entity_id" : <string>,
     *    "field" : <string>
     * }
     *
     * @param {object} dependencyContract
     * @param {string} dependencyContract.type - The type of bid entity, ie: line_item, metric, field, component, compnent_group, assembly, etc
     * @param {string} dependencyContract.bid_entity_id - The id of the bid entity. Note, this will eventual be converted to simply "id".
     * @param {string} dependencyContract.field - The bid entity property that holds the needed value.
     * @returns {BidEntity} Returns the bid entity requested determined by the dependency contract.
     */
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

    /**
     * Gets the value of a bid entity by a dependency contract.
     *
     * @param {object} dependencyContract
     * @param {string} dependencyContract.type - The type of bid entity, ie: line_item, metric, field, component, compnent_group, assembly, etc
     * @param {string} dependencyContract.bid_entity_id - The id of the bid entity. Note, this will eventual be converted to simply "id".
     * @param {string} dependencyContract.field - The bid entity property that holds the needed value.
     * @returns {string|number|boolean} Returns the bid entity value.
     */
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
                    const field = _.camelCase(dependencyContract.field);
                    return !_.isNull(bidEntity[field]) ? Helpers.confirmNumber(bidEntity[field]) : 0;
                case "field":
                    if (!_.isNull(bidEntity.value)) {
                        return this.getFieldValue(bidEntity, dependencyContract.field);
                    } else return null;
                case "datatable":
                    //TODO: This needs a test. I didn't know a dep contract.field could be an object. -Sean
                    return bidEntity.getValue(dependencyContract.field.column, dependencyContract.field.row);
                case "metric":
                    return _.isNull(bidEntity.value) ? null : Helpers.confirmNumber(bidEntity.value);
                case "bid":
                    return _.isNull(bidEntity[dependencyContract.field])
                        ? 0
                        : Helpers.confirmNumber(bidEntity[dependencyContract.field]);
                default:
                    return null;
            }
        } else return null;
    }

    /**
     * Checks if the dependency used an undefined dependency value when evaluating
     * (dependencies may evaluate to a number even if they rely on an undefined value somewhere in the calc)
     *
     * @param {object} dependencyContract
     * @return {boolean} If the dependency is fully defined / not relient on any unefined dependencies
     */
    isDependencyFullyDefined(dependencyContract) {
        const dependency = this.getDependency(dependencyContract);
        if (dependency) {
            const hasAnyNullDependencies = dependency.hasNullDependency(dependencyContract.field);
            if (!hasAnyNullDependencies) {
                return true;
            }
        }
        return false;
    }

    getFieldValue(field, dataColumnId) {
        if (!_.isUndefined(field) && !_.isNull(field.value)) {
            if (field.config.type === "list") {
                let datatable = this.getBidEntity("datatable", field.config.dependencies.datatable.bid_entity_id);
                return datatable.getValue(dataColumnId, field.value);
            } else return field.value;
        } else return null;
    }

    /**
     * Get bid entities (field or metric) by a definition id
     *
     * @param {string} type The type of bid entity ('metric'|'field')
     * @param {number} defId The definition id to lookup by
     * @return {BidEntity[]} list of bid entities with the given def id
     */
    getBidEntitiesByDefId(type, defId) {
        if (type === "metric" || type === "field") {
            return _.filter(this.getBidEntity(type), { definitionId: defId });
        }
    }

    /**
     * Gets all the dependants for a bid bid entity.
     *
     * @param {string} type The type of bid enity. IE. line_item, field, metric, component, etc.
     * @param {int} id The id of the bid entity.
     * @returns [BidEntity[]]
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

    /**
     * Gets a bid entity by type and id.
     *
     * @param {string} type
     * @param {(number|string)} id
     * @returns {BidEntity}
     */
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

    /**
     * Returns the full collection of bid entites by type. Returned is a keyed object by the bid entity id.
     *
     * @param {string} type
     * @returns {object}
     */
    getCollection(type) {
        if (type === "bid_variables") {
            return this.bid._data.variables;
        } else if (!_.isUndefined(this.bid._data[type])) {
            return this.bid._data[type];
        } else throw `Bid entity collection ${type} does not exist`;
    }

    /**
     * Gets a component by their core definition id. Note, this function will be removed once
     *
     * @param {number} defId
     * @returns {Component}
     */
    getComponentByDefId(defId) {
        if (_.isUndefined(this._componentsKeyedByDefinitionId)) {
            this._componentsKeyedByDefinitionId = _.keyBy(this.bid.entities.components(), "definitionId");
        }
        return !_.isUndefined(this._componentsKeyedByDefinitionId[defId])
            ? this._componentsKeyedByDefinitionId[defId]
            : null;
    }

    /**
     * Determines if dependency exists basd on the dependency contract.
     *
     * @param {object} dependencyContract
     * @param {string} dependencyContract.type
     * @param {string} dependencyContract.bid_entity_id
     * @param {string} dependencyContract.field
     * @returns {boolean}
     */
    dependencyExists(dependencyContract) {
        var dependency = null;
        try {
            dependency = this.getDependency(dependencyContract);
        } catch (e) {
            console.log(e);
        }

        return !_.isUndefined(dependency) && !_.isNull(dependency);
    }

    /**
     * Determines if bid entity exists based on type and id.
     *
     * @param {string} type
     * @param {(number|string)} id
     * @returns {boolean}
     */
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
     * @param {boolean} [exactMatch=false] By default, the search will match any title that contains the search term. If this flag is set to true, the title search will perform a case-insensitive exact match
     * @returns {BidEntity[]}
     */
    searchByTitle(type, query, exactMatch=false) {
        const typeKey = type === "assembly" ? "assemblies" : type + "s";
        let collection = this.getCollection(typeKey);
        return _.filter(collection, item => {
            if (exactMatch) {
                return item.title.toLowerCase() === query.trim().toLowerCase();
            }
            return item.title.toLowerCase().indexOf(query.trim().toLowerCase()) >= 0;
        });
    }
}
