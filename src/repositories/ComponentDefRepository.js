import BaseDefinitionRepository from "./BaseDefinitionRepository";

export default class ComponentDefRepository extends BaseDefinitionRepository {
  constructor(config) {
    super(
      `${config.base_uri}/definitions/components/`,
      "component_def",
      "component_defs",
      config
    );
  }
}
