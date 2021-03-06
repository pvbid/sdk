import _ from "lodash";
import BidEntity from "./BidEntity";
import Helpers from "../utils/Helpers";
import { setAssembly, getAssembly } from "./services/BidEntityAssemblyService";

/**
 * Metric Class
 *
 * @export
 * @class Metric
 * @memberof module:PVBid/Core
 * @extends {BidEntity}
 */
export default class Metric extends BidEntity {
    /**
     * Creates an instance of Metric.
     * @param {object} metricData
     * @param {Bid} bid
     */
    constructor(metricData, bid) {
        super();
        /**
         * Reference to the bid that the metric belongs to.
         * @type {Bid}
         */
        this.bid = bid;
        this._data = metricData;
        this._original = _.cloneDeep(metricData);
    }

    /**
     * @type {number}
     */
    get value() {
        return this._data.value;
    }

    /**
     * @type {number}
     */
    set value(val) {
        if (Helpers.isNumber(val) && Helpers.confirmNumber(val) != this._data.value && !this.bid.isReadOnly()) {
            this.config.override = true;
            this._data.value = Helpers.confirmNumber(val);
            this.config.has_null_dependency = false;
            this.dirty();
            this.emit("updated");
        }
    }

    /**
     * @type {number}
     */
    get actualValue() {
        return this._data.actual_value;
    }

    /**
     * @type {number}
     */
    set actualValue(val) {
        if (Helpers.confirmNumber(val, false) && !this.bid.isReadOnly()) {
            this._data.actual_value = val;
            this.dirty();
        }
    }

    /**
     * @type {object}
     */
    get config() {
        return this._data.config;
    }

    /**
     * Gets the metrics's definition id.
     *
     * @type {number}
     * @deprecated Definition ids will become obsolete in planned data structure upgrade.
     */
    get definitionId() {
        return this._data.definition_id;
    }

