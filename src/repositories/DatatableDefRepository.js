import BaseDefinitionRepository from "./BaseDefinitionRepository";

export default class DatatableDefRepository extends BaseDefinitionRepository {
  constructor(config) {
    super(
      `${config.base_uri}/definitions/datatables/`,
      "datatable_def",
      "datatable_defs",
      config
    );
  }
}
