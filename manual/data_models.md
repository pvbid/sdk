# Data Models

### Project
```
{
    "id": 461,
    "account_id": 3,
    "title": "New Project",
    "cost": 1200,
    "taxable_cost": 0,
    "price": 1587,
    "tax_percent": 0,
    "markup_percent": 0,
    "margin_percent": 13.0435,
    "labor_cost": 0,
    "labor_hours": 0,
    "tax": 180,
    "markup": 207,
    "watts": 1350,
    "created_at": "2017-09-26T23:04:55+00:00",
    "updated_at": "2017-09-27T01:10:54+00:00",
    "project_status_id": 28,
    "closed_at": null,
    "reconciled_at": null,
    "actual_hours": null,
    "actual_cost": null,
    "project_status": {
        "id": 28,
        "account_id": 3,
        "title": "Open",
        "core_status": "open",
        "is_reserved": true,
        "is_won": false,
        "order_index": 0,
        "created_at": "2017-09-26T22:46:28+00:00",
        "updated_at": "2017-09-26T22:46:28+00:00"
    },
    "bids": [
        {
            "id": 190,
            "project_id": 461
        }
    ]
}
```

### Bid
```
{
    "id": 190,
    "account_id": 3,
    "user_id": 7,
    "title": "New Bid",
    "cost": 1200,
    "taxable_cost": 1200,
    "price": 1587,
    "tax_percent": 0,
    "markup_percent": 0,
    "margin_percent": 13.04,
    "tax": 180,
    "markup": 207,
    "variables": {
        "tax": {
            "type": "number",
            "title": "Tax Percent",
            "value": 15,
            "is_reserved": true
        },
        "wage": {
            "type": "number",
            "title": "Wage",
            "value": 35,
            "is_reserved": true
        },
        "burden": {
            "type": "number",
            "title": "Burden",
            "value": 5,
            "is_reserved": true
        },
        "labels": {
            "type": "list",
            "title": "Labels",
            "value": [
                {
                    "text": "Labor"
                },
                {
                    "text": "Materials"
                },
                {
                    "text": "Equipment"
                }
            ],
            "is_reserved": true
        },
        "markup": {
            "type": "number",
            "title": "Markup Percent",
            "value": 15,
            "is_reserved": true
        },
        "escalator": {
            "type": "number",
            "title": "Escalator",
            "value": 1,
            "is_reserved": true
        },
        "sub_margins": {
            "type": "input_list",
            "title": "Sub Margins",
            "value": [],
            "is_reserved": true
        },
        "markup_strategy": {
            "type": "boolean",
            "title": "Include Tax in Markup",
            "value": true,
            "is_reserved": true
        },
        "predictive_pricing": {
            "type": "boolean",
            "title": "Predictive Pricing Enabled",
            "value": false,
            "is_reserved": true
        },
        "use_computed": {
            "type": "boolean",
            "title": "Use computed values when available (Predictive Pricing)",
            "value": true,
            "is_reserved": true
        },

    },
    "system_version": 1,
    "definition_id": 0,
    "definition_version": 1,
    "created_at": "2017-09-26T23:04:55+00:00",
    "updated_at": "2017-09-27T01:10:54+00:00",
    "integrations": [],
    "config": {
        "predicted_values": [],
        "undefined_prop_flags": [],
    },
    "is_locked": false,
    "is_shell": false,
    "reconciled_at": null,
    "actual_hours": null,
    "actual_cost": null,
    "bid_status_id": null,
    "closed_at": null,
    "project_id": 461,
    "watts": 1350,
    "labor_hours": 0,
    "labor_cost": 0,
    "margin_of_error": 0,
    "is_active": true,
    "user": {
        "id": 7,
        "name": "Test User",
        "license": "estimator",
        "roles": [
            {
                "id": 2,
                "name": "admin",
                "display_name": "Admin",
                "description": "User is allowed to manage account wide settings, bids, and definitions.",
                "created_at": "2017-09-12 18:13:37",
                "updated_at": "2017-09-12 18:13:37",
                "pivot": {
                    "user_id": 7,
                    "role_id": 2
                }
            },
            {
                "id": 4,
                "name": "estimator",
                "display_name": "Estimator",
                "description": "User is allowed to create and edit bids with advance estimating tools.",
                "created_at": "2017-09-12 18:13:37",
                "updated_at": "2017-09-12 18:13:37",
                "pivot": {
                    "user_id": 7,
                    "role_id": 4
                }
            }
        ]
    }
}
```

