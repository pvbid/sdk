import cloneDeep from "lodash/cloneDeep";
import round from "lodash/round";
import { waitForFinalEvent } from "@/utils/WaitForFinalEvent";
import { LineItemProp } from "@/types";
import Helpers from "@/utils/Helpers";
import BidEntity from "./BidEntity";
import Component from "./Component";
import LineItem from "./LineItem";
import Bid from "./Bid";

const summableProps = [
  "cost",
  "taxableCost",
  "price",
  "markup",
  "tax",
  "base",
  "laborHours",
  "wage",
  "burden",
  "laborCosts",
  "nonLaborCosts",
] as const;

/**
 * Dynamic Group
 */
export default class DynamicGroup extends BidEntity {
  /**
   * Reference to the bid that the component belongs to.
   * @type {Bid}
   */
  public bid: Bid;
  private _original: object;
  private _propsWithFlags = [
    "cost",
    "price",
    "markup",
    "tax",
    "taxable_cost",
    "labor_hours",
    "labor_cost",
    "non_labor_cost",
    "base",
    "wage",
    "burden",
    "is_included",
  ];

  /**
   * A hashmap containing child references keyed by type
   * Map<string | number, Array<LineItem | Component | DynamicGroup>>
   */
  private _refContainerMap: Map<string | number, Array<any>> = new Map();

  /**
   * Creates an instance of DynamicGroup.
   * @param {object} dynamicGroupData
   * @param {Bid} bid
   */
  constructor(entityData: object, bid: Bid) {
    super();

    this.bid = bid;
    this._data = entityData;
    this._original = cloneDeep(entityData);
  }

  /**
   * The id of the bid entity.
   */
  public get id(): string {
    return this._data.id;
  }

  /**
   * Reference IDs of the line items in the group
   */
  public get lineItems(): Array<number> {
    return this._data.line_items || [];
  }

  /**
   * Get the group's line items keyed by reference id
   */
  public getLineItems(): Array<LineItem> {
    // Only build the ref list if it's undefined
    if (!this._refContainerMap.has("line_item")) {
      this._refContainerMap.set(
        "line_item",
        this.lineItems.reduce((result: Array<LineItem>, refId: number) => {
          const lineItem = this.bid.entities.lineItems(refId);
          if (lineItem) {
            result.push(lineItem);
          }
          return result;
        }, [])
      );
    }

    return this._refContainerMap.get("line_item") || [];
  }

  /**
   * Sets the include status for all nested line items.
   *
   * @param {boolean} isIncluded
   */
  setIncludeStatus(isIncluded: boolean) {
    if (this.bid.isAssessable()) {
      this.getUniqueLineItemDescendants().forEach(lineItem => {
        lineItem.isIncluded = isIncluded;
      });
    }
  }

  /**
   * Reference IDs of the components in the group
   */
  public get components(): Array<number> {
    return this._data.components || [];
  }

  /**
   * Get the group's components keyed by reference id
   */
  public getComponents(): Array<Component> {
    // Only build the ref list if it's undefined
    if (!this._refContainerMap.has("component")) {
      this._refContainerMap.set(
        "component",
        this.components.reduce((result: Array<Component>, refId: number) => {
          const component = this.bid.entities.components(refId);
          if (component) {
            result.push(component);
          }
          return result;
        }, [])
      );
    }

    return this._refContainerMap.get("component") || [];
  }

  /**
   * Reference IDs of the dynamic groups in the group
   */
  public get dynamicGroups(): Array<string> {
    return this._data.dynamic_groups || [];
  }

  /**
   * Get the group's nested Dynamic Groups keyed by reference id
   */
  public getDynamicGroups(): Array<DynamicGroup> {
    // Only build the ref list if it's undefined
    if (!this._refContainerMap.has("dynamic_group")) {
      this._refContainerMap.set(
        "dynamic_group",
        this.dynamicGroups.reduce((result: Array<DynamicGroup>, refId: string) => {
          const dg = this.bid.entities.dynamicGroups(refId);
          if (dg) {
            result.push(dg);
          }
          return result;
        }, [])
      );
    }

    return this._refContainerMap.get("dynamic_group") || [];
  }

