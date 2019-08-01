import { isNil, round } from "lodash";
import { Workup, WorkupItem } from "@/types";

export default class BaseWorkupService {
  constructor() {}
  /**
   * Generate a line item workup
   *
   * @return A new workup instance
   */
  public static generateWorkup(): Workup {
    return {
      value: null,
      unit: "",
      reference_quantity: 0,
      items: [],
      field_id: null,
    };
  }

  /**
   * Get default empty workup item object
   *
   * @return A new workup item
   */
  public static generateWorkupItem(): WorkupItem {
    return {
      title: "",
      quantity: null,
      per_quantity: null,
      unit: "",
    };
  }

  /**
   * Format the workup as a string with units
   *
   * @param workup
   * @param isLabor
   * @return The formatted workup string
   */
  public static getFormattedValue(workup: Workup, isLabor: boolean = false): string {
    if (!workup || isNil(workup.value)) {
      return "N/A";
    }
    const val = round(workup.value, 2);
    const unit = workup.unit ? `/${workup.unit}` : "";
    return !isLabor ? `$${val} ${unit}` : `${val} hrs${unit}`;
  }

  /**
   * Remove all references to field values from the workup items
   *
   * @param items A workup's items
   * @return the workup items with field references removed
   */
  public static removeFieldReferences(items: WorkupItem[] = []): WorkupItem[] {
    return items.map(item => {
      if (item.per_quantity_ref) {
        delete item.per_quantity_ref;
      }
      return item;
    });
  }
}
