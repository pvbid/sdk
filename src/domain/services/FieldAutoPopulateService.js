import _ from "lodash";
import Helpers from "../../utils/Helpers";

/**
 * @class FieldAutoPopulateService
 */
export default class FieldAutoPopulateService {
    /**
     * Creates an instance of FieldAutoPopulateService.
     * @param {Field} field 
     */
    constructor(field) {
        this._field = field;
    }

    /**
     * Determines if field should auto populate.
     * 
     * @returns  
     */
    shouldAutoPopulate() {
        return this._shouldAutoFill() || this._shouldAutoSelect();
    }

    /**
     * Auto populates the field value based on its configuration.
     */
    autoPopulate() {
        if (this._shouldAutoFill()) {
            this._autoFill();
        } else if (this._shouldAutoSelect()) {
            this._autoSelect();
        }
    }

    /**
     * Determines if field should auto select its value.
     * 
     * @returns {boolean} 
     */
    _shouldAutoSelect() {
        if (this._field.config.type === "list") {
            if (_.isNull(this._field._data.value) || _.isEmpty(this._field._data.value) || this._field.isAutoSelected) {
                if (
                    !_.isUndefined(this._field.config.auto_populate) &&
                    !_.isUndefined(this._field.config.auto_populate.expression_type) &&
                    !_.isEmpty(this._field.config.auto_populate.expression_type)
                ) {
                    return true;
                }
            } else return false;
        } else return false;
    }

    /**
     * Determines if field should auto fill its value.
     * 
     * @returns {boolean} 
     */
    _shouldAutoFill() {
        if (this._field.config.type === "number") {
            if (_.isNull(this._field.value) || this._field.value.length === 0 || this._field.isAutoSelected) {
                if (!_.isUndefined(this._field.config.dependencies.auto_a)) {
                    return true;
                }
            } else return false;
        } else return false;
    }

    /**
     * Auto fills the field based on the field rules.
     */
    _autoFill() {
        this._nullDependencyCount = 0;
        let isChanged = false;

        const dependencyValue = this._evaluateDependency(this._field.config.dependencies.auto_a);
        if (!_.isNull(dependencyValue) && this._field._data.value != dependencyValue) {
            this._field._data.value = dependencyValue;
            this._field.config.is_auto_selected = true;
            isChanged = true;
        }

        const hasNullDependency = this._nullDependencyCount > 0;
        if (this._field.config.has_null_dependency !== hasNullDependency) {
            this._field.config.has_null_dependency = hasNullDependency;
            isChanged = true;
        }

        if (isChanged) {
            this._field.dirty();
            this._field.emit("updated");
        }
    }

    /**
     * Auto selects a field list option based on field rules.
     */
    _autoSelect() {
        this._nullDependencyCount = 0;
        var expression = this._field.config.auto_populate.expression_type;
        const datatable = this._field.getDatatable();
        if (datatable) {
            var rowValues = datatable.getColumnValues(this._field.config.auto_populate.column_id);

            rowValues = rowValues.map(el => {
                return {
                    id: el.id,
                    value: Helpers.confirmNumber(el.value)
                };
            });

            var dependencyValueA = this._evaluateDependency(this._field.config.dependencies.auto_a);
            var dependencyValueB =
                expression === "between"
                    ? this._evaluateDependency(this._field.config.dependencies.auto_b)
                    : null;
            var results = null;
            switch (expression) {
                case "between":
                    results = this._filterBetween(rowValues, dependencyValueA, dependencyValueB);
                    break;
                case "equal":
                    results = this._filterEqual(rowValues, dependencyValueA);
                    break;
                case "less_than_equal":
                    results = this._filterLessThan(rowValues, dependencyValueA);
                    break;
                case "greater_than_equal":
                    results = this._filterGreaterThan(rowValues, dependencyValueA);
                    break;
                case "closest":
                    results = this._filterClosest(rowValues, dependencyValueA);
                    break;
                default:
            }

            let isChanged = false;
            if (results.length === 0 && this._field._data.value != "") {
                this._field._data.value = "";
                isChanged = true;
            } else if (results.length === 1 && results[0].value != this._field._data.value) {
                this._field._data.value = results[0].id;
                isChanged = true;
            } else if (results.length > 1 && results[0].value != results[1].value) {
                //If the first 2 results have the same value, the system does not know which to choose, so it must be skipped.
                if (this._field._data.value != results[0].id) {
                    this._field._data.value = results[0].id;
                    isChanged = true;
                }
            } else if (this._field._data.value != "") {
                this._field._data.value = "";
                isChanged = true;
            }

            const hasNullDependency = this._nullDependencyCount > 0;
            if (hasNullDependency !== this._field.config.has_null_dependency) {
                this._field.config.has_null_dependency = hasNullDependency;
                isChanged = true;
            }

            if (isChanged) {
                this._field.config.is_auto_selected = true;
                this._field.emit("updated");
                this._field.dirty();
            }
        }
    }

    /**
     * Evaluates the contracts value and tracks if the dependency is null or has a null dependency itself
     *
     * @param {object} dependencyContract The dependency contract to evaluate
     * @return {number|null|undefined} The evaluated value of the dependency contract
     */
    _evaluateDependency(dependencyContract) {
        const dependencyValue = this._field.bid.entities.getDependencyValue(dependencyContract);

        const isNullDependency = _.isNil(dependencyValue) || !this._field.bid.entities.isDependencyFullyDefined(dependencyContract);
        this._nullDependencyCount += isNullDependency ? 1 : 0;

        return dependencyValue;
    }

    _filterLessThan(rowValues, dependencyValue) {
        rowValues = _.orderBy(rowValues, "value", "desc");
        return _.filter(rowValues, function(row) {
            return Helpers.confirmNumber(row.value) <= Helpers.confirmNumber(dependencyValue);
        });
    }

    _filterGreaterThan(rowValues, dependencyValue) {
        rowValues = _.orderBy(rowValues, "value", "asc");
        return _.filter(rowValues, function(row) {
            return Helpers.confirmNumber(row.value) >= Helpers.confirmNumber(dependencyValue);
        });
    }

    _filterBetween(rowValues, dependencyValueA, dependencyValueB) {
        rowValues = _.orderBy(rowValues, ["value"], ["asc"]);
        var results = _.filter(rowValues, function(row) {
            return (
                Helpers.confirmNumber(row.value) >= Helpers.confirmNumber(dependencyValueA) &&
                Helpers.confirmNumber(row.value) <= Helpers.confirmNumber(dependencyValueB)
            );
        });

        return results.length === 1 ? results : [];
    }

    _filterEqual(rowValues, dependencyValueA) {
        rowValues = _.orderBy(rowValues, "value", "desc");
        return _.filter(rowValues, function(row) {
            return Helpers.confirmNumber(row.value) === Helpers.confirmNumber(dependencyValueA);
        });
    }

    _filterClosest(rowValues, dependencyValueA) {
        rowValues = _.orderBy(rowValues, "value", "desc");
        return _.reduce(
            rowValues,
            function(results, row) {
                if (results.length === 0) {
                    results.push(row);
                } else {
                    if (
                        Math.abs(results[0].value - Helpers.confirmNumber(dependencyValueA)) >=
                        Math.abs(row.value - Helpers.confirmNumber(dependencyValueA))
                    ) {
                        results.unshift(row);
                    }
                }
                return results;
            },
            []
        );
    }
}
