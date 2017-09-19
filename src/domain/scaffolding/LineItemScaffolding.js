export default class LineItemScaffolding {
    /**
     * Gererates a default line item data object.
     * 
     * @static
     * @param {number} bidId 
     * @param {string} [title=New Line Item] 
     * @returns {object}
     */
    static create(bidId, title) {
        return {
            title: title ? title : "New Line Item",
            bid_id: bidId,
            is_included: true,
            is_active: true,
            cost: 0,
            price: 0,
            taxable_cost: 0,
            labor_hours: 0,
            tax: 0,
            tax_percet: 0,
            markup: 0,
            markup_percent: 0,
            quantity: 0,
            per_quantity: 0,
            multiplier: 1,
            wage: 0,
            burden: 0,
            base: 0,
            escalator: 1,
            type: "line_item",
            config: {
                description: "",
                rule_inclusion: "any",
                rules: [
                    {
                        type: "always_include",
                        title: "Always Include"
                    }
                ],
                base: 0,
                type: "dollar",
                per_quantity: {
                    type: "value",
                    value: 0
                },
                quantity: {
                    type: "value",
                    value: 0
                },
                dependencies: {
                    scalar: {},
                    quantity: {},
                    per_quantity: {},
                    wage: {
                        bid_entity_id: "bid_variable",
                        type: "bid_variable",
                        field: "wage"
                    },
                    burden: {
                        bid_entity_id: "bid_variable",
                        type: "bid_variable",
                        field: "burden"
                    },
                    escalator: {
                        bid_entity_id: "bid_variable",
                        type: "bid_variable",
                        field: "escalator"
                    },
                    tax: {
                        bid_entity_id: "bid_variable",
                        type: "bid_variable",
                        field: "tax"
                    },
                    markup: {
                        bid_entity_id: "bid_variable",
                        type: "bid_variable",
                        field: "markup"
                    }
                },
                formula: "1",
                definition_id: null
            }
        };
    }
}
