import { isNil, orderBy } from "lodash";
import Helpers from "../../utils/Helpers";
import LineItem from "../LineItem";

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

    this.models = (this.lineItem._data.prediction_model && this.lineItem._data.prediction_model.models) || [];
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
    return (
      this.lineItem._data.prediction_model &&
      this.lineItem._data.prediction_model.models &&
      this.lineItem._data.prediction_model.models.length
    );
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
   * @param {object[]} evaluatedModels The evaluated model object. Must include the model's evaluated 'value' and 'r2'
   * @return {number} Weighted average
   */
  _getWeightedAvg(evaluatedModels) {
    if (evaluatedModels.length === 0) {
      return 0;
    }
    const r2Sum = evaluatedModels.reduce((sum, model) => sum + model.r2, 0);
    const weightedAverage = evaluatedModels.reduce((avg, model) => {
      const weight = model.r2 / r2Sum;
      const weightedValue = model.value * weight;
      return avg + weightedValue;
    }, 0);

    return weightedAverage;
  }

  /**
   * Evaluates a prediction model dependency. Returns null if it cannot be evaluated.
   *
   * @param {object} modelDependency A prediction model dependency
   * @param {string} modelDependency.type The type of dependency. Either 'field' or 'metric'
   * @param {number} modelDependency.definition_id The definition id of the dependency
   * @param {string} modelDependency.field The dependencies value field. Typically 'value'
   * @return {number|null} The evaluated value of the dependency
   */
  _getModelDependencyValue(modelDependency) {
    const { type, definition_id, field } = modelDependency;
    const [bidEntity] = this.bid.entities.getBidEntitiesByDefId(type, definition_id);
    return bidEntity
      ? this.bid.entities.getDependencyValue({ type, field, bid_entity_id: bidEntity.id })
      : null;
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
   * Evaluates a single prediction model
   *
   * @param {object} model A prediction model to evaluate
   * @return {number|null} The result of evaluating the model
   */
  evaluateModel(model) {
    const dependencyValues = { a: this._getModelDependencyValue(model.dependencies.a) };
    if (model.dependencies.b) {
      dependencyValues.b = this._getModelDependencyValue(model.dependencies.b);
    }

    const hasDefinedDependencyValues = Object.values(dependencyValues).every(val => !isNil(val));
    if (hasDefinedDependencyValues) {
      let modelValue = Helpers.calculateFormula(model.model.equation, dependencyValues);
      modelValue = modelValue < 0 ? 0 : modelValue;

      const isInBounds = Object.keys(dependencyValues).forEach(key => {
        const boundsMap = {
          a: model.bounds[0],
          b: model.bounds[1],
          y: model.bounds[model.bounds.length - 1],
        };
        return this._isInBounds(boundsMap[key], dependencyValues[key]);
      });

      return { value: modelValue, isInBounds, r2: model.model.r2 };
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
    const evaluatedModels = [];

    // evaluate up to 5 models in order of highest r2 value
    const orderedModels = orderBy(models, "model.r2", "desc");
    for (let model of orderedModels) {
      if (evaluatedModels.length < 5) {
        const evaluatedModel = this.evaluateModel(model);
        if (evaluatedModel.value !== null && evaluatedModel.value !== undefined) {
          evaluatedModels.push(evaluatedModel);
        }
      }
    }

    const inBoundsModels = evaluatedModels.filter(evaluatedModel => evaluatedModel.isInBounds);
    if (inBoundsModels.length > 0) {
      return this._getWeightedAvg(inBoundsModels);
    } else {
      // evaluating out of bounds... TODO: indicate this to user as this could reduce the quality of prediction results
      return this._getWeightedAvg(evaluatedModels.filter(model => model.value !== null));
    }
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
