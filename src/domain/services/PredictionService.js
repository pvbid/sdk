import _ from 'lodash';
import Helpers from "../../utils/Helpers";

export default class PredictionService {
  constructor(bid) {
    this.bid = bid;
  }

  /**
   * Retrieves a filtered list of prediction models
   *
   * @param {number} lineItemDefId The line item definition id to get models for
   * @param {string} filterByType 'cost' or 'labor_hours' the type of models to retrieve
   * @return {object[]} List of models filtered by the filterType
   */
  _getFilteredModels(lineItemDefId, filterByType) {
    let models = this.bid.project.predictionModels[lineItemDefId].models;
    return _.filter(models, (model) => model.dependencies.y.field === filterByType);
  }

  /**
   * Retrieves a list of cost prediction models
   *
   * @param {number} lineItemDefId The line item definition id to get models for
   * @return {Object[]} cost prediction models
   */
  getCostPredictionModels(lineItemDefId) {
    return this._getFilteredModels(lineItemDefId, 'cost');
  }

  /**
   * Retrieves a list of labor prediction models
   *
   * @param {number} lineItemDefId The line item definition id to get models for
   * @return {Object[]} labor prediction models
   */
  getLaborPredictionModels(lineItemDefId) {
    return this._getFilteredModels(lineItemDefId, 'labor_hours');
  }

  /**
   * Retrieves the contribution weight for the line item
   *
   * @param {number} lineItemDefId The line item definition id to get the contribution weight for
   * @return {number} The contribution weight
   */
  getContributionWeight(lineItemDefId) {
    return this.bid.project.predictionModels[lineItemDefId].contribution_weight;
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
    return (bidEntity)
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
    if (!bounds) { // the base_model can have no bounds for y=0a
      return true;
    }
    const [lowerBound, upperBound] = bounds;
    return (value >= (lowerBound * 0.85)) && (value <= (upperBound * 1.15));
  }

  /**
   * Evaluates a single prediciton model
   *
   * @param {object} model A prediciton model to evaluate
   * @return {number|null} The result of evaluating the model
   */
  evaluateModel(model) {
    const dependencyValues = { a: this._getModelDependencyValue(model.dependencies.a) };
    if (model.dependencies.b) {
      dependencyValues.b = this._getModelDependencyValue(model.dependencies.b);
    }

    const hasDefinedDependencyValues = _.every(dependencyValues, val => !_.isNil(val));
    if (hasDefinedDependencyValues) {
      let modelValue = Helpers.calculateFormula(model.model.equation, dependencyValues);
      modelValue = modelValue < 0 ? 0 : modelValue;

      const isInBounds = _.every(dependencyValues, (dependencyValue, key) => {
        const boundsMap = {
          a: model.bounds[0],
          b: model.bounds[1],
          y: model.bounds[model.bounds.length - 1],
        };
        return this._isInBounds(boundsMap[key], dependencyValue);
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
    const orderedModels = _.orderBy(models, 'model.r2', 'desc');
    for (let model of orderedModels) {
      if (evaluatedModels.length < 5) {
        const evaluatedModel = this.evaluateModel(model);
        if (evaluatedModel.value !== null && evaluatedModel.value !== undefined) {
          evaluatedModels.push(evaluatedModel);
        }
      }
    };

    const inBoundsModels = evaluatedModels.filter(evaluatedModel => evaluatedModel.isInBounds);
    if (inBoundsModels.length > 0) {
      return this._getWeightedAvg(inBoundsModels);
    } else {
      // evaluating out of bounds... TODO: indicate this to user as this could reduce the quality of prediction results
      return this._getWeightedAvg(evaluatedModels.filter(model => model.value !== null));
    }
  }

  /**
   * Determines if the line item has prediction models by its def Id.
   *  Line item defs might not have prediction models if they have been created since
   *  the last time the regression was run or if there was not enough data for the regression
   *  to generate a model.
   *
   * @param {number} lineItemDefId
   * @return {boolean}
   */
  hasPredictionModels(lineItemDefId) {
    if (this.bid.project.predictionModels[lineItemDefId] !== undefined &&
      this.bid.project.predictionModels[lineItemDefId].models &&
      this.bid.project.predictionModels[lineItemDefId].models.length) {
      return true;
    }
    return false;
  }

  /**
   * Gets the dependencies used in the prediction models for the given line item def id
   *
   * @param {number} lineItemDefId The line item definition id to get dependencies for
   * @return {bidEntity[]} The prediction model dependencies
   */
  getPredictionDependencies(lineItemDefId) {
    const dependencies = [];
    const models = this.bid.project.predictionModels[lineItemDefId].models;

    for (let model of models) {
      Object.keys(model.dependencies).forEach(key => {
        if (key !== 'y') {
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
