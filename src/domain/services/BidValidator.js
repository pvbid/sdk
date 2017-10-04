import _ from "lodash";
import BidEntity from "../BidEntity";
import Helpers from "../../utils/Helpers";

/**
 * Validates a bid structure and dependencies.
 * 
 * @class BidValidator
 */
export default class BidValidator {
    /**
     * Creates an instance of BidValidator.
     */
    constructor() {
        this._bid = null;
        this._testResults = [];
    }

    /**
     * Validates a bid return an array of issues, if any exists.
     * 
     * @param {Bid} bid 
     * @returns {object[]} Returns an array of validation errors.
     */
    validate(bid) {
        this._bid = bid;
        this._testResults = [];
        try {
            this._testAll();
        } catch (err) {
            console.log(err);
        }

        console.log("Bid Validation", this._testResults);
        return this._testResults;
    }

    _baseEntityTest(bidEntity) {
        if (!_.isUndefined(bidEntity.config.dependencies)) {
            _.each(bidEntity.config.dependencies, (dependencyContract, key) => {
                if (!_.isEmpty(dependencyContract) && !_.isNull(dependencyContract.type)) {
                    this._testDependencyExistance(bidEntity, dependencyContract, key);
                    this._testDatatableKey(bidEntity, dependencyContract, key);
                    this._testEmptyField(bidEntity, dependencyContract, key);
                    this._testLineItemDatatableLink(bidEntity, dependencyContract, key);
                    this._testDependencyAssemblySafeGuard(bidEntity, dependencyContract, key);
                }
            });

            this._testAssemblyExistance(bidEntity);
        }
    }

    _runLineItemTests() {
        _.each(this._bid.entities.lineItems(), lineItem => {
            try {
                this._baseEntityTest(lineItem);
                this._testLineItemScalarFormulaReferences(lineItem);
                _.each(lineItem.config.rules, rule => {
                    this._testLineItemRuleCompleteness(lineItem, rule);

                    if (rule.type === "value_expression") {
                        this._testLineItemRuleFormula(lineItem, rule);
                    }
                    if (rule.type === "list_field") {
                        this._testLineItemRuleListField(lineItem, rule);
                    }

                    if (!_.isUndefined(rule.dependencies)) {
                        _.each(rule.dependencies, (dependencyContract, ruleKey) => {
                            this._testUnconvertedRuleDefinitionId(lineItem, dependencyContract, ruleKey, rule);
                            if (!_.isEmpty(dependencyContract) && !_.isNull(dependencyContract.type)) {
                                this._testDependencyExistance(lineItem, dependencyContract, ruleKey);
                                this._testDependencyAssemblySafeGuard(lineItem, dependencyContract, ruleKey);
                                this._testEmptyField(lineItem, dependencyContract, ruleKey);
                            }
                        });
                    }
                });
            } catch (err) {
                this._logIssue("unknown_error", lineItem, null, err);
            }
        });
    }

    _runFieldTests() {
        _.each(this._bid.entities.fields(), field => {
            try {
                this._baseEntityTest(field);
                this._testIsFieldAssignedToGroup(field);
            } catch (err) {
                this._logIssue("unknown_error", field, null, err);
            }
        });
    }

    _runFieldGroupTests() {
        _.each(this._bid.entities.fieldGroups(), fieldGroup => {
            try {
                this._baseEntityTest(fieldGroup);
                this._testFieldGroupReferences(fieldGroup);
            } catch (err) {
                this._logIssue("unknown_error", fieldGroup, null, err);
            }
        });
    }

    _runMetricTests() {
        _.each(this._bid.entities.metrics(), metric => {
            try {
                this._baseEntityTest(metric);
                this._testMetricFormulaReferences(metric);
                this._testMetricManipulations(metric);
            } catch (err) {
                this._logIssue("unknown_error", metric, null, err);
            }
        });
    }

    _runComponentTests() {
        _.each(this._bid.entities.components(), component => {
            try {
                this._baseEntityTest(component);
                this._testComponentReferences(component);
            } catch (err) {
                this._logIssue("unknown_error", component, null, err);
            }
        });
    }

