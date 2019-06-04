import BaseDefinitionRepository from "./BaseDefinitionRepository";

export default class FieldDefRepository extends BaseDefinitionRepository {
  constructor(config) {
    super(
      `${config.base_uri}/definitions/fields/`,
      "field_def",
      "field_defs",
      config
    );
  }
}
