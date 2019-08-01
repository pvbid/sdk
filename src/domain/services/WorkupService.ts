import Bid from "../Bid";
import { Workup, WorkupItem, WorkupItemPerQuantityValueMap, WorkupItemPerQuantityOption } from "@/types";
import Field from "../Field";
import Helpers from "@/utils/Helpers";
import BaseWorkupService from "./BaseWorkupService";

export default class WorkupService extends BaseWorkupService {
  /**
   * Determine the current value of the given workup
   *
   * @param workup
   * @param [bid]
   * @return The evaluated workup value
   */
  public static evaluateWorkup(workup: Workup, bid?: Bid): number | null {
    if (!this._canEvaluateWorkup(workup)) return null;

    const { reference_quantity, items } = workup;
    const field = bid ? this.getDependency(workup, bid) : null;

    return this.sumItems(items, field) / reference_quantity;
  }

  /**
   * Determine the sum of the workup items
   *
   * @param items The workup items to total
   * @param [field] The field dependency bound to the workup if there is one
   * @return the sum of all the workup item totals
   */
  public static sumItems(items: WorkupItem[], field?: Field): number {
    return items.reduce((sum, item) => sum + this.evaluateItem(item, field), 0);
  }

  /**
   * Determine the total value of the workup item
   *
   * @param item workup item to evaluate
   * @param [field] the field dependency attached to the workup if there is one
   * @return the evaluated total of the workup item
   */
  public static evaluateItem(item: WorkupItem, field?: Field): number {
    return (
      Helpers.confirmNumber(item.quantity) * Helpers.confirmNumber(this._getPerQuantityValue(item, field))
    );
  }

  /**
   * Get the options for the workup items per quantity values based on the field dependency
   *
   * @param field The workup's field dependency
   * @return per_quantity options keyed by per_quantity_ref value
   */
  public static getPerQuantityOptions(
    field: Field
  ): { [per_quantity_ref: string]: WorkupItemPerQuantityOption } {
    const options: { [per_quantity_ref: string]: WorkupItemPerQuantityOption } = {};
    const dt = field.getDatatable();
    if (!dt) return options;
    dt.columns.forEach((col: WorkupItemPerQuantityOption) => {
      if (col.id !== "pvbid_inventory_item_id") {
        options[col.id] = { title: col.title, id: col.id, is_key: col.is_key };
      }
    });
    return options;
  }

  /**
   * Determine the current perQuantity value for the given item
   *
   * @param item
   * @param [field] the field dependency for the workup if there is one
   * @return the current per quantity value for the item
   */
  private static _getPerQuantityValue(
    item: WorkupItem,
    field?: Field
  ): string | number | boolean | undefined {
    return field && item.per_quantity_ref
      ? field.getSelectedOptionValue(item.per_quantity_ref)
      : item.per_quantity;
  }

  /**
   * Generates a string representation of an item's perQuantity
   *
   * @param item
   * @param field
   * @return item.perQuantity as a string
   */
  public static getItemPerQuantityString(item: WorkupItem, field?: Field): string {
    const perQty = this._getPerQuantityValue(item, field);
    if (!item.per_quantity_ref || (perQty !== "" && perQty !== undefined && perQty !== null)) {
      return Helpers.confirmNumber(perQty).toString(10);
    } else {
      return this.getPerQuantityOptions(field)[item.per_quantity_ref].title;
    }
  }

  /**
   * Retrieve the dependency related to the workup
   *
   * @param workup
   * @param bid
   * @return The workup's field dependency (if it has one)
   */
  public static getDependency(workup: Workup, bid: Bid): Field | null {
    return workup.field_id ? bid.entities.fields(workup.field_id) || null : null;
  }

  /**
   * Determine if the given workup depends on an undefined value
   *
   * @param workup
   * @param bid
   */
  public static hasNullDependency(workup: Workup, bid: Bid): boolean {
    if (!this._canEvaluateWorkup(workup)) return false;

    const field = this.getDependency(workup, bid);
    if (!field) return false;

    return workup.items.some(({ per_quantity_ref: ref }) => {
      if (!ref) return false;
      if (
        field.value === null ||
        field.value === undefined ||
        field.value === "" ||
        field.hasNullDependency()
      )
        return true;
      const val = field.getSelectedOptionValue(ref);
      return val === null || val === undefined || val === "";
    });
  }

  private static _canEvaluateWorkup(workup: Workup): boolean {
    if (!workup) return false;
    const { reference_quantity: refQty, items } = workup;
    return refQty && items && items.length && true;
  }
}