  private _getChildIdsByType(type: string): Array<string | number> {
    switch (type) {
      case "line_item":
        return this.lineItems;
      case "component":
        return this.components;
      case "dynamic_group":
        return this.dynamicGroups;
      default:
        throw new Error("Child entity type must be of type Component, Line Item, or Dynamic Group.");
    }
  }

  /**
   * Adds a new child entity to the dynamic group. Cannot create a circular/recursive loop.
   *
   * @param entity The entity to add as a child to the dynamic group.
   * @throws When child is not the correct type.
   * @throws When child would create an infinite loop.
   */
  public addChild(entity: LineItem | Component | DynamicGroup) {
    switch (entity.type) {
      case "line_item":
        this._data.line_items.push(entity.id);
        this._refContainerMap.delete("line_item");
        break;
      case "component":
        this._data.components.push(entity.id);
        this._refContainerMap.delete("component");
        break;
      case "dynamic_group":
        if (this._isSafeChild(entity as DynamicGroup)) {
          this._data.dynamic_groups.push(entity.id);
          this._refContainerMap.delete("dynamic_group");
        } else {
          throw new Error(`Adding group (${entity.id}) will create an infinite dependency loop!`);
        }
        break;
      default:
        throw new Error("Child entity must be of type Component, Line Item, or Dynamic Group.");
    }
    this.dirty();

    this._bindEntity(entity);
    this.assess();
  }

  /**
   * Removes the first entity matching the given id from the child list
   *
   * @param type the type of entity to remove (component, line_item, dynamic_group)
   * @param id the reference id of the entity to remove
   * @throws {Error} if child was not found
   * @return the index of the entity that was removed
   */
  public removeChildById(type: string, id: string | number): number {
    const children = this._getChildIdsByType(type);
    const index: number = children.indexOf(id);
    if (index >= 0) {
      this.removeChildByIndex(type, index);
      return index;
    }
    throw new Error(`(${type}: ${id}) not found as child of group (${this.id})`);
  }

  /**
   * Splices the entity at the given index from the child entity array
   *
   * @param type the type of the entity to remove (component, line_item, dynamic_group)
   * @param index the index of the entity to remove
   * @throws {Error} If index is not valid for the given type array
   * @return the ID of the entity removed
   */
  public removeChildByIndex(type: string, index: number): string | number {
    const children = this._getChildIdsByType(type);
    if (index >= children.length) {
      throw new Error(`Invalid index ${index}`);
    }
    const childId = children[index]; // TODO: reference id
    children.splice(index, 1);
    const child = this.bid.entities.getBidEntity(type, childId);
    if (child) {
      this._unbindEntity(child);
      this._refContainerMap.delete(type);
    }
    this.assess();
    this.dirty();
    return childId;
  }

  /**
   * Convert a child component to a dynamic group
   *
   * @param componentRef The reference to the child component to convert to a dynamic group
   * @return The new dynamic group
   */
  public async convertComponentToGroup(componentRef: number): Promise<DynamicGroup> {
    if (!this.components.includes(componentRef)) {
      throw new Error("Invalid child component id.");
    }
    const component: Component = this.bid.entities.components(componentRef);
    const copyGroup = await this.bid.addDynamicGroup(component.title);
    copyGroup._data.from_component = component.id;
    component
      .getLineItems(false)
      .sort((a, b) => a.config.order_index - b.config.order_index)
      .forEach(lineItem => {
        copyGroup.addChild(lineItem);
      });
    component
      .getSubComponents()
      .sort((a, b) => a.config.order_index - b.config.order_index)
      .forEach(component => {
        copyGroup.addChild(component);
      });
    copyGroup.dirty();
    while (this.components.includes(componentRef)) {
      this.removeChildById("component", component.id);
      this.addChild(copyGroup);
    }
    return copyGroup;
  }

