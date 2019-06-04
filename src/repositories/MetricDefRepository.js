import BaseDefinitionRepository from "./BaseDefinitionRepository";

export default class MetricDefRepository extends BaseDefinitionRepository {
  constructor(config) {
    super(
      `${config.base_uri}/definitions/metrics/`,
      "metric_def",
      "metric_defs",
      config
    );
  }
}
