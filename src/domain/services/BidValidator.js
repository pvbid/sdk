import _ from "lodash";
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
      if (!bid.isShell()) this._testAll();
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
          this._testDependencyExistence(bidEntity, dependencyContract, key);
          this._testDatatableKey(bidEntity, dependencyContract, key);
          this._testEmptyField(bidEntity, dependencyContract, key);
          this._testLineItemDatatableLink(bidEntity, dependencyContract, key);
          this._testDependencyAssemblySafeGuard(bidEntity, dependencyContract, key);
        }
      });

      this._testAssemblyExistence(bidEntity);
    }
  }

  _runLineItemTests() {
    _.each(this._bid.entities.lineItems(), lineItem => {
      try {
        this._baseEntityTest(lineItem);
        this._testLineItemScalarFormulaReferences(lineItem);
        this._testLineItemWorkup(lineItem);
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
                this._testDependencyExistence(lineItem, dependencyContract, ruleKey);
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
        if (field.config.type === "list") {
          this._testListFieldHasDatatable(field);
        }
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

  _runDynamicGroupTests() {
    _.each(this._bid.entities.dynamicGroups(), dynamicGroup => {
      try {
        this._testDynamicGroupReferences(dynamicGroup);
      } catch (err) {
        this._logIssue("unknown_error", dynamicGroup, null, err);
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
              dependency_id: id,
            });
          }
        });

        _.each(assembly.config.components, id => {
          var entity = this._bid.entities.components(id);
          if (_.isUndefined(entity) || _.isNull(entity)) {
            this._logIssue("invalid_assembly_entity_reference", assembly, null, {
              dependency_type: "component",
              dependency_id: id,
            });
          }
        });

        _.each(assembly.config.metrics, id => {
          var entity = this._bid.entities.metrics(id);
          if (_.isUndefined(entity) || _.isNull(entity)) {
            this._logIssue("invalid_assembly_entity_reference", assembly, null, {
              dependency_type: "metric",
              dependency_id: id,
            });
          }
        });

        _.each(assembly.config.fields, id => {
          var entity = this._bid.entities.fields(id);
          if (_.isUndefined(entity) || _.isNull(entity)) {
            this._logIssue("invalid_assembly_entity_reference", assembly, null, {
              dependency_type: "field",
              dependency_id: id,
            });
          }
        });

        _.each(assembly.config.field_groups, id => {
          var entity = this._bid.entities.fieldGroups(id);
          if (_.isUndefined(entity) || _.isNull(entity)) {
            this._logIssue("invalid_assembly_entity_reference", assembly, null, {
              dependency_type: "field_group",
              dependency_id: id,
            });
          }
        });
        _.each(assembly.config.manipulated_metrics, id => {
          var entity = this._bid.entities.metrics(id);
          if (_.isUndefined(entity) || _.isNull(entity)) {
            this._logIssue("invalid_assembly_entity_reference", assembly, null, {
              dependency_type: "manipulated_metric",
              dependency_id: id,
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
    this._runDynamicGroupTests();
    this._runAssemblyTest();
    this._testForLiDupesInComponentGroups();
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

  _testListFieldHasDatatable(sourceBidEntity) {
    const {
      type,
      dependencies: { datatable },
    } = sourceBidEntity.config;
    if (type === "list" && !(datatable && datatable.bid_entity_id)) {
      this._logIssue("list_field_missing_datatable_dependency", sourceBidEntity, datatable, {
        source_bid_entity_dependency_key: "datatable",
      });
    }
  }

  _testMetricFormulaReferences(sourceBidEntity) {
    var params = {};
    _.each(sourceBidEntity.config.dependencies, (value, key) => {
      if (!_.isEmpty(value) && !_.isNull(value.type)) {
        params[key] = 1;
      }
    });
    if (!Helpers.validateFormula(sourceBidEntity.config.formula, params)) {
      this._logIssue("invalid_metric_formula_dependency", sourceBidEntity, null, {
        formula: sourceBidEntity.config.formula,
        formula_dependencies: sourceBidEntity.config.dependencies,
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
            metric_manipulation: metricManipulation,
          });
        }
      }

      //Test metric manipulation dependencies.
      let params = {
        original: 1,
      };
      _.each(metricManipulation.dependencies, (value, key) => {
        params[key] = 1;
        if (!this._bid.entities.dependencyExists(value)) {
          this._logIssue("invalid_metric_manipulation_dependency", sourceBidEntity, value, {
            source_bid_entity_dependency_key: key,
          });
        }
      });
      if (!Helpers.validateFormula(metricManipulation.formula, params)) {
        var metric = this._bid.entities.metrics(metricManipulation.id);

        this._logIssue("invalid_metric_manipulation_formula_dependency", sourceBidEntity, null, {
          manipulation_metric_title: metric.title,
          manipulation_metric_id: metric.id,
          formula: metricManipulation.formula,
          formula_dependencies: metricManipulation.dependencies,
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
      isIncomplete =
        _.isUndefined(rule.dependencies) ||
        _.isUndefined(rule.dependencies.list_field) ||
        _.isUndefined(rule.list_options) ||
        _.isUndefined(rule.activate_on);

      if (!isIncomplete) {
        let field = this._bid.entities.getDependency(rule.dependencies.list_field);
        if (field) {
          let dt = field.getDatatable();

          if (dt) {
            let dtRowIds = dt.getOptions().map(item => item.row_id);
            _.each(rule.list_options, optionId => {
              if (dtRowIds.indexOf(optionId) < 0) {
                this._logIssue("non_existent_dt_rows_line_item_rule", sourceBidEntity, null, {
                  rule: rule,
                });
                return false;
              }
            });
          } else isIncomplete = true;
        } else isIncomplete = true;
      }
    }

    if (isIncomplete) {
      this._logIssue("incomplete_line_item_rule", sourceBidEntity, null, {
        rule: rule,
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
        rule: rule,
      });
    }
  }

  _testLineItemScalarFormulaReferences(sourceBidEntity) {
    var params = { workup: 1 };

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
        formula_dependencies: scalarContracts,
      });
    }
  }

  _testLineItemWorkup(sourceBidEntity) {
    const hasFieldDependency =
      sourceBidEntity.config.workups &&
      sourceBidEntity.config.workups[0] &&
      sourceBidEntity.config.workups[0].field_id;
    if (hasFieldDependency) {
      const contract = { type: "field", bid_entity_id: sourceBidEntity.config.workups[0].field_id };
      this._testDependencyExistence(sourceBidEntity, contract, "WORKUP");
      this._testLineItemWorkupFieldType(sourceBidEntity, sourceBidEntity.config.workups[0].field_id);
      this._testDependencyAssemblySafeGuard(sourceBidEntity, contract, "WORKUP");

      // test each workup item has valid reference datatable column
      if (sourceBidEntity.config.workups[0].items && sourceBidEntity.config.workups[0].items.length) {
        sourceBidEntity.config.workups[0].items.forEach((item, i) => {
          if (item.per_quantity_ref) {
            const itemContract = { ...contract, field: item.per_quantity_ref };
            const itemKey = `WORKUP (${item.title || i})`;
            this._testLineItemDatatableLink(sourceBidEntity, itemContract, itemKey);
          }
        });
      }
    }
  }

  _testLineItemWorkupFieldType(sourceBidEntity, fieldId) {
    const field = this._bid.entities.fields(fieldId);
    if (field) {
      if (field.fieldType !== "list") {
        this._logIssue(
          "workup_field_wrong_type",
          sourceBidEntity,
          { type: "field", bid_entity_id: fieldId },
          { field_type: field.fieldType }
        );
      }
    }
  }

  _testLineItemRuleListField(sourceBidEntity, rule) {
    if (_.isUndefined(rule.dependencies)) {
      this._logIssue("rule_undefined_dependency", sourceBidEntity);
    }
  }

  /**
   * Test Line Items are not used more than once within a Component Group
   */
  _testForLiDupesInComponentGroups() {
    const dupeMap = Object.values(this._bid.entities.components()).reduce((o, c) => {
      if (_.isUndefined(c.config.line_items)) {
        return o;
      }

      // initialize cg prop
      o[c.config.component_group_id] = o[c.config.component_group_id] || {};

      // a one-to-many map of LI IDs to Component IDs in which they are found
      c.config.line_items.forEach(liId => {
        o[c.config.component_group_id][liId] = [...(o[c.config.component_group_id][liId] || []), c.id];
      });

      return o;
    }, {});

    Object.keys(dupeMap).forEach(cgId => {
      const liData = dupeMap[cgId];

      Object.keys(liData).forEach(liId => {
        const cIds = liData[liId];

        if (cIds.length > 1) {
          this._logIssue(
            "component_group_contains_dupes",
            this._bid.entities.componentGroups(cgId),
            {},
            {
              details: {
                liId,
                liTitle: this._bid.entities.lineItems(liId).title,
                components: cIds.map(cId => this._bid.entities.components(cId)),
              },
            }
          );
        }
      });
    });
  }

  _testDependencyExistence(sourceBidEntity, dependencyContract, dependencyKey) {
    if (dependencyContract.type !== "bid") {
      if (!this._bid.entities.dependencyExists(dependencyContract)) {
        this._logIssue("invalid_dependency", sourceBidEntity, dependencyContract, {
          source_bid_entity_dependency_key: dependencyKey,
        });
      }
    }
  }

  _testAssemblyExistence(sourceBidEntity) {
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
        line_item: lineItem,
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
              source_bid_entity_dependency_key: dependencyKey,
            });
          }
        }
      }
    }
  }

  _testReferencedLineItemExists(lineItemId, sourceBidEntity) {
    const bidLineItem = this._bid.entities.lineItems(lineItemId);

    if (bidLineItem === undefined || bidLineItem === null) {
      this._logIssue(`invalid_${sourceBidEntity.type}_line_item_reference`, sourceBidEntity, {
        type: "line_item",
        bid_entity_id: lineItemId,
      });
    }
  }

  _testReferencedComponentExists(componentId, sourceBidEntity, errorType) {
    const bidComponent = this._bid.entities.components(componentId);

    if (bidComponent === undefined || bidComponent === null) {
      this._logIssue(errorType, sourceBidEntity, {
        type: "component",
        bid_entity_id: componentId,
      });
    }
  }

  _testReferencedDynamicGroupExists(groupId, sourceBidEntity) {
    const bidDynamicGroup = this._bid.entities.dynamicGroups(groupId);

    if (bidDynamicGroup === undefined || bidDynamicGroup === null) {
      this._logIssue(`invalid_${sourceBidEntity.type}_dynamic_group_reference`, sourceBidEntity, {
        type: "dynamic_group",
        bid_entity_id: groupId,
      });
    }
  }

  _testComponentReferences(sourceBidEntity) {
    const { line_items, components, parent_component_id, component_group_id } = sourceBidEntity.config;

    line_items.forEach(lineItemId => {
      this._testReferencedLineItemExists(lineItemId, sourceBidEntity);
    });

    components.forEach(componentId => {
      this._testReferencedComponentExists(
        componentId,
        sourceBidEntity,
        "invalid_component_sub_component_reference"
      );
    });

    if (parent_component_id) {
      this._testReferencedComponentExists(
        parent_component_id,
        sourceBidEntity,
        "invalid_parent_component_reference"
      );
    }

    const componentGroup = this._bid.entities.componentGroups(component_group_id);

    if (componentGroup === undefined || componentGroup === null) {
      this._logIssue("invalid_component_group_reference", sourceBidEntity);
    }
  }

  _testDynamicGroupReferences(sourceBidEntity) {
    sourceBidEntity.lineItems.forEach(lineItemId => {
      this._testReferencedLineItemExists(lineItemId, sourceBidEntity);
    });

    sourceBidEntity.components.forEach(componentId => {
      this._testReferencedComponentExists(
        componentId,
        sourceBidEntity,
        "invalid_dynamic_group_sub_component_reference"
      );
    });

    sourceBidEntity.dynamicGroups.forEach(groupId => {
      this._testReferencedDynamicGroupExists(groupId, sourceBidEntity);
    });

    if (sourceBidEntity.fromComponent) {
      this._testReferencedComponentExists(
        sourceBidEntity.fromComponent,
        sourceBidEntity,
        "invalid_dynamic_group_source_component_reference"
      );
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
    if (["line_item", "metric"].includes(sourceBidEntity.type) && dependencyContract.type === "field") {
      var fieldDependency = this._bid.entities.getDependency(dependencyContract);

      if (!_.isUndefined(fieldDependency) && !_.isNull(fieldDependency)) {
        if (
          fieldDependency.config.type === "list" &&
          fieldDependency.config.dependencies.datatable.bid_entity_id
        ) {
          var datatable = this._bid.entities.getDependency(fieldDependency.config.dependencies.datatable);

          var datatableColumnKeys = _.map(datatable.columns, c => {
            return c.id;
          });

          if (!_.includes(datatableColumnKeys, dependencyContract.field)) {
            this._logIssue("invalid_line_datatable_link", sourceBidEntity, dependencyContract, {
              source_bid_entity_dependency_key: dependencyKey,
            });
          }
        }
      }
    }
  }

  _testEmptyField(sourceBidEntity, dependencyContract, dependencyKey) {
    if (
      ["line_item", "metric", "bid_variable", "field"].indexOf(sourceBidEntity.type) >= 0 &&
      (_.isNull(dependencyContract.field) || _.isEmpty(dependencyContract.field)) &&
      !(sourceBidEntity.type === "field" && dependencyContract.type === "datatable")
    ) {
      this._logIssue("empty_field", sourceBidEntity, dependencyContract, {
        source_bid_entity_dependency_key: dependencyKey,
      });
    }
  }

  _testDatatableKey(sourceBidEntity, dependencyContract, dependencyKey) {
    if (["line_item", "metric"].includes(sourceBidEntity.type) && dependencyContract.type === "field") {
      var fieldDef = this._bid.entities.fields(dependencyContract.bid_entity_id);
      if (!_.isUndefined(fieldDef) && !_.isNull(fieldDef)) {
        if (fieldDef.config.type === "list") {
          var datatableId = fieldDef.config.dependencies.datatable.bid_entity_id;

          if (!this._isValidDatatableKey(datatableId, dependencyContract.field, true)) {
            this._logIssue("invalid_datatable_key", sourceBidEntity, dependencyContract, {
              source_bid_entity_dependency_key: dependencyKey,
            });
          }
        }
      } else {
        this._logIssue("invalid_dependency", sourceBidEntity, dependencyContract, {
          source_bid_entity_dependency_key: dependencyKey,
        });
      }
    }
  }

  _isValidDatatableKey(datatableId, key, isColumn) {
    var datatable = this._bid.entities.datatables(datatableId);

    function getColumnKeys(datatable) {
      return _.map(datatable.columns, c => {
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
      source_bid_entity_assembly_id:
        sourceBidEntity.config && sourceBidEntity.config.assembly_id
          ? sourceBidEntity.config.assembly_id
          : null,
      source_bid_entity_assembly_title:
        sourceBidEntity.config && sourceBidEntity.config.assembly_id
          ? this._getAssemblyTitle(sourceBidEntity.config.assembly_id)
          : null,

      dependency_type: dependencyContract ? dependencyContract.type : null,
      dependency_id: dependencyContract ? dependencyContract.bid_entity_id : null,
      meta: meta ? meta : null,
    });
  }
}
