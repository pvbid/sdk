import { isNil, orderBy } from "lodash";
import Helpers from "@/utils/Helpers";
import LineItem from "@/domain/LineItem";

export default class PredictionService {
  /**
   * Constructor
   * @param {LineItem} lineItem
   */
  constructor(lineItem) {
    this.lineItem = lineItem;
    if (!this.lineItem) {
      throw new Error("Line Item is not set");
    }

    this.bid = this.lineItem.bid;

    const model = this.lineItem._data.prediction_model;
    this.models = (model && model.models) || [];

    // determine if a patch can be used by the model's created_at timestamp
    // this is necessary to prevent estimates from changing in bids that use models created before the fix was released
    const timestamp = model ? model.created_at : undefined;
    this._canUsePatch = {
      ignoreNullDependency: timestamp ? new Date(timestamp) > new Date("2019-12-16") : false, // ignores prediction models that rely on entities that are not fully defined
      nonNumericResult: timestamp ? new Date(timestamp) > new Date("2020-01-17") : false, // ignores prediction models that have non-numeric results
      dependencyAssemblyContext: timestamp ? new Date(timestamp) > new Date("2019-12-16") : false, // ensures assembly context is correctly considered
    };
  }

  /**
   * Retrieves a filtered list of prediction models
   *
   * @param {string} filterByType 'cost' or 'labor_hours' the type of models to retrieve
   * @return {object[]} List of models filtered by the filterType
   */
  _getFilteredModels(filterByType) {
    return this.models.filter(model => model.dependencies.y.field === filterByType);
  }

  /**
   * Determine if the line item has any prediction models
   *
   * @return {boolean}
   */
  hasPredictionModels() {
    return this.models.length > 0;
  }

  /**
   * Retrieves a list of cost prediction models
   *
   * @return {Object[]} cost prediction models
   */
  getCostPredictionModels() {
    return this._getFilteredModels("cost");
  }

  /**
   * Retrieves a list of labor prediction models
   *
   * @return {Object[]} labor prediction models
   */
  getLaborPredictionModels() {
    return this._getFilteredModels("labor_hours");
  }

  /**
   * Retrieves the contribution weight for the line item
   *
   * @return {number} The contribution weight
   */
  getContributionWeight() {
    return Helpers.confirmNumber(this.lineItem._data.prediction_model.contribution_weight);
  }

  /**
   * Gets average model value weighted by r2 for the given evaluated models
   *
   * @param {EvaluatedModel[]} evaluatedModels The evaluated model object. Must include the model's evaluated 'value' and 'r2'
   * @return {number} Weighted average
   */
  _getWeightedAvg(evaluatedModels) {
    if (!evaluatedModels.length) return 0;

    const r2Sum = evaluatedModels.reduce((sum, model) => sum + model.r2, 0);
    const weightedAverage = evaluatedModels.reduce((avg, model) => {
      const weight = model.r2 / r2Sum;
      const weightedValue = model.value * weight;
      return avg + weightedValue;
    }, 0);

    return weightedAverage;
  }

  /**
   * Get the weighted average result of the prediction models based on scaled r2
   *
   * @param {EvaluatedModel[]} evaluatedModels
   * @return {number}
   */
  _getExperimentalWeightedAvg(evaluatedModels) {
    if (!evaluatedModels.length) return 0;
    const weights = evaluatedModels.map(({ r2 }) => r2 * (2 ^ (r2 * 10))); // scale r2 to weight .9 twice as high as .8
    const totalWeight = weights.reduce((total, weight) => total + weight, 0);
    return evaluatedModels.reduce((total, { value }, i) => total + value * (weights[i] / totalWeight), 0);
  }

  /**
   * Evaluates a prediction model dependency. Returns null if it cannot be evaluated.
   *
   * @param {object} modelDependency A prediction model dependency
   * @param {string} modelDependency.type The type of dependency. Either 'field' or 'metric'
   * @param {number} modelDependency.definition_id The definition id of the dependency
   * @param {string} modelDependency.field The dependencies value field. Typically 'value'
   * @param {boolean} isBaseModel Whether or not this is the base model for the line item.
   *            If it is, the value should be given even if the dependency is not fully defined.
   * @return {number|null} The evaluated value of the dependency
   */
  _getModelDependencyValue(modelDependency, isBaseModel) {
    const { type, definition_id, field } = modelDependency;
    const bidEntity = this._getModelDependency(type, definition_id);
    return bidEntity && (isBaseModel || this._canUseDependency(bidEntity, field))
      ? this.bid.entities.getDependencyValue({ type, field, bid_entity_id: bidEntity.id })
      : null;
  }

  /**
   * Get the dependency used by the prediction model
   *
   * @param {string} type
   * @param {number} definitionId
   * @return {object|undefined} bid entity
   */
  _getModelDependency(type, definitionId) {
    const entities = this.bid.entities.getBidEntitiesByDefId(type, definitionId);
    return this._canUsePatch.dependencyAssemblyContext
      ? entities.find(
          entity =>
            !entity.config.assembly_id || entity.config.assembly_id === this.lineItem.config.assembly_id
        )
      : entities[0];
  }