  /**
   * Indicates whether the group has any included items contributing to it.
   */
  public get isIncluded(): boolean {
    return (this._data.is_included && this._data.is_included.value) || false;
  }

  /**
   * The total number of included line items within the group at any level of the structure.
   */
  public get includedLineItemCount(): number {
    return this._data.included_count || 0;
  }

  /**
   * Reference to the component this group was initiated from if it wasn't generated from scratch.
   */
  public get fromComponent(): number {
    return this._data.from_component || null;
  }

  /**
   * The summed cost from the nested entities.
   */
  public get cost(): number {
    return this._getPropValue("cost");
  }

  /**
   * Setter for cost
   */
  public set cost(val: number) {
    if (!Helpers.isNumber(val)) {
      throw new Error("Cost value must be a finite number");
    }

    this._applyChangesToLineItemDescendants("cost", val);
  }

  /**
   * The summed taxable cost from the nested entities.
   */
  public get taxableCost(): number {
    return this._getPropValue("taxable_cost");
  }

  /**
   * The average tax percentage from the nested entities.
   */
  public get taxPercent(): number {
    return this._getPropValue("tax_percent");
  }

  /**
   * Setter for tax_percent
   */
  public set taxPercent(val: number) {
    if (!Helpers.isNumber(val)) {
      throw new Error("Tax Percent value must be a finite number");
    }
    this._applyChangesToLineItemDescendants("taxPercent", val);
  }

  /**
   * The summed tax from the nested entities
   */
  public get tax(): number {
    return this._getPropValue("tax");
  }

  /**
   * Setter for tax
   */
  public set tax(val: number) {
    if (!Helpers.isNumber(val)) {
      throw new Error("Tax value must be a finite number");
    }
    this._applyChangesToLineItemDescendants("tax", val);
  }

  /**
   * Summed Cost With Tax
   */
  public get costWithTax(): number {
    return this.tax + this.cost;
  }

  /**
   * The summed markup from the nested entities
   */
  public get markup(): number {
    return this._getPropValue("markup");
  }

  /**
   * Setter for markup
   */
  public set markup(val: number) {
    if (!Helpers.isNumber(val)) {
      throw new Error("Markup value must be a finite number");
    }
    this._applyChangesToLineItemDescendants("markup", val);
  }

  /**
   * The average markup percent form the nested entities
   */
  public get markupPercent(): number {
    return this._getPropValue("markup_percent");
  }

  /**
   * Setter for markup_percent
   */
  public set markupPercent(val: number) {
    if (!Helpers.isNumber(val)) {
      throw new Error("Markup Percent value must be a finite number");
    }
    this._applyChangesToLineItemDescendants("markupPercent", val);
  }

  /**
   * The summed labor hours from the nested entities
   */
  public get laborHours(): number {
    return this._getPropValue("labor_hours");
  }

  /**
   * Setter for labor_hours
   */
  public set laborHours(val: number) {
    if (!Helpers.isNumber(val)) {
      throw new Error("Labor Hours value must be a finite number");
    }
    this._applyChangesToLineItemDescendants("laborHours", val);
  }

  /**
   * The summed labor cost from the nested entities
   */
  public get laborCost(): number {
    return this._getPropValue("labor_cost");
  }

  /**
   * The summed price from the nested entities
   */
  public get price(): number {
    return this._getPropValue("price");
  }

  /**
   * The summed non-labor cost from the nested entities
   */
  public get nonLaborCost(): number {
    return this._getPropValue("non_labor_cost");
  }

  /**
   * Setter for price
   */
  public set price(val: number) {
    if (!Helpers.isNumber(val)) {
      throw new Error("Price value must be a finite number");
    }
    this._applyChangesToLineItemDescendants("price", val);
  }

  /**
   * Price per watt
   */
  public get priceWatt(): number {
    if (this.bid.watts > 0) {
      return Helpers.confirmNumber(this.price / this.bid.watts);
    }
    return this.price;
  }

