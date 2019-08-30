export default class DynamicGroupScaffolding {
  /**
   * Generates a default Dynamic Group object.
   *
   * @static
   * @param {number} bidId
   * @param {string} [title="New Dynamic Group"]
   * @returns {object}
   */
  static create(bidId: number, title: string) {
    return {
      title: title ? title : "New Dynamic Group",
      bid_id: bidId,
      type: "dynamic_group",
      is_rootable: false,
      line_items: [] as number[],
      components: [] as number[],
      dynamic_groups: [] as string[],
    };
  }
}
