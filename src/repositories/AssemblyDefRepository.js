import BaseDefinitionRepository from "./BaseDefinitionRepository";

export default class AssemblyDefRepository extends BaseDefinitionRepository {
  constructor(config) {
    super(
      `${config.base_uri}/definitions/assemblies/`,
      "assembly_def",
      "assembly_defs",
      config
    );
  }
}
