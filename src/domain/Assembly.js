import BidEntity from "./BidEntity";
import _ from "lodash";

/**
 * Assembly Class
 */
export default class Assembly extends BidEntity {
    /**
     * Creates an instance of Assembly.
     * @param {object} assemblyData 
     * @param {Bid} bid 
     */
    constructor(assemblyData, bid) {
        super();
        /**
         * Reference to the bid that the assembly belongs to.
         * @type {Bid}
         */
        this.bid = bid;
        this._data = assemblyData;
        this._fieldIdsKeyedByAnchor = this._keyFieldIdsByAnchor();
    }

    /**
     * Removes a bid entity from the assembly.
     * 
     * @param {string} type 
     * @param {(number|string)} id 
     */
    removeBidEntity(type, id) {
        const typeKey = type + "s";
        _.pull(this._data.config[typeKey], id);

        if (type === "field") {
            this._fieldIdsKeyedByAnchor = this._keyFieldIdsByAnchor();
        }

        this.dirty();
    }

    /**
     * Find a field by its anchor value. Returns undefined if a match is not found.
     *
     * @param {string} anchor
     * @return {Field|undefined}
     */
    getFieldByAnchor(anchor) {
        const fieldId = this._fieldIdsKeyedByAnchor[anchor];
        if (!fieldId) return undefined;
        return this.bid.entities.fields(fieldId);
    }

    /**
     * Get the fields that have anchors keyed by their anchors
     *
     * @return {object} Field IDs keyed by anchor value
     */
    _keyFieldIdsByAnchor() {
        if (!this._data.config.fields) return {};

        const anchorMap = {};
        this._data.config.fields.forEach(id => {
            const field = this.bid.entities.fields(id);
            if (field && field.anchor) {
                anchorMap[field.anchor] = id;
            }
        });
        return anchorMap;
    }

    /**
     * @type {object}
     */
    get config() {
        return this._data.config;
    }

    /**
     * @type {number}
     */
    get definitionId() {
        return this._data.definition_id;
    }

    /**
     * Flags the assembly and corresponding bid as dirty and to be saved.
     */
    dirty() {
        this.bid.dirty();
        super.dirty();
    }
}
