import { cloneDeep, isNil, isUndefined, isEmpty, isEqual } from "lodash";
import BidEntity from "./BidEntity";
import { setAssembly, getAssembly } from "./services/BidEntityAssemblyService";
import FieldAutoPopulateService from "./services/FieldAutoPopulateService";

/**
 * Field Class
 */
export default class Field extends BidEntity {
  /**
   * Creates an instance of Field.
   * @param {object} fieldData
   * @param {Bid} bid
   */
  constructor(fieldData, bid) {
    super();
    /**
     * Reference to the bid that the field belongs to.
     * @type {Bid}
     */
    this.bid = bid;
    this._data = fieldData;
    this._original = cloneDeep(fieldData);
    this._autoPopulateService = new FieldAutoPopulateService(this);
  }

  /**
   * Gets value of the field.
   * If the field is of a list type, will return the associated datatable row id.
   *
   * @type {string|number|boolean}
   */
  get value() {
    let val = this._data.value;
    if (this.fieldType === "boolean") {
      if (val === null || val.length === 0) {
        val = this.config.default_value;
      }

      val = val == true || val == "1" || val == "true" ? true : false;
    } else if (this.fieldType === "number" && !isNil(val)) {
      val = +val; // cast to number
    }
    return val;
  }

  /**
   * Sets the field value. Marks field as dirty
   *
   * @emits {updated}
   * @type {string}
   */
  set value(val) {
    if (val !== this._data.value && !this.bid.isReadOnly()) {
      this.config.is_auto_selected = false;

      //Check if boolean and manipulate input value to conform to type.
      if (this.fieldType === "boolean") {
        if (val === null || val.length === 0) {
          val = this.config.default_value;
        }

        val = val == true || val == "1" || val == "true" ? true : false;
      }

      this._data.value = val;
      this._data.config.has_null_dependency = false;
      this.dirty();
      this.assess();
      this.emit("updated");
    }
  }

  /**
   * Returns the actual value of the field after the project has been completed and reviewed for reconciliation.
   * @type {string}
   */
  get actualValue() {
    return this._data.actual_value;
  }

  /**
   * Sets the actual value for reconciliation. Marks field as dirty.
   * @type {string}
   */
  set actualValue(val) {
    this._data.actual_value = val;
    this.dirty();
  }

  /**
   * Returns the anchor identifier of the field.
   * Anchors are a common global identifier that help identify similar fields across different assemblies.
   * They should be unique to their assembly.
   * Using anchors allow for greater automation potential.
   * @type {string|null}
   */
  get anchor() {
    return this._data.anchor || null;
  }

  /**
   * Gets the field type.
   * Options: text, boolean, number, list
   *
   * @type {string}
   */
  get fieldType() {
    return this._data.config.type;
  }

  /**
   * Gets the field's definition id.
   *
   * @deprecated Definition ids will become obsolete in planned data structure upgrade.
   * @type {number}
   */
  get definitionId() {
    return this._data.definition_id;
  }

  /**
   * Gets the configuration information for the bid entity.
   *
   * @type {object}
   */
  get config() {
    return this._data.config;
  }

  /**
   * Determines if the current value is the result of being auto populated due to the field's ruleset.
   *
   * @type {boolean}
   */
  get isAutoSelected() {
    return !isUndefined(this.config.is_auto_selected) && this.config.is_auto_selected;
  }

  /**
   * Assess the field, determining if it should be auto populated.
   *
   * @emits {assessing} Fires event before assessment.
   * @emits {assessed} Fires event after assessment.
   * @emits {updated} Fires event if the field has been changed during assessment.
   * @param {?BidEntity} dependency  - The calling dependency.
   */
  assess(dependency) {
    if (this.bid.isAssessable()) {
      this.emit("assessing");
      if (this._autoPopulateService.shouldAutoPopulate()) {
        this._autoPopulateService.autoPopulate();
      } else if (dependency && dependency.type === "datatable" && this.fieldType === "list") {
        this.emit("updated");
      }

      this.emit("assessed");
    }
  }

