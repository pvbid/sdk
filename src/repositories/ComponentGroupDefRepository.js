import BaseDefinitionRepository from "./BaseDefinitionRepository";

export default class ComponentGroupDefRepository extends BaseDefinitionRepository {
  constructor(config) {
    super(
      `${config.base_uri}/definitions/component_groups/`,
      "component_group_def",
      "component_group_defs",
      config
    );
  }
}
