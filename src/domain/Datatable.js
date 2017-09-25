import _ from "lodash";
import BidEntity from "./BidEntity";

/**
 * Datatable Class
 * @class Datatable
 */
export default class Datatable extends BidEntity {
    /**
     * Creates an instance of Datatable.
     * @param {object} datatableData 
     * @param {Bid} bid 
     */
    constructor(datatableData, bid) {
        super();
        /**
         * Reference to the bid that the datatable belongs to.
         * @type {Bid}
         */
        this.bid = bid;

        /**
         * Internal data store for the bid entity.
         * @type {object}
         */
        this._data = datatableData;

        this._original = _.cloneDeep(datatableData);
    }

    /**
     * Gets the datatables's definition id.
     * 
     * @type {number}
     * @deprecated Definition ids will become obsolete in planned data structure upgrade.
     */
    get definitionId() {
        return this._data.definition_id;
    }

    /**
     * Gets the configuration information for the bid entity.
     * 
     * @type {object}
     */
    get config() {
        return this._data.config;
    }

    /**
     * Returns an array of the datatable row options based on the datatable key columns.
     * 
     * @returns  {object[]}
     * @property {string} title - The human readable title for the row.
     * @property {string} row_id - Contains the row id.
     */
    getOptions() {
        var keyPlacement = 0;

        this.config.columns.forEach(column => {
            if (column.is_key) keyPlacement++;
        });

        var options = this.config.rows.map(row => {
            var title = row.values[0];

            for (var i = 1; i < keyPlacement; i++) {
                title += " | " + row.values[i];
            }

            return {
                title: title,
                row_id: row.id
            };
        });

        return options;
    }

    dependants() {
        return this.bid.entities.getDependants("datatable", this.id);
    }

    /**
     * Determines if the datatable is has changed for it's original data.
     * 
     * @returns {boolean} 
     */
    isDirty() {
        return this._is_dirty || !_.isEqual(this._data.config, this._original.config);
    }

    /**
     * Exports datatable to core structure.
     */

    exportData() {
        let data = _.cloneDeep(this._data);
        if (_.isEqual(data.config, this._original.config)) delete data.config;

        return data;
    }
}
