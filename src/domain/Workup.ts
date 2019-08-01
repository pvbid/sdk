import { Workup as WorkupType, WorkupItem, WorkupItemPerQuantityOption } from "@/types";
import Bid from "./Bid";
import WorkupService from "./services/WorkupService";

export default class Workup {
  private _workup: WorkupType;
  private _bid: Bid;
  private _cached: any;

  constructor(bid: Bid, workup?: WorkupType) {
    this._workup = workup || WorkupService.generateWorkup();
    this._bid = bid;
    this._cached = { key: null as Number };
  }

  get value(): number | null {
    return this._workup.value || null;
  }

  get unit(): string {
    return this._workup.unit || "";
  }

  set unit(val: string) {
    this._workup.unit = val;
  }

  get reference_quantity(): number {
    return this._workup.reference_quantity || 0;
  }

  set reference_quantity(val: number) {
    if (this._workup.reference_quantity !== val) {
      this._workup.reference_quantity = val;
      this.evaluate();
    }
  }

  get field_id(): number | null {
    return this._workup.field_id || null;
  }

  set field_id(val: number) {
    if (this._workup.field_id === val || (!this._workup.field_id && !val)) {
      return;
    }
    this._workup.items = WorkupService.removeFieldReferences(this._workup.items);
    this._workup.field_id = val;
    this.evaluate();
  }

  get items(): WorkupItem[] {
    return this._workup.items || [];
  }

  get itemSum(): number {
    return WorkupService.sumItems(this.items, this.getField());
  }

  /**
   * Generate the valid options for a workup items per quantity.
   * Cache the options for performance
   */
  get perQuantityOptions(): WorkupItemPerQuantityOption[] {
    const field = this.getField();
    const shouldUseCache =
      this._cached.options && ((field && field.id === this._cached.key) || (!field && !this._cached.key));
    if (shouldUseCache) {
      return this._cached.options;
    }
    const options = field ? Object.values(WorkupService.getPerQuantityOptions(field)) : [];
    this._cached.options = options;
    this._cached.key = field ? field.id : null;
    return options;
  }

  /**
   * Get the formatted workup string
   *
   * @param isLabor whether or not the workup is labor (hours) vs $
   */
  toString(isLabor = false): string {
    return WorkupService.getFormattedValue(this._workup, isLabor);
  }

  /**
   * Get the current workup object
   */
  getWorkup() {
    return this._workup;
  }

  getField() {
    return WorkupService.getDependency(this._workup, this._bid);
  }

  /**
   * Recalculates and sets the workup value
   */
  evaluate() {
    this._workup.value = WorkupService.evaluateWorkup(this._workup, this._bid);
  }

  /**
   * Evaluate the given item
   *
   * @param item
   */
  evaluateItem(item: WorkupItem) {
    return WorkupService.evaluateItem(item, this.getField());
  }

  /**
   * Get the per quantity value for the item
   *
   * @param item
   */
  getItemPerQuantityString(item: WorkupItem): string {
    return WorkupService.getItemPerQuantityString(item, this.getField());
  }

  /**
   * Adds a new item to the workup
   */
  addItem() {
    if (!this._workup.items) {
      this._workup.items = [];
    }
    this._workup.items.push(WorkupService.generateWorkupItem());
  }

  /**
   * Removes the given item from the workup
   *
   * @param item
   */
  deleteItem(item: WorkupItem) {
    this._workup.items = this._workup.items.filter(i => i !== item);
    this.evaluate();
  }
}
