import _ from "lodash";
import Helpers from "../utils/Helpers";
import BidEntity from "./BidEntity";

/**
 * Field Class
 */
export default class Field extends BidEntity {
    /**
     * Creates an instance of Field.
     * @param {object} fieldData 
     * @param {Bid} bid
     */
    constructor(fieldData, bid) {
        super();
        this.bid = bid;
        this._data = fieldData;
        this._original = Object.assign({}, fieldData);
    }

    /**
     * Gets value of the field. 
     * If the field is of a list type, will return the associated datatable row id.
     * 
     * @type {string} 
     */
    get value() {
        return this._data.value;
    }

    /**
     * @type {string}
     */
    set value(val) {
        if (val != this._data.val) {
            this.config.is_auto_selected = false;
            this._data.value = val;
            this.dirty();
            this.emit("updated");
        }
    }

    /**
     * @type {string}
     */
    get actualValue() {
        return this._data.actual_value;
    }

    /**
     * @type {string}
     */
    set actualValue(val) {
        this._data.actual_value = val;
        this.dirty();
    }

    /**
     * Gets the configuration information for the bid entity.
     * @type {object}
     * @readonly
     */
    get config() {
        return this._data.config;
    }

    /**
     * @type {boolean}
     */
    get isAutoSelected() {
        return !_.isUndefined(this.config.is_auto_selected) && this.config.is_auto_selected;
    }

    /**
     * @type {boolean}
     */
    set isAutoSelected(val) {
        if (_.isBoolean(val)) {
            this.config.is_auto_selected = val;
            this.assess();
        }
    }

    assess() {
        if (this._shouldAutoSelect()) {
            this._autoSelect();
        } else if (this._shouldAutoFill()) {
            this._autoFill();
        }

        this.emit("assessed");
    }

    /**
     * Determines if field should auto select its value.
     * 
     * @returns {boolean} 
     */
    _shouldAutoSelect() {
        if (this.config.type === "list") {
            if (_.isNull(this._data.value) || _.isEmpty(this._data.value) || this.isAutoSelected) {
                if (
                    !_.isUndefined(this.config.auto_populate) &&
                    !_.isUndefined(this.config.auto_populate.expression_type) &&
                    !_.isEmpty(this.config.auto_populate.expression_type)
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
        if (this.config.type === "number") {
            if (_.isNull(this.value) || this.value.length === 0 || this.isAutoSelected) {
                if (!_.isUndefined(this.config.dependencies.auto_a)) {
                    return true;
                }
            } else return false;
        } else return false;
    }

    bind() {
        for (let dependencyContract of Object.values(this.config.dependencies)) {
            if (!_.isEmpty(dependencyContract)) {
                const dependency = this.bid.relations.getDependency(dependencyContract);
                if (dependency) {
                    dependency.on("updated", `field.${this.id}`, () => this.assess());
                }
            }
        }
    }

    _autoFill() {
        var dependencyValue = this.bid.relations.getDependencyValue(this.config.dependencies.auto_a);

        if (dependencyValue && this._data.value != dependencyValue) {
            this._data.value = dependencyValue;
            this.config.is_auto_selected = true;
            console.log("auto fill", this);

            this.dirty();
            this.emit("updated");
        }
    }

    _autoSelect() {
        var expression = this.config.auto_populate.expression_type;
        var rowValues = this.bid.relations.getDatatableColumnRows(
            this.config.dependencies.datatable.bid_entity_id,
            this.config.auto_populate.column_id
        );
        rowValues = _.map(rowValues, function(el) {
            return {
                id: el.id,
                value: Helpers.confirmNumber(el.value)
            };
        });
        var dependencyValueA = this.bid.relations.getDependencyValue(this.config.dependencies.auto_a);
        var dependencyValueB =
            expression === "between" ? this.bid.relations.getDependencyValue(this.config.dependencies.auto_b) : null;
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
        if (results.length === 0 && this._data.value != "") {
            this._data.value = "";
            isChanged = true;
        } else if (results.length === 1 || results[0].value != results[1].value) {
            if (this._data.value != results[0].id) {
                this._data.value = results[0].id;
                isChanged = true;
            }
        } else if (this._data.value != "") {
            this._data.value = "";
            isChanged = true;
        }

        if (isChanged) {
            console.log("auto selected", this);
            this.emit("updated");
            this.config.is_auto_selected = true;
            this.dirty();
        }
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