    _runAssemblyTest() {
        _.each(this._bid.entities.assemblies(), assembly => {
            try {
                _.each(assembly.config.line_items, id => {
                    var entity = this._bid.entities.lineItems(id);
                    if (_.isUndefined(entity) || _.isNull(entity)) {
                        this._logIssue("invalid_assembly_entity_reference", assembly, null, {
                            dependency_type: "line_item",
                            dependency_id: id
                        });
                    }
                });

                _.each(assembly.config.components, id => {
                    var entity = this._bid.entities.components(id);
                    if (_.isUndefined(entity) || _.isNull(entity)) {
                        this._logIssue("invalid_assembly_entity_reference", assembly, null, {
                            dependency_type: "component",
                            dependency_id: id
                        });
                    }
                });

                _.each(assembly.config.metrics, id => {
                    var entity = this._bid.entities.metrics(id);
                    if (_.isUndefined(entity) || _.isNull(entity)) {
                        this._logIssue("invalid_assembly_entity_reference", assembly, null, {
                            dependency_type: "metric",
                            dependency_id: id
                        });
                    }
                });

                _.each(assembly.config.fields, id => {
                    var entity = this._bid.entities.fields(id);
                    if (_.isUndefined(entity) || _.isNull(entity)) {
                        this._logIssue("invalid_assembly_entity_reference", assembly, null, {
                            dependency_type: "field",
                            dependency_id: id
                        });
                    }
                });

                _.each(assembly.config.field_groups, id => {
                    var entity = this._bid.entities.fieldGroups(id);
                    if (_.isUndefined(entity) || _.isNull(entity)) {
                        this._logIssue("invalid_assembly_entity_reference", assembly, null, {
                            dependency_type: "field_group",
                            dependency_id: id
                        });
                    }
                });
                _.each(assembly.config.manipulated_metrics, id => {
                    var entity = this._bid.entities.metrics(id);
                    if (_.isUndefined(entity) || _.isNull(entity)) {
                        this._logIssue("invalid_assembly_entity_reference", assembly, null, {
                            dependency_type: "manipulated_metric",
                            dependency_id: id
                        });
                    }
                });
            } catch (err) {
                this._logIssue("unknown_error", assembly, null, err);
            }
        });
    }

    _testAll() {
        this._runLineItemTests();
        this._runFieldTests();
        this._runFieldGroupTests();
        this._runMetricTests();
        this._runComponentTests();
        this._runAssemblyTest();
    }

    _testIsFieldAssignedToGroup(sourceBidEntity) {
        var isIncluded = false;
        _.each(this._bid.entities.fieldGroups(), fieldGroup => {
            if (!isIncluded) {
                isIncluded = _.includes(fieldGroup.config.fields, sourceBidEntity.id);
            } else return false;
        });

        if (!isIncluded) {
            this._logIssue("unassigned_field", sourceBidEntity);
        }
    }

    _testMetricFormulaReferences(sourceBidEntity) {
        var params = {};
        _.each(sourceBidEntity.config.dependencies, (value, key) => {
            params[key] = 1;
        });
        if (!Helpers.validateFormula(sourceBidEntity.config.formula, params)) {
            this._logIssue("invalid_metric_formula_dependency", sourceBidEntity, null, {
                formula: sourceBidEntity.config.formula,
                formula_dependencies: sourceBidEntity.config.dependencies
            });
        }
    }

    _testMetricManipulations(sourceBidEntity) {
        _.each(sourceBidEntity.config.manipulations, metricManipulation => {
            //First test to ensure metric manipultion has a valid assembly.

            if (metricManipulation.assembly_id) {
                let metricManipulationAssembly = this._bid.entities.assemblies(metricManipulation.assembly_id);

                if (!metricManipulationAssembly) {
                    this._logIssue("invalid_metric_manipulation_assembly_reference", sourceBidEntity, null, {
                        metric_manipulation: metricManipulation
                    });
                }
            }

            //Test metric manipulation dependencies.
            let params = {
                original: 1
            };
            _.each(metricManipulation.dependencies, (value, key) => {
                params[key] = 1;
                if (!this._bid.entities.dependencyExists(value)) {
                    this._logIssue("invalid_metric_manipulation_dependency", sourceBidEntity, value, {
                        source_bid_entity_dependency_key: key
                    });
                }
            });
            if (!Helpers.validateFormula(metricManipulation.formula, params)) {
                var metric = this._bid.entities.metrics(metricManipulation.id);

                this._logIssue("invalid_metric_manipulation_formula_dependency", sourceBidEntity, null, {
                    manipulation_metric_title: metric.title,
                    manipulation_metric_id: metric.id,
                    formula: metricManipulation.formula,
                    formula_dependencies: metricManipulation.dependencies
                });
            }
        });
    }

    _testLineItemRuleCompleteness(sourceBidEntity, rule) {
        var isIncomplete = false;

        if (rule.type === "value_expression") {
            isIncomplete =
                _.isUndefined(rule.expression) ||
                _.isNull(rule.expression) ||
                rule.expression.length == 0 ||
                _.isUndefined(rule.dependencies) ||
                _.isUndefined(rule.activate_on) ||
                rule.dependencies.length == 0;
        }

        if (rule.type === "toggle_field") {
            isIncomplete =
                _.isUndefined(rule.dependencies) ||
                _.isUndefined(rule.dependencies.toggle_field) ||
                _.isUndefined(rule.activate_on);

            if (!isIncomplete) {
                isIncomplete = !this._bid.entities.dependencyExists(rule.dependencies.toggle_field);
            }
        }

        if (rule.type === "list_field") {
        }

        if (isIncomplete) {
            this._logIssue("incomplete_line_item_rule", sourceBidEntity, null, {
                rule: rule
            });
        }
    }

