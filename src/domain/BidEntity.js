import AdvanceEventEmitter from "../AdvanceEventEmitter";

/**
 * @module PVBid/Domain
 */

/**
 * A base class for all other bid entities to extend.
 * 
 * @export
 * @class BidEntity
 * @memberof module:PVBid/Domain
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
     * @instance
     * @memberof module:PVBid/Domain.BidEntity
     * @readonly
     */
    get id() {
        return this._data.id;
    }

    /**
     * Getter and Setter of the bid entity title.
     * 
     * @memberof module:PVBid/Domain.BidEntity
     * @instance
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
     * @memberof module:PVBid/Domain.BidEntity
     * @instance
     */
    get type() {
        return this._data.type;
    }

    /**
     * Flags the bid entity as dirty and to be saved.
     * 
     * @memberof module:PVBid/Domain.BidEntity
     * @instance
     */
    dirty() {
        this.is_dirty = true;
    }

    /**
     * Marks the bid entity as clean.
     * 
     * @memberof module:PVBid/Domain.BidEntity
     * @instance
     */
    pristine() {
        this.is_dirty = false;
    }

    /**
     * Exports the internal data for the bid entity.
     * @returns {object}
     * @memberof module:PVBid/Domain.BidEntity
     * @instance
     */
    exportData() {
        return Object.assign({}, this._data);
    }

    /**
     * Assess bid entity. 
     * 
     * @abstract
     * @memberof module:PVBid/Domain.BidEntity
     * @instance
     */
    assess() {
        /**
         * Fires as assessment begins.
         * 
         * @event module:PVBid/Domain.BidEntity#assessing 
         */

        /**
         * Fires when bid entity assessement is completed.
         * 
         * @event module:PVBid/Domain.BidEntity#assessed
         */

        /**
         * Fires when the bid entity has changed.
         * 
         * @event module:PVBid/Domain.BidEntity#updated
         */
        throw "must be implemented by subclass";
    }
}
