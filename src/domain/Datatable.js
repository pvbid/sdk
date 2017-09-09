import BidEntity from "./BidEntity";

/**
 * Datatable Class
 * 
 * @export
 * @class Datatable
 * @memberof module:PVBid/Domain
 * @extends {module:PVBid/Domain.BidEntity}
 */
export default class Datatable extends BidEntity {
    constructor(datatableData, bid) {
        super();
        this.bid = bid;
        this._data = datatableData;
    }

    get config() {
        return this._data.config;
    }
    set config(val) {
        throw "Setting datatable config is not permitted.";
    }

    getOptions() {
        var keyPlacement = 0;
        this.config.columns.forEach(column => {
            if (column.is_key) keyPlacement++;
        });

        var options = this.config.rows.map((row, index) => {
            var title = row.values[0];

            for (var i = 1; i < keyPlacement; i++) {
                title += " | " + row.values[i];
            }

            return {
                title: title,
                value: row.id
            };
        });

        return options;
    }
}