    _testLineItemRuleFormula(sourceBidEntity, rule) {
        var params = {};

        _.each(rule.dependencies, (dependencyContract, key) => {
            params[key] = 1;
        });

        if (!Helpers.validateFormula(rule.expression, params)) {
            this._logIssue("invalid_line_item_rule_expression", sourceBidEntity, null, {
                expression: rule.expression,
                expression_dependencies: rule.dependencies,
                rule: rule
            });
        }
    }

    _testLineItemScalarFormulaReferences(sourceBidEntity) {
        var params = {};

        var scalarContracts = _.pickBy(sourceBidEntity.config.dependencies, (el, key) => {
            return key.indexOf("scalar_") === 0;
        });

        _.each(scalarContracts, (dependencyContract, key) => {
            params[key.charAt(7)] = 1;
        });

        //Due to upgrading to multi reference scalars, the original scalar is simply x.
        if (this._bid.entities.dependencyExists(sourceBidEntity.config.dependencies.scalar)) {
            scalarContracts.x = sourceBidEntity.config.dependencies.scalar;
            params.x = 1;
        }

        if (!Helpers.validateFormula(sourceBidEntity.config.formula, params)) {
            this._logIssue("invalid_line_item_formula_dependency", sourceBidEntity, null, {
                formula: sourceBidEntity.config.formula,
                formula_dependencies: scalarContracts
            });
        }
    }

    _testLineItemRuleListField(sourceBidEntity, rule) {
        if (_.isUndefined(rule.dependencies)) {
            this._logIssue("rule_undefined_dependency", sourceBidEntity);
        }
    }

    _testDependencyExistance(sourceBidEntity, dependencyContract, dependencyKey) {
        if (dependencyContract.type !== "bid") {
            if (!this._bid.entities.dependencyExists(dependencyContract)) {
                this._logIssue("invalid_dependency", sourceBidEntity, dependencyContract, {
                    source_bid_entity_dependency_key: dependencyKey
                });
            }
        }
    }

    _testAssemblyExistance(sourceBidEntity) {
        if (!_.isUndefined(sourceBidEntity.config.assembly_id) && sourceBidEntity.config.assembly_id) {
            var assembly = this._bid.entities.bidEntityExists("assembly", sourceBidEntity.config.assembly_id);
            if (_.isUndefined(assembly) || _.isNull(assembly)) {
                this._logIssue("assembly_does_not_exist", sourceBidEntity);
            }
        }
    }

    _testUnconvertedRuleDefinitionId(lineItem, dependencyContract, dependencyKey, rule) {
        if (dependencyContract.definition_id) {
            this._logIssue("unconverted_rule_dependency_def_id", lineItem, dependencyContract, {
                source_bid_entity_dependency_key: dependencyKey,
                rule: rule,
                line_item: lineItem
            });
        }
    }

    _testDependencyAssemblySafeGuard(sourceBidEntity, dependencyContract, dependencyKey) {
        if (dependencyContract.type !== "bid" && dependencyContract.type !== "bid_variable") {
            var dependency = this._bid.entities.getDependency(dependencyContract);

            if (dependency) {
                if (dependency.config.assembly_id) {
                    var sourceAssemblyId =
                        sourceBidEntity.type === "assembly"
                            ? sourceBidEntity.id
                            : _.isUndefined(sourceBidEntity.config.assembly_id)
                              ? null
                              : sourceBidEntity.config.assembly_id;

                    if (dependency.config.assembly_id !== sourceAssemblyId) {
                        this._logIssue("invalid_assembly_reference", sourceBidEntity, dependencyContract, {
                            source_bid_entity_dependency_key: dependencyKey
                        });
                    }
                }
            }
        }
    }

    _testComponentReferences(sourceBidEntity) {
        _.each(sourceBidEntity.config.line_items, lineItemId => {
            var bidLineItem = this._bid.entities.lineItems(lineItemId);

            if (_.isUndefined(bidLineItem) || _.isNull(bidLineItem)) {
                this._logIssue("invalid_component_line_item_reference", sourceBidEntity, {
                    type: "line_item",
                    bid_entity_id: lineItemId
                });
            }
        });

        _.each(sourceBidEntity.config.components, componentId => {
            var bidComponent = this._bid.entities.components(componentId);

            if (_.isUndefined(bidComponent) || _.isNull(bidComponent)) {
                this._logIssue("invalid_component_sub_component_reference", sourceBidEntity);
            }
        });

        if (sourceBidEntity.config.parent_component_id) {
            var parentComponent = this._bid.entities.components(sourceBidEntity.config.parent_component_id);

            if (_.isUndefined(parentComponent) || _.isNull(parentComponent)) {
                logIssue("invalid_parent_component_reference", sourceBidEntity);
            }
        }

        var componentGroup = this._bid.entities.componentGroups(sourceBidEntity.config.component_group_id);

        if (_.isUndefined(componentGroup) || _.isNull(componentGroup)) {
            logIssue("invalid_component_group_reference", sourceBidEntity);
        }
    }

