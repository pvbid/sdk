import _ from "lodash";
import BidEntity from "./BidEntity";
import Helpers from "../Helpers";

/**
 * Metric Class
 * 
 * @export
 * @class Metric
 * @memberof module:PVBid/Domain
 * @extends {module:PVBid/Domain.BidEntity}
 */
export default class Metric extends BidEntity {
    /**
     * Creates an instance of Metric.
     * @param {object} metricData 
     * @param {module:PVBid/Domain.Bid} bid 
     */
    constructor(metricData, bid) {
        super();
        this.bid = bid;
        this._data = metricData;
        this._original = Object.assign({}, metricData);
    }

    get value() {
        return this._data.value;
    }
    set value(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.value) {
            this.config.override = true;
            this._data.value = Helpers.confirmNumber(val);
            this.dirty();
            this.emit("updated");
        }
    }

    get actualValue() {
        return this._data.actual_value;
    }
    set actualValue(val) {
        if (Helpers.confirmNumber(val, false)) {
            this._data.actual_value = val;
            this.dirty();
        }
    }

    get config() {
        return this._data.config;
    }
    set config(val) {
        throw "Setting metric config is not permitted.";
    }

    get definitionId() {
        return this._data.definition_id;
    }

    _getBaseValue() {
        var valueMap = {},
            baseValue = 0;

        if (!_.isUndefined(this.config.formula)) {
            _.each(this.config.dependencies, (dependencyContract, key) => {
                valueMap[key] = Helpers.confirmNumber(this.bid.relations.getDependencyValue(dependencyContract), 0);
            });

            var results = Helpers.calculateFormula(this.config.formula, valueMap);
            baseValue = Helpers.confirmNumber(results);
        }
        return baseValue;
    }

    _calculateMetricManipulations(baseValue) {
        var manipulatedValue = 0;
        if (!_.isUndefined(this.config.manipulations) && this.config.manipulations.length > 0) {
            _.each(this.config.manipulations, metricManipulation => {
                baseValue = manipulatedValue = this._calculateMetricManipulation(metricManipulation, baseValue);
            });
        } else manipulatedValue = baseValue;

        return Helpers.confirmNumber(manipulatedValue);
    }

    _calculateMetricManipulation(metricManipulation, baseValue) {
        var valueMap = {
                original: baseValue
            },
            manipulatedValue = baseValue;

        if (!_.isUndefined(metricManipulation.formula)) {
            _.each(metricManipulation.dependencies, (dependencyContract, key) => {
                valueMap[key] = Helpers.confirmNumber(this.bid.relations.getDependencyValue(dependencyContract), 0);
            });

            var results = Helpers.calculateFormula(metricManipulation.formula, valueMap);
            manipulatedValue = Helpers.confirmNumber(results);
        }

        return manipulatedValue;
    }
    reset() {
        this.is_dirty = true;
        this.config.override = false;

        this.assess();
    }

    compare() {
        console.log("Metric Compare: ", this._original.value, this._data.value);
    }

    assess() {
        if (!this.config.override) {
            var baseValue = 0,
                finalValue = 0;

            baseValue = this._getBaseValue();
            finalValue = this._calculateMetricManipulations(baseValue);

            var metricValue = this._data.value ? this._data.value : 0;

            if (metricValue.toFixed(7) !== finalValue.toFixed(7)) {
                this._data.value = finalValue;
                this.is_dirty = true;

                this.emit("updated");
            }
        }

        this.emit("assessed");
    }

    bind() {
        for (let dependencyContract of Object.values(this.config.dependencies)) {
            if (!_.isEmpty(dependencyContract)) {
                const dependency = this.bid.relations.getDependency(dependencyContract);
                if (dependency && dependency.on) {
                    dependency.on("updated", "metric." + this.id, () => this.assess());
                } else {
                    console.log("m dep", dependencyContract);
                }
            }
        }

        if (!_.isUndefined(this.config.manipulations)) {
            for (let manipulation of Object.values(this.config.manipulations)) {
                for (let manipulationDepCtrct of Object.values(manipulation.dependencies)) {
                    if (!_.isEmpty(manipulationDepCtrct)) {
                        const dependency = this.bid.relations.getDependency(manipulationDepCtrct);
                        dependency.on("updated", "metric-contract." + this.id, () => this.assess());
                    }
                }
            }
        }
    }
}
