import { isBid, isComponent, isDynamicGroup } from "@/utils/EntityTypeChecks";
import Helpers from "@/utils/Helpers";
import DynamicGroup from "../DynamicGroup";
import Component from "../Component";
import LineItem from "../LineItem";
import Bid from "../Bid";

type LineItemGroupEntity = Bid | Component | DynamicGroup;

export default class LineItemGroupEntityHelper {
  /**
   * Apply a new price value to the entity
   *
   * @param entity
   * @param val new price value
   */
  public static applyPrice(entity: LineItemGroupEntity, val: number): void {
    this._checkReadOnly(entity);
    this._validateNumberProp("Price", val);
    const [oldPrice, newPrice] = this._confirmNumbers(entity.price, val);
    if (newPrice === oldPrice) return;

    const targetMarkup = entity.markup + (newPrice - oldPrice);
    entity.markup = targetMarkup;
  }

  /**
   * Apply a new markup value to the entity
   *
   * @param entity
   * @param val new markup value
   */
  public static applyMarkup(entity: LineItemGroupEntity, val: number): void {
    this._checkReadOnly(entity);
    this._validateNumberProp("Markup", val);
    const [oldValue, newValue] = this._confirmNumbers(entity.markup, val);
    if (newValue === oldValue) return;

    if (oldValue > 0) {
      this._applyMarkupByWeight(entity, newValue, oldValue);
    } else {
      this._applyMarkupEvenly(entity, newValue);
    }
  }

  /**
   * Apply a new markup percent value to the entity
   *
   * @param entity
   * @param val new markup percent value
   */
  public static applyMarkupPercent(entity: LineItemGroupEntity, val: number): void {
    this._checkReadOnly(entity);
    this._validateNumberProp("Markup Percent", val);
    const [oldValue, newValue] = this._confirmNumbers(entity.markupPercent, val);
    if (newValue === oldValue) return;

    const subtotal = this._includeTaxInMarkup(entity) ? entity.costWithTax : entity.cost;
    const targetMarkup = (newValue * subtotal) / 100;
    entity.markup = targetMarkup;
  }

  /**
   * Get all the child line items of a group entity
   *
   * @param entity
   * @return all child line items of the given group entity
   */
  private static _getAllLineItems(entity: LineItemGroupEntity): LineItem[] {
    if (isBid(entity)) {
      return Object.values(entity.entities.lineItems());
    }
    if (isDynamicGroup(entity)) {
      return entity.getLineItemDescendants();
    }
    if (isComponent(entity)) {
      return entity.getLineItems(true);
    }
    return [];
  }

  /**
   * Get all the "included" child line items of a group entity
   *
   * @param entity
   * @return all "included" child line items of the given group entity
   */
  private static _getIncludedLineItems(entity: LineItemGroupEntity): LineItem[] {
    return this._getAllLineItems(entity).filter(li => li.isIncluded);
  }

  /**
   * Throw if value given is not a valid number
   *
   * @param propTitle
   * @param val
   * @throws if number is not valid
   */
  private static _validateNumberProp(propTitle: string, val: number) {
    if (!Helpers.isNumber(val)) {
      throw new Error(`${propTitle} value must be a finite number`);
    }
  }

  /**
   * Throw if the entity is read-only
   *
   * @param entity
   * @throws if the entity is read only
   */
  private static _checkReadOnly(entity: LineItemGroupEntity): void {
    const isReadOnly = isBid(entity) ? entity.isReadOnly() : entity.bid.isReadOnly();
    if (isReadOnly) {
      throw new Error(`Cannot edit read-only ${entity.type}: ${entity.title}`);
    }
  }

  /**
   * Determine if tax is included in the markup
   *
   * @param entity
   * @return whether or not tax is included in the markup
   */
  private static _includeTaxInMarkup(entity: LineItemGroupEntity): boolean {
    if (isBid(entity)) {
      return entity.includeTaxInMarkup();
    } else {
      return entity.bid.includeTaxInMarkup();
    }
  }

  /**
   * Distribute new markup value to the child line items by weight
   *
   * @param entity
   * @param newValue
   * @param oldValue
   */
  private static _applyMarkupByWeight(entity: LineItemGroupEntity, newValue: number, oldValue: number): void {
    const includedLineItems = this._getIncludedLineItems(entity);
    const changePercent = 1 + (newValue - oldValue) / oldValue;
    includedLineItems.forEach(lineItem => {
      lineItem.markup = lineItem.markup * changePercent;
    });
  }

  /**
   * Evenly distribute the new markup value to child child line items
   *
   * @param entity
   * @param val
   */
  private static _applyMarkupEvenly(entity: LineItemGroupEntity, val: number): void {
    const includedItems = this._getIncludedLineItems(entity);
    if (!includedItems.length) return;

    const contributingItems = includedItems.filter(li => li.cost > 0);
    const hasContributingItems = contributingItems.length > 0;

    const lineItems = hasContributingItems ? contributingItems : includedItems;
    const liMarkupValue = hasContributingItems ? val / lineItems.length : val / lineItems.length - 1;

    lineItems.forEach(lineItem => {
      if (!hasContributingItems) {
        lineItem.cost = 1;
      }
      lineItem.markup = liMarkupValue;
    });
  }

  /**
   * Cast the given values as numbers
   *
   * @param oldValue
   * @param newValue
   * @return old and new value cast as number
   */
  private static _confirmNumbers(oldValue: number, newValue: number): number[] {
    return [Helpers.confirmNumber(oldValue), Helpers.confirmNumber(newValue)];
  }
}
