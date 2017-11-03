export default class FieldScaffolding {
    /**
     * Gererates a default field data object.
     * 
     * @static
     * @param {number} bidId 
     * @param {string} [title=New Field] 
     * @param {string} [type=number]
     * @returns {object}
     */
    static create(bidId, title, type) {
        return {
            title: title ? title : "New Field",
            bid_id: bidId,
            value: null,
            actual_value: null,
            type: "field",
            config: {
                type: type ? type : "number",
                is_auto_selected: false,
                assembly_id: null,
                dependencies: {},
                datatable: [],
                definition_id: null
            }
        };
    }
}