  /**
   * Setter for Price per watt
   */
  public set priceWatt(val: number) {
    if (!Helpers.isNumber(val)) {
      throw new Error("Price Per Watt value must be a finite number");
    }
    this.price = val * this.bid.watts;
  }

  /**
   * Cost per watt
   */
  public get costWatt(): number {
    if (this.bid.watts > 0) {
      return Helpers.confirmNumber(this.cost / this.bid.watts);
    }
    return this.cost;
  }

  /**
   * Setter for Cost per watt
   */
  public set costWatt(val: number) {
    if (!Helpers.isNumber(val)) {
      throw new Error("Cost Per Watt value must be a finite number");
    }
    this.cost = val * this.bid.watts;
  }

  /**
   * Gets the entity's definition id.
   */
  public get definitionId(): string {
    return this._data.definition_id;
  }

  /**
   * The average Base property from the nested entities
   */
  public get baseAvg(): number {
    return this._getPropValue("base_avg");
  }

  /**
   * Gets the Wage property
   */
  public get wage(): number {
    return this._getPropValue("wage");
  }

  /**
   * Sets the Wage property on the nested entities
   */
  public set wage(val) {
    if (!Helpers.isNumber(val)) {
      throw new Error("Wage value must be a finite number");
    }
    this._applyChangesToLineItemDescendants("wage", val);
  }

  /**
   * The average Wage property from the nested entities
   */
  public get wageAvg(): number {
    return this._getPropValue("wage_avg");
  }

  /**
   * The average Burden property from the nested entities
   */
  public get burdenAvg(): number {
    return this._getPropValue("burden_avg");
  }

  /**
   * Determine if any child has been overridden
   *
   * @param [property] determine if a specific prop is overridden. If omitted, will determine if ANY prop has been overridden.
   */
  public isOverridden(property: string = null): boolean {
    return this._evaluateFlag("is_overridden", property);
  }

  /**
   * Determine if any prop is dependent on a predicted value
   *
   * @param [property] determine if a specific prop depends on a prediction. If omitted, will determine if ANY prop depends on a prediction.
   */
  public isPredicted(property: string = null): boolean {
    return this._evaluateFlag("is_predicted", property);
  }

  /**
   * Determine if any prop depends on a null value
   *
   * @param [property] determine if a specific prop has a null dependency. If omitted, will determine if ANY prop depends on a null value.
   */
  public hasNullDependency(property: string = null): boolean {
    return this._evaluateFlag("has_null_dependency", property);
  }

  /**
   * Resets all Line Item descendants.
   */
  reset() {
    if (this.bid.isAssessable()) {
      this.getUniqueLineItemDescendants().forEach(lineItem => {
        lineItem.reset();
      });
    }
  }

  /**
   * Determine if Dynamic Group is "rootable".
   * i.e. is it flagged as important
   */
  public set isRootable(val: boolean) {
    if (typeof val === "boolean" && this._data.is_rootable !== val) {
      this._data.is_rootable = val;
      this.dirty();
    }
  }

  /**
   * Determine if Dynamic Group is "rootable".
   * i.e. is it flagged as important
   */
  public get isRootable(): boolean {
    return this._data.is_rootable;
  }