### Line Item

```
{
    "id": 49661,
    "bid_id": 190,
    "account_id": 3,
    "title": "General Line Item",
    "is_active": true,
    "is_included": true,
    "config": {
        "comments": [],
        "order_index": 0,
        "assembly_id": null,
        "type": "dollar",
        "quantity": {
            "type": "value",
            "value": 0
        },
        "per_quantity": {
            "type": "value",
            "value": 0
        },
        "base": 0,
        "formula": "1",
        "is_predicted_cost": false,
        "is_predicted_labor_hours": false,
        "dependencies": {
            "tax": {
                "type": "bid_variable",
                "field": "tax",
                "bid_entity_id": "bid_variable"
            },
            "wage": {
                "type": "bid_variable",
                "field": "wage",
                "bid_entity_id": "bid_variable"
            },
            "burden": {
                "type": "bid_variable",
                "field": "burden",
                "bid_entity_id": "bid_variable"
            },
            "markup": {
                "type": "bid_variable",
                "field": "markup",
                "bid_entity_id": "bid_variable"
            },
            "scalar": [],
            "quantity": [],
            "escalator": {
                "type": "bid_variable",
                "field": "escalator",
                "bid_entity_id": "bid_variable"
            },
            "per_quantity": []
        },
        "rules": [
            {
                "type": "always_include",
                "title": "Always Include"
            }
        ],
        "undefined_prop_flags": [],
        "rule_inclusion": "any",
        "overrides": {},
        "short_code": "line:general_line_item",
        "description": ""
    },
    "cost": 0,
    "taxable_cost": 0,
    "price": 0,
    "tax": 0,
    "tax_percent": 15,
    "markup": 0,
    "markup_percent": 15,
    "quantity": 0,
    "per_quantity": 0,
    "multiplier": 1,
    "burden": 5,
    "wage": 35,
    "base": 0,
    "escalator": 1,
    "labor_hours": 0,
    "actual_cost": null,
    "acutal_hours": null,
    "definition_id": 1577,
    "definition_version": 2,
    "type": "line_item",
    "created_at": "2017-09-26 23:04:55",
    "updated_at": "2017-09-27 01:10:55"
}
```

### Field
```
{
    "id": 18262,
    "account_id": 3,
    "bid_id": 190,
    "title": "Module Type",
    "value": "mhzk",
    "is_active": true,
    "config": {
        "type": "list",
        "constraint": "Whole",
        "short_code": "field:module_type",
        "description": "",
        "dependencies": {
            "auto_a": {
                "type": null,
                "field": null
            },
            "datatable": {
                "type": "datatable",
                "field": null,
                "bid_entity_id": 7580
            }
        },
        "has_null_dependency": false,
        "is_auto_selected": false
    },
    "definition_id": 903,
    "definition_version": 2,
    "created_at": "2017-09-26T23:04:55+00:00",
    "updated_at": "2017-09-27T01:10:55+00:00",
    "actual_value": null,
    "type": "field"
}
```

### Metric

```
{
    "id": 36093,
    "account_id": 3,
    "bid_id": 190,
    "title": "Watts",
    "value": 1350,
    "config": {
        "formula": "a*b",
        "short_code": "metric:watts",
        "dependencies": {
            "a": {
                "type": "field",
                "field": "clpa",
                "bid_entity_id": 18262
            },
            "b": {
                "type": "field",
                "field": "value",
                "bid_entity_id": 18263
            }
        }
    },
    "definition_id": 840,
    "definition_version": 9,
    "created_at": "2017-09-26T23:04:55+00:00",
    "updated_at": "2017-09-27T01:10:55+00:00",
    "has_null_dependency": false,
    "actual_value": null,
    "is_active": true,
    "type": "metric"
}
```

### Datatable

