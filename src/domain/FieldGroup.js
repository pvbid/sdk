import { cloneDeep, isEqual } from "lodash";
import BidEntity from "./BidEntity";
import { setAssembly, getAssembly } from "./services/BidEntityAssemblyService";

/**
 * Field Group Class
 */
export default class FieldGroup extends BidEntity {
  /**
   * Creates an instance of FieldGroup.
   * @param {object} fieldGroupData
   * @param {Bid} bid
   */
  constructor(fieldGroupData, bid) {
    super();
    /**
     * Reference to the bid that the field group belongs to.
     * @type {Bid}
     */
    this.bid = bid;
    this._original = cloneDeep(fieldGroupData);
    this._data = fieldGroupData;
  }

  /**
   * Holds the Field Group configuration information.
   * @type {object}
   */
  get config() {
    return this._data.config;
  }

  /**
   * Retrieve the fields belonging to the group keyed by reference
   *
   * @return {object}
   */
  getFields() {
    const fields = {};
    this.config.fields.forEach(fieldRef => {
      fields[fieldRef] = this.bid.entities.fields(fieldRef);
    });
    return fields;
  }

  /*
   * Get the field group's assembly if it has one
   *
   * @return {Assembly|undefined}
   */
  getAssembly() {
    return getAssembly(this);
  }

  /**
   * Adds the field group to an assembly.
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
   * Removes any assembly reference from the field group.
   *
   * @return {void}
   */
  unsetAssembly() {
    setAssembly(this, null);
    this.dirty();
  }

  /**
   * Determines if the field group is changed for it's original data.
   *
   * @returns {boolean}
   */
  isDirty() {
    return this._is_dirty || !isEqual(this._data.config, this._original.config);
  }

  /**
   * Flags the field group and corresponding bid as dirty and to be saved.
   */
  dirty() {
    this.bid.dirty();
    super.dirty();
  }
}