  /**
   * Assesses bid entity.
   *
   * @emits {assessing} Fires as assessment begins.
   * @emits {assessed} Fires when bid entity assessment is completed
   * @emits {updated} Fires when the bid entity has changed.
   * @abstract
   */
  public assess(): void {
    if (!this.bid.isAssessable()) {
      return;
    }

    let isChanged = false;
    let totals: EntityPropSums = getEmptyEntityPropsSum();
    let isIncluded: EntityPropBool = { value: false, is_overridden: false };
    let totalIncludedLineItems = 0;
    let totalIncludedLaborLineItems = 0;

    // sum line items
    this.getLineItems().forEach(lineItem => {
      if (lineItem.isOverridden("is_included")) {
        isIncluded.is_overridden = true;
      }
      if (!lineItem.isIncluded) {
        return;
      }
      isIncluded.value = true;
      totalIncludedLineItems += 1;
      if (lineItem.isLabor()) {
        totalIncludedLaborLineItems += 1;
      }
      totals = this._mergePropSums(totals, this._getLineItemSum(lineItem));
    });

    // sum components
    this.getComponents().forEach(component => {
      totals = this._mergePropSums(totals, this._getComponentSum(component));
      if (component.isIncluded) {
        isIncluded.value = true;
      }
      if (component.isOverridden("is_included")) {
        isIncluded.is_overridden = true;
      }
      totalIncludedLineItems += Helpers.confirmNumber(component.getVirtualPropertyValue("included_count"));
      totalIncludedLaborLineItems += Helpers.confirmNumber(
        component.getVirtualPropertyValue("included_labor_count")
      );
    });

    // sum dynamic groups
    this.getDynamicGroups().forEach(dynamicGroup => {
      totals = this._mergePropSums(totals, this._getDynamicGroupSum(dynamicGroup));
      if (dynamicGroup.isIncluded) {
        isIncluded.value = true;
      }
      if (dynamicGroup.isOverridden("is_included")) {
        isIncluded.is_overridden = true;
      }
      totalIncludedLineItems += Helpers.confirmNumber(dynamicGroup.includedLineItemCount);
      totalIncludedLaborLineItems += Helpers.confirmNumber(dynamicGroup._data.included_labor_count);
    });

    const markupPercent = this._calculateMarkupPercentTotal(totals);
    const taxPercent = this._calculateTaxPercentTotal(totals);

    const baseAvg = {
      ...totals.base,
      value: totalIncludedLineItems > 0 ? totals.base.value / totalIncludedLineItems : 0,
    };
    const wageAvg = {
      ...totals.wage,
      value: totalIncludedLaborLineItems > 0 ? totals.wage.value / totalIncludedLaborLineItems : 0,
    };
    const burdenAvg = {
      ...totals.burden,
      value: totalIncludedLaborLineItems > 0 ? totals.burden.value / totalIncludedLaborLineItems : 0,
    };

    isChanged = this._apply("is_included", isIncluded) || isChanged;
    isChanged = this._apply("cost", totals.cost) || isChanged;
    isChanged = this._apply("price", totals.price) || isChanged;
    isChanged = this._apply("taxable_cost", totals.taxableCost) || isChanged;
    isChanged = this._apply("tax", totals.tax) || isChanged;
    isChanged = this._apply("markup", totals.markup) || isChanged;
    isChanged = this._apply("tax_percent", { value: taxPercent }) || isChanged;
    isChanged = this._apply("markup_percent", { value: markupPercent }) || isChanged;
    isChanged = this._apply("non_labor_cost", totals.nonLaborCosts) || isChanged;
    isChanged = this._apply("labor_hours", totals.laborHours) || isChanged;
    isChanged = this._apply("labor_cost", totals.laborCosts) || isChanged;
    isChanged = this._apply("base", totals.base) || isChanged;
    isChanged = this._apply("base_avg", baseAvg) || isChanged;
    isChanged = this._apply("burden", totals.burden) || isChanged;
    isChanged = this._apply("burden_avg", burdenAvg) || isChanged;
    isChanged = this._apply("wage", totals.wage) || isChanged;
    isChanged = this._apply("wage_avg", wageAvg) || isChanged;
    isChanged = this._apply("included_count", totalIncludedLineItems) || isChanged;
    isChanged = this._apply("included_labor_count", totalIncludedLaborLineItems) || isChanged;

    if (isChanged) {
      this._postApply();
    }
    this.emit("assessed");
  }

  /**
   * Apply changes to the data model depending on the value type. Returns True if changed.
   */
  private _apply(prop: string, newValue: EntityPropNumeric | EntityPropBool | number): boolean {
    let hasChanges = false;
    const oldValue = this._data[prop];

    if (typeof newValue === "number") {
      hasChanges = this._areNumbersDifferent(oldValue, newValue);
    } else if (isNumericEntityProp(newValue)) {
      hasChanges = this._hasNumericPropChanged(oldValue, newValue);
    } else {
      hasChanges = this._hasBooleanPropChanged(oldValue, newValue);
    }

    if (hasChanges) {
      this._data[prop] = newValue;
    }

    return hasChanges;
  }