    _getBaseValue() {
        let valueMap = {};
        let baseValue = 0;

        if (!_.isUndefined(this.config.formula)) {
            const formulaVariables = Helpers.parseFormulaArguments(this.config.formula);
            formulaVariables.forEach(variable => {
                const dependencyContract = this.config.dependencies[variable];
                const dependencyValue = this._evaluateDependency(dependencyContract);
                valueMap[variable] = Helpers.confirmNumber(dependencyValue, 0)
            });

            const results = Helpers.calculateFormula(this.config.formula, valueMap);
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
        let valueMap = { original: baseValue };
        let manipulatedValue = baseValue;

        if (!_.isUndefined(metricManipulation.formula)) {
            const formulaVariables = Helpers.parseFormulaArguments(metricManipulation.formula);
            formulaVariables.forEach(variable => {
                if (variable.toLowerCase() !== 'original') {
                    const dependencyContract = metricManipulation.dependencies[variable];
                    const dependencyValue = this._evaluateDependency(dependencyContract);
                    valueMap[variable] = Helpers.confirmNumber(dependencyValue, 0);
                }
            });

            const results = Helpers.calculateFormula(metricManipulation.formula, valueMap);
            manipulatedValue = Helpers.confirmNumber(results);
        }

        return manipulatedValue;
    }

    /**
     * Evaluates the dependency contract and tracks if a null evaluation was encountered
     *
     * @param {object} dependencyContract Dependency Contract to evaluate
     * @return {number|null|undefined}
     */
    _evaluateDependency(dependencyContract) {
        const dependencyValue = this.bid.entities.getDependencyValue(dependencyContract);

        const isNullDependency = _.isNil(dependencyValue) || !this.bid.entities.isDependencyFullyDefined(dependencyContract);
        this._nullDependencyCount += isNullDependency ? 1 : 0;

        return dependencyValue;
    }

    /**
     * Determines if the metric has any null dependencies
     */
    hasNullDependency() {
        return this.config.has_null_dependency;
    }

    /**
     * Resets the metric, removing any override value.
     */
    reset() {
        if (this.bid.isAssessable()) {
            this.dirty();
            this.config.override = false;
            this.assess();
        }
    }

    /**
     * Gets an array of bid entities that the metric relies on.
     *
     * @returns {BidEntity[]}
     */
    dependencies() {
        let contracts = [];
        let dependencies = [];

        contracts = contracts.concat(Object.values(this.config.dependencies));

        if (!_.isUndefined(this.config.manipulations)) {
            for (let manipulation of Object.values(this.config.manipulations)) {
                contracts = contracts.concat(Object.values(manipulation.dependencies));
            }
        }

        _.each(contracts, ctrct => {
            const dependency = this.bid.entities.getDependency(ctrct);
            if (dependency) {
                dependencies.push(dependency);
            }
        });

        return dependencies;
    }

    /**
     * Gets an array of bid entities that rely on the metric
     *
     * @returns {BidEntity[]}
     */
    dependants() {
        return this.bid.entities.getDependants("metric", this.id);
    }

    /**
     * Get the metric assembly if it has one
     *
     * @return {Assembly|undefined}
     */
    getAssembly() {
        return getAssembly(this);
    }

    /**
     * Adds the metric to an assembly.
     *
     * @param {Assembly|string} assembly The assembly entity or an assembly ref id
     * @return {Assembly} the new assembly setting
     */
    setAssembly(assembly) {
        if (!assembly) throw new Error('Assembly reference was not provided.');
        setAssembly(this, assembly);
        this.dirty();
        return this.getAssembly();
    }

    /**
     * Removes any assembly reference from the metric.
     *
     * @return {void}
     */
    unsetAssembly() {
        setAssembly(this, null);
        this.dirty();
    }

    /**
     * Assess metric for changes.
     *
     * @emits {assessing} fires event before assessement.
     * @emits {assessed} fires after assessment is complete.
     * @emits {updated} fires only if there has been a change.
     */
    assess() {
        if (this.bid.isAssessable()) {
            if (!this.config.override) {
                let isChanged = false;

                this._nullDependencyCount = 0;
                
                let baseValue = this._getBaseValue();
                let finalValue = this._calculateMetricManipulations(baseValue);

                if (_.round(this._data.value, 4) !== _.round(finalValue, 4)) {
                    this._data.value = _.round(finalValue, 7);
                    isChanged = true;
                }

                const hasNullDependency = this._nullDependencyCount > 0;
                if (this.config.has_null_dependency !== hasNullDependency) {
                    this._data.config.has_null_dependency = hasNullDependency;
                    isChanged = true;
                }

                if (isChanged) {
                    this.dirty();
                    this.emit("updated");
                }
            }

            this.emit("assessed");
        }
    }

    /**
     * Binds the "updated" event for all dependant bid entities.
     */
    bind() {
        for (let dependencyContract of Object.values(this.config.dependencies)) {
            if (!_.isEmpty(dependencyContract)) {
                const dependency = this.bid.entities.getDependency(dependencyContract);
                if (dependency) {
                    dependency.on("updated", "metric." + this.id, (requesterId, self) => this.assess(self));
                } else {
                    console.log("m dep", dependencyContract);
                }
            }
        }

        if (!_.isUndefined(this.config.manipulations)) {
            for (let manipulation of Object.values(this.config.manipulations)) {
                for (let manipulationDepCtrct of Object.values(manipulation.dependencies)) {
                    if (!_.isEmpty(manipulationDepCtrct)) {
                        const dependency = this.bid.entities.getDependency(manipulationDepCtrct);
                        if (dependency) {
                            dependency.on("updated", "metric-contract." + this.id, (requesterId, self) =>
                                this.assess(self)
                            );
                        }
                    }
                }
            }
        }
    }

    /**
     * Determines if metric instance is dirty.
     *
     * @returns {boolean}
     */
    isDirty() {
        return this._is_dirty || !_.isEqual(this._data.config, this._original.config);
    }

    /**
     * Flags the metric and corresponding bid as dirty and to be saved.
     */
    dirty() {
        this.bid.dirty();
        super.dirty();
    }

    /**
     * Exports intermal metric data.
     *
     * @param {boolean} [alwaysIncludeConfig=false] Will include config object in export regardless of changed status.
     * @returns {object}
     */
    exportData(alwaysIncludeConfig=false) {
        let blacklist = [];

        if (!alwaysIncludeConfig && _.isEqual(this._data.config, this._original.config)) {
            blacklist.push("config");
        }
        let data = _.cloneDeep(_.omit(this._data, blacklist));

        return data;
    }
}