  /**
   * Determine if the entity should be used to evaluate a prediction model.
   * Because of the need to maintain the integrity of old estimates,
   *  a date check is used here to ensure only prediction models generated
   *  after the fix date get the fix
   *
   * @param {object} entity
   * @param {?object} field
   * @return {boolean}
   */
  _canUseDependency(entity, field = null) {
    if (!this._canUsePatch.ignoreNullDependency) return true;
    return !entity.hasNullDependency(field);
  }

  /**
   * Determines whether the given value is within the given bounds (including a 15% factor)
   *
   * @param {number[]} bounds the upper and lower bounds
   * @param {number} value the value to be evaluated
   * @return {boolean} Whether or not the value is in bounds
   */
  _isInBounds(bounds, value) {
    if (!bounds) {
      // the base_model can have no bounds for y=0a
      return true;
    }
    const [lowerBound, upperBound] = bounds;
    return value >= lowerBound * 0.85 && value <= upperBound * 1.15;
  }

  /**
   * @typedef {Object} EvaluatedModel
   * @property {number|null} value
   * @property {boolean} isInBounds
   * @property {number} r2
   */

  /**
   * Evaluates a single prediction model
   *
   * @param {object} model A prediction model to evaluate
   * @return {EvaluatedModel} The result of evaluating the model
   */
  evaluateModel(model) {
    const dependencyValues = { a: this._getModelDependencyValue(model.dependencies.a, model.is_base) };
    if (model.dependencies.b) {
      dependencyValues.b = this._getModelDependencyValue(model.dependencies.b, model.is_base);
    }

    const hasDefinedDependencyValues = Object.values(dependencyValues).every(val => !isNil(val));
    if (hasDefinedDependencyValues) {
      let modelValue = Helpers.calculateFormula(model.model.equation, dependencyValues);
      if (!this._canUsePatch.nonNumericResult || Helpers.isNumber(modelValue)) {
        modelValue = modelValue < 0 ? 0 : modelValue;

        const isInBounds = Object.keys(dependencyValues).every(key => {
          const boundsMap = {
            a: model.bounds[0],
            b: model.bounds[1],
            y: model.bounds[model.bounds.length - 1],
          };
          return this._isInBounds(boundsMap[key], dependencyValues[key]);
        });

        return { value: modelValue, isInBounds, r2: model.model.r2 };
      }
    }
    return { value: null, isInBounds: false, r2: 0 };
  }

  /**
   * Evaluates all the given models and returns a weighted average of the significant results
   *
   * @param {object[]} models The models to evaluate
   * @return {number} The weighted avg of evaluating the given models
   */
  evaluateModels(models) {
    const evaluatedModels = this._getEvaluatedModels(models);
    return this._getWeightedAvg(this._filterByBounds(evaluatedModels));
  }

  /**
   * Evaluate the models using an experimental weighting
   *
   * @param {object[]} models
   * @return {number}
   */
  evaluateModelsExperimental(models) {
    if (!models || !models.length) return 0;
    return this._getExperimentalWeightedAvg(this._filterByBounds(this._getEvaluatedModels(models)));
  }

  /**
   * Evaluate the given models in order of descending r2 value.
   *
   * @param {object[]} models
   * @param {number} [limit=5] The maximum number of models to evaluate
   * @return {EvaluatedModel[]}
   */
  _getEvaluatedModels(models, limit = 5) {
    const evaluatedModels = [];

    const orderedModels = orderBy(models, "model.r2", "desc");
    for (let model of orderedModels) {
      if (evaluatedModels.length < limit) {
        const evaluatedModel = this.evaluateModel(model);
        if (Helpers.isNumber(evaluatedModel.value)) {
          evaluatedModels.push(evaluatedModel);
        }
      }
    }

    return evaluatedModels;
  }

  /**
   * If any models are in bounds, filter out-of-bounds models from the given models.
   * TODO: indicate if out-of-bounds models are used as this could reduce the quality of prediction
   *
   * @param {EvaluatedModel[]} models
   * @return {EvaluatedModel[]}
   */
  _filterByBounds(models) {
    const inBounds = models.filter(({ isInBounds }) => isInBounds);
    return inBounds.length > 0 ? inBounds : models.filter(({ value }) => value !== null);
  }

  /**
   * Gets the dependencies used in the prediction models for the given line item def id
   *
   * @return {bidEntity[]} The prediction model dependencies
   */
  getPredictionDependencies() {
    const dependencies = [];

    for (let model of this.models) {
      Object.keys(model.dependencies).forEach(key => {
        if (key !== "y") {
          const { type, definition_id } = model.dependencies[key];
          const entities = this.bid.entities.getBidEntitiesByDefId(type, definition_id);
          if (entities) {
            dependencies.push(...entities);
          }
        }
      });
    }
    return dependencies;
  }
}