  /**
   * Get the delta scalar of the value that changed on this DG
   * @param prop
   * @param oldVal
   * @param newVal
   */
  private _getDeltaScalar(prop: LineItemProp, oldVal: number, newVal: number): number {
    if (typeof newVal !== typeof newVal) {
      throw new Error("Type mismatch in delta check.");
    }

    // Don't distribute percentage changes
    if (["markupPercent", "taxPercent"].indexOf(prop) >= 0 && oldVal === 0) {
      return newVal;
    }

    // Distribute the changes to included Line Items if any exist
    if (this.includedLineItemCount > 0) {
      return newVal / (oldVal > 0 ? oldVal : this.includedLineItemCount);
    }

    // Default: Distribute the changes to child Line Items
    return newVal / this.getLineItemDescendants().length;
  }

  /**
   * Apply the changes to all Line Item descendants
   * @param prop
   * @param newVal
   */
  private _applyChangesToLineItemDescendants(prop: LineItemProp, newVal: number) {
    const oldVal = this[prop];

    if (oldVal === newVal) {
      return false;
    }

    if (typeof oldVal === "boolean") {
      return false;
    }

    try {
      const deltaScalar = this._getDeltaScalar(prop, oldVal, Helpers.confirmNumber(newVal));
      this.getUniqueLineItemDescendants().forEach((li: LineItem) => {
        // Change all of them if none are included
        // OR only the ones that are included
        if (this.includedLineItemCount === 0 || li.isIncluded) {
          li[prop] = oldVal > 0 ? li[prop] * deltaScalar : deltaScalar;
        }
      });
      this._postApply();
    } catch (e) {
      console.log(e);
    }
  }

  private _postApply(emission: string = "updated") {
    this.dirty();
    this.emit(emission);
  }

  private _arePropFlagsDifferent(currentValue: EntityPropFlags, newValue: EntityPropFlags): boolean {
    return (
      !!currentValue.is_overridden !== !!newValue.is_overridden ||
      !!currentValue.is_predicted !== !!newValue.is_predicted ||
      !!currentValue.has_null_dependency !== !!newValue.has_null_dependency
    );
  }

  private _areNumbersDifferent(currentValue: number, newValue: number): boolean {
    return round(Helpers.confirmNumber(currentValue, 0), 4) !== round(Helpers.confirmNumber(newValue, 0), 4);
  }

  private _hasNumericPropChanged(
    currentValue: EntityPropNumeric = { value: 0 },
    newValue: EntityPropNumeric
  ): boolean {
    return (
      this._arePropFlagsDifferent(currentValue, newValue) ||
      this._areNumbersDifferent(currentValue.value, newValue.value)
    );
  }

  private _hasBooleanPropChanged(
    currentValue: EntityPropBool = { value: false },
    newValue: EntityPropBool
  ): boolean {
    return !!currentValue.value !== !!newValue.value || this._arePropFlagsDifferent(currentValue, newValue);
  }

  private _calculateMarkupPercentTotal({ cost, tax, markup }: EntityPropSums): number {
    const adjCost = this.bid.includeTaxInMarkup() ? cost.value + tax.value : cost.value;
    return adjCost > 0 ? (markup.value / adjCost) * 100 : 0;
  }

  private _calculateTaxPercentTotal({ tax, taxableCost }: EntityPropSums): number {
    return taxableCost.value > 0 ? (tax.value / taxableCost.value) * 100 : 0;
  }

