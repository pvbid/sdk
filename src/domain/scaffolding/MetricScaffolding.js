export default class MetricScaffolding {
    /**
     * Gererates a default metric data object.
     * 
     * @static
     * @param {number} bidId 
     * @param {string} [title=New Metric] 
     * @returns {object}
     */
    static create(bidId, title) {
        return {
            title: title ? title : "New Metric",
            bid_id: bidId,
            value: 0,
            actual_value: null,
            type: "metric",
            config: {
                manipulations: [],
                assembly_id: null,
                dependencies: {},
                formula: "0",
                definition_id: null
            }
        };
    }
}
