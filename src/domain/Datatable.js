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

        this._partValuesCache = {}; // cache of the values of linked part rows by id

        this._setLinkedColumns();
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
     * Columns including any linked inventory data
     *
     * @type {object}
     */
    get columns() {
        return this.config.columns.concat(this._linkedColumns);
    }

    /**
     * Rows including any linked inventory data
     *
     * @type {object}
     */
    get rows() {
        if (!this._pvlinkColumnIndex) {
            return this.config.rows;
        }

        return this.config.rows.map(row => {
            const linkedPart = row.values[this._pvlinkColumnIndex]._id ? row.values[this._pvlinkColumnIndex] : null;
            const linkedValues = this._getLinkedValues(linkedPart);

            const newValues = row.values.concat(linkedValues);
            newValues[this._pvlinkColumnIndex] = linkedPart ? linkedPart._id : "";

            return { id: row.id, values: newValues };
        });
    }

    /**
     * Currently linked inventory type
     *
     * @type {string|null}
     */
    get inventoryLink() {
        return this._data.inventory_link
            ? this._data.inventory_link
            : null; 
    }

    /**
     * Returns an array of the datatable row options based on the datatable key column.
     * 
     * @returns  {object[]}
     * @property {string} title - The human readable title for the row. The title is from the key column.
     * @property {string} row_id - Contains the row id.
     */
    getOptions() {
        const options = this.config.rows.map(row => {
            let titleIndex = this.config.columns.findIndex(col => col.is_key);
            if (titleIndex < 0) titleIndex = 0;

            return {
                title: row.values[titleIndex],
                row_id: row.id
            };
        });

        return options;
    }

    /**
     * Gets a list of bid entities that relies on the datatable instance.
     * 
     * @returns {BidEntity[]} 
     */
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
     * Flags the datatable and corresponding bid as dirty and to be saved.
     */
    dirty() {
        this.bid.dirty();
        super.dirty();
    }

    /**
     * Retrieves a cell value.
     * 
     * @param {string} columnId
     * @param {string} rowId 
     * @returns {?(string|number|boolean)}
     */
    getValue(columnId, rowId) {
        if (!columnId || !rowId) return null;

        const row = this.rows.find(r => r.id === rowId);
        if (!row) return null;

        const columnIndex = this.columns.findIndex(c => c.id === columnId);
        if (columnIndex < 0) return null;

        return row.values[columnIndex];
    }

    /**
     * Gets a list of column values.
     * 
     * @param {string} columnId 
     * @returns {object[]}
     * @property {string} id - The row id for the value.
     * @property {?(string|number|boolean)} value
     */
    getColumnValues(columnId) {
        var columnIndex = this.columns.findIndex(c => c.id === columnId);

        let options = this.rows.map(row => {
            return { id: row.id, value: row.values[columnIndex] };
        });

        return options;
    }

    /**
     * Find the first row in the datatable which has the given vendor part linked.
     *
     * @param {string} vendorName
     * @param {string|number} vendorPartId
     * @return {string|undefined} The row ID of the row containing the matching part. Undefined if none found.
     */
    findRowByExternalPartId(vendorName, vendorPartId) {
        if (!this._pvlinkColumnIndex || !vendorName || !vendorPartId) return undefined;

        const row = this.config.rows.find(r => {
            const partData = r.values[this._pvlinkColumnIndex]; 
            if (!(
                partData &&
                partData.external_sources &&
                partData.external_sources[vendorName]
            )) return false;

            return partData.external_sources[vendorName].ids
                .map(id => id.toString())
                .includes(vendorPartId.toString());
        });

        return row ? row.id : undefined;
    }

    /**
     * Reload the datatable. Should be done any time an inventory link ID is updated.
     *
     * @return {Promise<void>}
     */
    async reload() {
        const datatableData = await this.bid._bidService.repositories.datatables.save(this.bid.id, this.exportData());
        if (datatableData) {
            this._data = datatableData;
            this._original = _.cloneDeep(datatableData);
            this._partValuesCache = {};
            this._setLinkedColumns();
        }
    }

    /**
     * Generate the rows associated with the part
     *
     * @param {object|null} part
     * @return {string[]}
     */
    _getLinkedValues(part) {
        const cacheKey = part ? part._id : `empty-${this.inventoryLink}`;
        if (this._partValuesCache[cacheKey]) {
            return this._partValuesCache[cacheKey];
        }

        const linkedValues = this._linkedColumns.map(col =>
            part && part[col.id.substr(7)] ? part[col.id.substr(7)].toString() : "");

        return this._cachePartValues(cacheKey, linkedValues);
    }

    /**
     * Cache the part value row by part id
     *
     * @param {string} key Cache key (usually the Part ID)
     * @param {string[]} values stuff to put in cache
     * @return {string[]} values
     */
    _cachePartValues(key, values) {
        this._partValuesCache[key] = values;
        return values;
    }

    /**
     * Initialize the datatable with info about linked inventory data if applicable
     */
    _setLinkedColumns() {
        const linkColumnIndex = this.config.columns.findIndex((col) => col.id === "pvbid_inventory_item_id");
        this._pvlinkColumnIndex = linkColumnIndex < 0 ? null : linkColumnIndex;

        this._linkedColumns = this._data.part_type_properties
            ? Object.keys(this._data.part_type_properties).map(key => ({
                is_key: false,
                title: `${this._data.part_type_properties[key]} (pvbid)`,
                type: "string",
                id: `pvlink_${key}`,
            }))
            : [];
    }

    /**
     * Exports datatable to core structure.
     *
     * @param {boolean} [alwaysIncludeConfig=false] Will include config object in export regardless of changed status.
     * @returns {object}
     */
    exportData(alwaysIncludeConfig=false) {
        let data = _.cloneDeep(this._data);
        if (!alwaysIncludeConfig && _.isEqual(data.config, this._original.config)) delete data.config;

        return data;
    }
}