  private _getLineItemSum(li: LineItem): EntityPropSums {
    const cost = this._getEntityProp(li.cost, li, "cost");
    return {
      cost,
      price: this._getEntityProp(li.price, li, "price"),
      markup: this._getEntityProp(li.markup, li, "markup"),
      tax: this._getEntityProp(li.tax, li, "tax"),
      base: this._getEntityProp(li.base, li, "base"),
      wage: this._getEntityProp(li.wage, li, "wage"),
      burden: this._getEntityProp(li.burden, li, "burden"),
      laborCosts: li.isLabor() ? { ...cost } : { value: 0 },
      laborHours: li.isLabor() ? this._getEntityProp(li.laborHours, li, "labor_hours") : { value: 0 },
      nonLaborCosts: li.isLabor() ? { value: 0 } : { ...cost },
      taxableCost:
        li.isLabor() && !this.bid.entities.variables().taxable_labor.value ? { value: 0 } : { ...cost },
    };
  }

  private _getComponentSum(c: Component): EntityPropSums {
    return {
      cost: this._getEntityProp(c.cost, c, "cost"),
      price: this._getEntityProp(c.price, c, "price"),
      markup: this._getEntityProp(c.markup, c, "markup"),
      tax: this._getEntityProp(c.tax, c, "tax"),
      taxableCost: this._getEntityProp(c.taxableCost, c, "taxable_cost"),
      laborHours: this._getEntityProp(c.laborHours, c, "labor_hours"),
      laborCosts: this._getEntityProp(c.laborCost, c, "labor_cost"),
      nonLaborCosts: this._getEntityProp(c.nonLaborCost, c, "non_labor_cost"),
      base: this._getEntityProp(c.getVirtualPropertyValue("base"), c, "base"),
      wage: this._getEntityProp(c.getVirtualPropertyValue("wage"), c, "wage"),
      burden: this._getEntityProp(c.getVirtualPropertyValue("burden"), c, "burden"),
    };
  }

  private _getDynamicGroupSum(dg: DynamicGroup): EntityPropSums {
    return {
      cost: dg._data.cost,
      price: dg._data.price,
      markup: dg._data.markup,
      tax: dg._data.tax,
      taxableCost: dg._data.taxable_cost,
      laborHours: dg._data.labor_hours,
      laborCosts: dg._data.labor_cost,
      nonLaborCosts: dg._data.non_labor_cost,
      base: dg._data.base,
      wage: dg._data.wage,
      burden: dg._data.burden,
    };
  }

  /**
   * Generate an entity prop from an entity
   * @param value
   * @param entity
   * @param prop
   */
  private _getEntityProp(value: number, entity: LineItem | Component, prop: string): EntityPropNumeric {
    return {
      value: Helpers.confirmNumber(value),
      is_overridden: entity.isOverridden(prop),
      has_null_dependency: entity.hasNullDependency(prop),
      is_predicted: entity.isPredicted(prop),
    };
  }

  /**
   * Determines if the given group is safe to add as a child to the current group.
   *
   * @param potentialChild The reference id of the potential child group.
   * @return False if the child should not be added.
   */
  private _isSafeChild(potentialChild: DynamicGroup): boolean {
    if (potentialChild.id === this.id) return false;
    return !potentialChild.hasSubGroup(this.id);
  }

  /**
   * Recursively check the dynamic group structure for the given dynamic group id
   * @param id Dynamic group id
   */
  public hasSubGroup(dynamicGroupId: string): boolean {
    if (this.dynamicGroups.length === 0) {
      return false;
    }
    if (this.dynamicGroups.includes(dynamicGroupId)) {
      return true;
    }
    return this.getDynamicGroups().some(dg => dg.hasSubGroup(dynamicGroupId));
  }

  /**
   * Binds the "updated" event for all dependant bid entities.
   */
  public bind() {
    this._bindLineItems();
    this._bindComponents();
    this._bindDynamicGroups();
  }

  private _bindEntity(entity: LineItem | Component | DynamicGroup): void {
    entity.on("updated", `dynamic_group.${this.id}`, (requesterId: string) => {
      waitForFinalEvent(() => this.assess(), 5, `dynamic_group.${this.id}.${entity.type}.${requesterId}`);
    });
  }

  private _unbindEntity(entity: LineItem | Component | DynamicGroup): void {
    entity.removeListenerByRequester("updated", `dynamic_group.${this.id}`);
  }