```
 {
    "id": 7580,
    "account_id": 3,
    "bid_id": 190,
    "title": "Modules",
    "config": {
        "rows": [
            {
                "id": "mhzk",
                "values": ["Module 1", "400.00", "450"],
                "$$hashKey": "object:527"
            },
            {
                "id": "be6f",
                "values": ["Module 2", "300.00", "250"],
                "$$hashKey": "object:528"
            }
        ],
        "columns": [
            {
                "id": "at57",
                "type": "string",
                "title": "Module",
                "is_key": true,
                "$$hashKey": "object:521"
            },
            {
                "id": "tp7q",
                "type": "string",
                "title": "Unit Price",
                "is_key": false,
                "$$hashKey": "object:522"
            },
            {
                "id": "clpa",
                "type": "string",
                "title": "Watts",
                "is_key": false,
                "$$hashKey": "object:523"
            }
        ]
    },
    "definition_id": 266,
    "definition_version": 3,
    "created_at": "2017-09-26T23:04:55+00:00",
    "updated_at": "2017-09-27T01:10:55+00:00",
    "is_active": 1,
    "type": "datatable"
}
```
### Component
```
{
    "id": 62470,
    "bid_id": 190,
    "account_id": 3,
    "title": "Modules",
    "is_active": true,
    "config": {
        "is_nested": false,
        "components": [],
        "line_items": [49665],
        "component_group_id": 813,
        "parent_component_id": null,
        "comments": [],
        "description": null,
        "order_index": 0,
        "undefined_prop_flags": [],
        "predicted_values": [],
        "short_code": "component:modules"
    },
    "properties": {
        "base": {
            "value": 0,
            "config": {
                "data_type": "number"
            }
        },
        "wage": {
            "value": 35,
            "config": {
                "data_type": "number"
            }
        },
        "burden": {
            "value": 5,
            "config": {
                "data_type": "number"
            }
        },
        "base_avg": {
            "value": 0,
            "config": {
                "data_type": "number"
            }
        },
        "quantity": {
            "value": 3,
            "config": {
                "data_type": "number"
            }
        },
        "wage_avg": {
            "value": 0,
            "config": {
                "data_type": "number"
            }
        },
        "burden_avg": {
            "value": 0,
            "config": {
                "data_type": "number"
            }
        },
        "per_quantity": {
            "value": 400,
            "config": {
                "data_type": "number"
            }
        },
        "quantity_avg": {
            "value": 3,
            "config": {
                "data_type": "number"
            }
        },
        "included_count": {
            "value": 1,
            "config": {
                "data_type": "number"
            }
        },
        "per_quantity_avg": {
            "value": 400,
            "config": {
                "data_type": "number"
            }
        },
        "included_labor_count": {
            "value": 0,
            "config": {
                "data_type": "number"
            }
        }
    },
    "cost": 1200,
    "taxable_cost": 1200,
    "price": 1587,
    "tax_percent": 15,
    "markup_percent": 15,
    "tax": 180,
    "markup": 207,
    "labor_hours": 0,
    "labor_cost": 0,
    "non_labor_cost": 1200,
    "actual_hours": null,
    "actual_cost": null,
    "definition_id": 1726,
    "definition_version": 3,
    "type": "component",
    "created_at": "2017-09-26 23:04:55",
    "updated_at": "2017-09-27 01:10:55"
}
```
### Component Group

```
 {
    "id": 813,
    "account_id": 3,
    "bid_id": 190,
    "title": "Cost Codes",
    "config": [],
    "definition_id": 43,
    "definition_version": 2,
    "created_at": "2017-09-26T23:04:55+00:00",
    "updated_at": "2017-09-26T23:04:55+00:00",
    "is_active": 1,
    "type": "component_group"
}
```

### Field Group
```
{
    "id": 4108,
    "account_id": 3,
    "bid_id": 190,
    "title": "General",
    "config": {
        "fields": [18262, 18263],
        "order_index": 0
    },
    "definition_id": 109,
    "definition_version": 4,
    "created_at": "2017-09-26T23:04:55+00:00",
    "updated_at": "2017-09-26T23:04:55+00:00",
    "is_active": 1,
    "type": "field_group"
}
```