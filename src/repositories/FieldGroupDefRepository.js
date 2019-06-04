import BaseDefinitionRepository from "./BaseDefinitionRepository";

export default class FieldGroupDefRepository extends BaseDefinitionRepository {
  constructor(config) {
    super(
      `${config.base_uri}/definitions/field_groups/`,
      "field_group_def",
      "field_group_defs",
      config
    );
  }
}
