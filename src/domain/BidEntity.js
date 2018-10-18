import _ from "lodash";
import AdvanceEventEmitter from "../utils/AdvanceEventEmitter";

/**
 * A base class for all other bid entities to extend.
 * 
 * @class BidEntity
 */
export default class BidEntity extends AdvanceEventEmitter {
    constructor() {
        super();

        /**
         * Internal data store for the bid entity.
         * @type {object}
         */
        this._data = {};

        this.on("assessed", "self", () =>
            this._waitForFinalEvent(
                () => {
                    // console.log("clearing", this.type);
                    this._eventTree = {};
                },
                500,
                "self.clear"
            )
        );
    }

    /**
     * Gets the id of the bid entity.
     * NOTE: Esculding Projects, all bid entity id's will soon be in UUID format
     * 
     * @type {number}
     */
    get id() {
        return this._data.id;
    }

    /**
     * Gets the bid entity title.
     * 
     * @type {string}
     */
    get title() {
        return this._data.title;
    }

    /**
     * Sets the bid entity title. Flags bid entity as dirty.
     * 
     * @type {string}
     */
    set title(val) {
        this._data.title = val;
        this.dirty();
    }

    /**
     * Gets the bid entity type.
     * 
     * @type {string}
     */
    get type() {
        return this._data.type;
    }

    /**
     * Determines of bid entity is dirty.
     * 
     * @returns {boolean} 
     */
    isDirty() {
        return this._is_dirty;
    }

    /**
     * Flags the bid entity as dirty and to be saved.
     */
    dirty() {
        this._is_dirty = true;
        try {
            this.emit("changed");
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Marks the bid entity as clean.
     */
    pristine() {
        if (this._is_dirty) {
            this._is_dirty = false;
        }
    }

    /**
     * Exports the internal data for the bid entity.
     * @returns {object}
     */
    exportData() {
        return _.cloneDeep(this._data);
    }

    /**
     * Gets all the dependencies that the bid entity relies on.
     * 
     * @returns {BidEntity[]} Returns an array of bid entities.
     */
    dependencies() {
        return [];
    }

    /**
     * Determines if bid entity relies on a null or undefined dependency value
     *
     * @param {string} [field] Field property if other than 'value'
     * @return {boolean}
     */
    hasNullDependency(field="value") {
        // ABSTRACT (implement in subclass where dependencies are used)
        return false;
    }

    /**
     * Check the prediction status of the dependant bid entity's properties.
     * Adds predicted properties to the given Set.
     * If a different property name is desired for the predicted set, an array can be given in
     *  place of a string where the 0 index is the property name on the bid entity and the
     *  1 index is the property name on this entity
     *
     * @param {BidEntity} bidEntity The contributing bid entity
     * @param {Set} predictedSet The current set of predicted values
     * @param {Array<string|string[]>} propsToCheck The properties of the bid entity to check the prediction status of
     */
    _applyPredictedDependencies(bidEntity, predictedSet, propsToCheck) {
        propsToCheck.forEach(property => {
            const [prop1, prop2] = Array.isArray(property) ? property : [property, property];
            if (bidEntity.isPredicted(prop1)) predictedSet.add(prop2);
        });
    }

    /**
     * Check the null dependency status of the dependant bid entity's properties.
     * Adds null dependant properties to the given Set.
     * If a different property name is desired for the Set, an array can be given in
     *  place of a string where the 0 index is the property name on the bid entity and the
     *  1 index is the property name on this entity
     *
     * @param {BidEntity} bidEntity The contributing bid entity
     * @param {Set} nullSet The current set of null dependant values
     * @param {Array<string|string[]>} propsToCheck The properties of the bid entity to check the null dependency status of
     */
    _applyNullDependencies(bidEntity, nullSet, propsToCheck) {
        propsToCheck.forEach(property => {
            const [prop1, prop2] = Array.isArray(property) ? property : [property, property];
            if (bidEntity.hasNullDependency(prop1)) nullSet.add(prop2);
        });
    }

    /**
     * Gets an array of depndants that rely on the bid entity.
     * 
     * @returns {BidEntity[]} Returns an array of bid entities.
     */
    dependants() {
        return [];
    }

    /**
     * Assesses bid entity. 
     * 
     * @emits {assessing} Fires as assessment begins.
     * @emits {assessed} Fires when bid entity assessement is completed
     * @emits {updated} Fires when the bid entity has changed.
     * @param {?BidEntity} dependency  - The calling dependency.
     * @abstract
     */
    assess(dependency) {
        throw "Must be implemented by subclass.";
    }
}
