import AdvanceEventEmitter from "../utils/AdvanceEventEmitter";

/**
 * A base class for all other bid entities to extend.
 * 
 * @class BidEntity
 * @extends {AdvanceEventEmitter}
 */
export default class BidEntity extends AdvanceEventEmitter {
    constructor() {
        super();
        this._data = {};
        this.is_dirty = false;

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
     * 
     * @readonly
     */
    get id() {
        return this._data.id;
    }

    /**
     * Getter and Setter of the bid entity title.
     * 
     */
    get title() {
        return this._data.title;
    }
    set title(val) {
        this._data.title = val;
        this.dirty();
    }

    /**
     * Gets the bid entity type.
     * 
     * @readonly
     */
    get type() {
        return this._data.type;
    }

    /**
     * Flags the bid entity as dirty and to be saved.
     * 
     */
    dirty() {
        this.is_dirty = true;
    }

    /**
     * Marks the bid entity as clean.
     * 
     */
    pristine() {
        this.is_dirty = false;
    }

    /**
     * Exports the internal data for the bid entity.
     * @returns {object}
     */
    exportData() {
        return Object.assign({}, this._data);
    }

    /**
     * Assess bid entity. 
     * 
     * @emits {assessing} Fires as assessment begins.
     * @emits {assessed} Fires when bid entity assessement is completed
     * @emits {updated} Fires when the bid entity has changed.
     * @abstract
     */
    assess() {
        throw "must be implemented by subclass";
    }
}