  /**
   * Binds the "updated" event for all dependant bid entities.
   */
  bind() {
    for (let dependencyContract of Object.values(this.config.dependencies)) {
      if (!isEmpty(dependencyContract)) {
        const dependency = this.bid.entities.getDependency(dependencyContract);
        if (dependency) {
          dependency.on("updated", `field.${this.id}`, (requesterId, self) => this.assess(self));
        }
      }
    }
  }

  /**
   * Get the field's assembly if it has one
   *
   * @return {Assembly|undefined}
   */
  getAssembly() {
    return getAssembly(this);
  }

  /**
   * Adds the field to an assembly.
   *
   * @param {Assembly|string} assembly The assembly entity or an assembly ref id
   * @return {Assembly} the new assembly setting
   */
  setAssembly(assembly) {
    if (!assembly) throw new Error("Assembly reference was not provided.");
    setAssembly(this, assembly);
    this.dirty();
    return this.getAssembly();
  }

  /**
   * Removes any assembly reference from the field.
   *
   * @return {void}
   */
  unsetAssembly() {
    setAssembly(this, null);
    this.dirty();
  }

  /**
   * Returns all the dependencies that the field relies on.
   *
   * @returns {BidEntity[]}
   */
  dependencies() {
    let contracts = Object.values(this.config.dependencies);
    let dependencies = [];

    contracts.forEach(ctrct => {
      const dependency = this.bid.entities.getDependency(ctrct);
      if (dependency) {
        dependencies.push(dependency);
      }
    });

    return dependencies;
  }

  /**
   * Gets all the bid entities that relay on the field instance.
   *
   * @returns {BidEntity[]}
   */
  dependants() {
    let d = this.bid.entities.getDependants("field", this.id);
    return d;
  }

  /**
   * If the field has a fieldType of "list", getDatatable will return the
   * datatable instance that it relies on, otherwise will return null.
   *
   * @returns  {?Datatable}
   */
  getDatatable() {
    if (this.fieldType === "list" && this.config.dependencies.datatable.bid_entity_id) {
      return this.bid.entities.datatables(this.config.dependencies.datatable.bid_entity_id);
    } else return null;
  }

  /**
   * Gets a list of options bound to a datatable.
   *
   * @returns {object[]}
   * @property {string} title
   * @property {string} row_id - The id of a datatable row. This value should to be applied to the {@link Field.value} to selelect specific row.
   */
  getListOptions() {
    const dt = this.getDatatable();
    return dt ? dt.getOptions() : [];
  }

  /**
   * Gets the selected list option.
   *
   * @returns {object}
   * @property {string} title
   * @property {string} row_id - The id of a datatable row.
   */
  getSelectedOption() {
    const datatable = this.getDatatable();
    if (datatable) {
      return datatable.getOptions().find(el => {
        return el.row_id === this.value;
      });
    } else return null;
  }

  /**
   * Gets the value of the selected field list based on the datatable column id.
   *
   * @param {string} datatableColumnId
   * @returns {?(string|number|boolean)}
   */
  getSelectedOptionValue(datatableColumnId) {
    const datatable = this.getDatatable();
    if (datatableColumnId && datatable) {
      return datatable.getValue(datatableColumnId, this.value);
    } else return null;
  }

  /**
   * Exports internal data.
   *
   * @param {boolean} [alwaysIncludeConfig=false] Will include config object in export regardless of changed status.
   * @returns {object}
   */
  exportData(alwaysIncludeConfig = false) {
    if (!alwaysIncludeConfig && isEqual(this._data.config, this._original.config)) {
      const { config, ...noConfig } = this._data;
      return cloneDeep(noConfig);
    }
    return cloneDeep(this._data);
  }

  /**
   * Determines if the field has any null or undefined dependencies
   */
  hasNullDependency() {
    return this.config.has_null_dependency || false;
  }

  /**
   * Determines if instance is dirty.
   *
   * @returns {boolean}
   */
  isDirty() {
    return this._is_dirty || !isEqual(this._data.config, this._original.config);
  }

  /**
   * Flags the field and corresponding bid as dirty and to be saved.
   */
  dirty() {
    this.bid.dirty();
    super.dirty();
  }
}