    _testFieldGroupReferences(sourceBidEntity) {
        _.each(sourceBidEntity.config.fields, fieldId => {
            var bidField = this._bid.entities.fields(fieldId);

            if (_.isUndefined(bidField) || _.isNull(bidField)) {
                this._logIssue("invalid_field_group_reference", sourceBidEntity, null, { dependency_id: fieldId });
            }
        });
    }

    _testLineItemDatatableLink(sourceBidEntity, dependencyContract, dependencyKey) {
        if (sourceBidEntity.type === "line_item" && dependencyContract.type === "field") {
            var fieldDependency = this._bid.entities.getDependency(dependencyContract);

            if (!_.isUndefined(fieldDependency) && !_.isNull(fieldDependency)) {
                if (fieldDependency.config.type === "list") {
                    var datatable = this._bid.entities.getDependency(fieldDependency.config.dependencies.datatable);

                    var datatableColumnKeys = _.map(datatable.config.columns, c => {
                        return c.id;
                    });

                    if (!_.includes(datatableColumnKeys, dependencyContract.field)) {
                        this._logIssue("invalid_line_datatable_link", sourceBidEntity, dependencyContract, {
                            source_bid_entity_dependency_key: dependencyKey
                        });
                    }
                }
            }
        }
    }

    _testEmptyField(sourceBidEntity, dependencyContract, dependencyKey) {
        if (
            ["line_item", "metric", "bid_variable"].indexOf(sourceBidEntity.type) >= 0 &&
            (_.isNull(dependencyContract.field) || _.isEmpty(dependencyContract.field))
        ) {
            this._logIssue("empty_field", sourceBidEntity, dependencyContract, {
                source_bid_entity_dependency_key: dependencyKey
            });
        }
    }

    _testDatatableKey(sourceBidEntity, dependencyContract, dependencyKey) {
        if (sourceBidEntity.type === "line_item" && dependencyContract.type === "field") {
            var fieldDef = this._bid.entities.fields(dependencyContract.bid_entity_id);
            if (!_.isUndefined(fieldDef) && !_.isNull(fieldDef)) {
                if (fieldDef.config.type === "list") {
                    var datatableId = fieldDef.config.dependencies.datatable.bid_entity_id;

                    if (!this._isValidDatatableKey(datatableId, dependencyContract.field, true)) {
                        this._logIssue("invalid_datatable_key", sourceBidEntity, dependencyContract, {
                            source_bid_entity_dependency_key: dependencyKey
                        });
                    }
                }
            } else {
                this._logIssue("invalid_dependency", sourceBidEntity, dependencyContract, {
                    source_bid_entity_dependency_key: dependencyKey
                });
            }
        }
    }

    _isValidDatatableKey(datatableId, key, isColumn) {
        var datatable = this._bid.entities.datatables(datatableId);

        function getColumnKeys(datatable) {
            return _.map(datatable.config.columns, c => {
                return c.id;
            });
        }

        function getRowKeys(datatable) {
            return _.map(datatable.config.rows, r => {
                return r.id;
            });
        }

        if (datatable) {
            var datatableKeys = isColumn ? getColumnKeys(datatable) : getRowKeys(datatable);

            return _.includes(datatableKeys, key);
        } else return false;
    }

    _getAssemblyTitle(assemblyId) {
        const assembly = this._bid.entities.assemblies(assemblyId);
        return assembly ? assembly.title : null;
    }

    _logIssue(type, sourceBidEntity, dependencyContract, meta) {
        this._testResults.push({
            type: type,
            source_bid_entity_type: sourceBidEntity.type,
            source_bid_entity_id: sourceBidEntity.id,
            source_bid_entity_title: sourceBidEntity.title,
            source_bid_entity_assembly_id: sourceBidEntity.config.assembly_id
                ? sourceBidEntity.config.assembly_id
                : null,
            source_bid_entity_assembly_title: sourceBidEntity.config.assembly_id
                ? this._getAssemblyTitle(sourceBidEntity.config.assembly_id)
                : null,

            dependency_type: dependencyContract ? dependencyContract.type : null,
            dependency_id: dependencyContract ? dependencyContract.bid_entity_id : null,
            meta: meta ? meta : null
        });
    }
}