  private _bindLineItems() {
    this.getLineItems().forEach(lineItem => this._bindEntity(lineItem));
  }

  private _bindComponents() {
    this.getComponents().forEach(component => this._bindEntity(component));
  }

  private _bindDynamicGroups() {
    this.getDynamicGroups().forEach(group => this._bindEntity(group));
  }

  private _evaluateFlag(flag: string, property?: string): boolean {
    if (property) {
      return this._getPropFlag(property, flag);
    }
    return this._propsWithFlags.some(prop => {
      return this._getPropFlag(prop, flag);
    });
  }

  private _getPropFlag(prop: string, flag: string): boolean {
    if (this._data[prop] && this._data[prop][flag]) {
      return this._data[prop][flag];
    }
    return false;
  }

  private _getPropValue(prop: string): number {
    if (this._data[prop]) {
      return this._data[prop].value;
    }
    return 0;
  }

  private _mergePropSums(a: EntityPropSums, b: EntityPropSums): EntityPropSums {
    return {
      cost: this._mergeEntityProps(a.cost, b.cost),
      taxableCost: this._mergeEntityProps(a.taxableCost, b.taxableCost),
      price: this._mergeEntityProps(a.price, b.price),
      markup: this._mergeEntityProps(a.markup, b.markup),
      tax: this._mergeEntityProps(a.tax, b.tax),
      base: this._mergeEntityProps(a.base, b.base),
      laborHours: this._mergeEntityProps(a.laborHours, b.laborHours),
      wage: this._mergeEntityProps(a.wage, b.wage),
      burden: this._mergeEntityProps(a.burden, b.burden),
      laborCosts: this._mergeEntityProps(a.laborCosts, b.laborCosts),
      nonLaborCosts: this._mergeEntityProps(a.nonLaborCosts, b.nonLaborCosts),
    };
  }

  private _mergeEntityProps(a?: EntityPropNumeric, b?: EntityPropNumeric): EntityPropNumeric {
    if (!a && !b) return { value: 0 };
    if (!a) return b;
    if (!b) return a;
    return {
      value: Helpers.confirmNumber(a.value, 0) + Helpers.confirmNumber(b.value, 0),
      is_overridden: a.is_overridden || b.is_overridden,
      has_null_dependency: a.has_null_dependency || b.has_null_dependency,
      is_predicted: a.is_predicted || b.is_predicted,
    };
  }

  public dirty() {
    this.bid.dirty();
    super.dirty();
  }

  /**
   * Traverse the structure to find all of the Line Item descendants
   * @return LineItem[]
   */
  public getLineItemDescendants() {
    // all direct child LIs
    let allLineItems = [...this.getLineItems()];

    // recurse into components
    this.getComponents().forEach((c: Component) => {
      allLineItems.push(...c.getLineItems(true));
    });

    // recurse into child DGs
    this.getDynamicGroups().forEach((dg: DynamicGroup) => {
      allLineItems.push(...dg.getLineItemDescendants());
    });

    return allLineItems;
  }

  public getUniqueLineItemDescendants() {
    return new Set(this.getLineItemDescendants());
  }
}

interface EntityPropFlags {
  is_overridden?: boolean;
  has_null_dependency?: boolean;
  is_predicted?: boolean;
}

interface EntityPropNumeric extends EntityPropFlags {
  value: number;
}

/**
 * User-defined type guard for EntityPropNumeric
 * @param prop The entity prop to type check
 * @return {boolean}
 */
function isNumericEntityProp(prop: EntityPropNumeric | EntityPropBool): prop is EntityPropNumeric {
  return typeof prop.value === "number";
}

interface EntityPropBool extends EntityPropFlags {
  value: boolean;
}

type SummableProps = typeof summableProps[number];
type EntityPropSums = { [key in SummableProps]: EntityPropNumeric };

function getEmptyEntityPropsSum(): EntityPropSums {
  return summableProps.reduce((obj: any, prop) => {
    obj[prop] = { value: 0 };
    return obj;
  }, {});
}
