import BaseDefinitionRepository from "./BaseDefinitionRepository";

export default class LineItemDefRepository extends BaseDefinitionRepository {
  constructor(config) {
    super(
      `${config.base_uri}/definitions/line_items/`,
      "line_item_def",
      "line_item_defs",
      config
    );
  }
}
