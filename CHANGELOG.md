# CHANGELOG

### 1.1.25 (2019-07-XX)

Features:
**LineItem:** Now has a "workup" value that can contribute to perQuantity through the formula as `WORKUP`. The current workup value can be accessed via `lineItem.workup`. The workup value cannot be set directly at this time and must be edited via a calculator in the PVBid UI.

### 1.1.24 (2019-06-19)

Bug Fixes:
**Bid:** Fixed bug preventing bid's active status from persisting before bid.load is called.

### 1.1.23 (2019-06-06)

Bug Fixes:
**Datatable:** `findRowByExternalPartId` updated due to data structure changes.

### 1.1.22 (2019-06-04)

Features:
**Repositories:** Account definition can now be accessed (read-only) through the PVBid SDK's repository. Please see the repository documentation for more information.

### 1.1.21 (2019-05-27)

Improvements:

- **PVBid.getProject():** Now accepts options as a second parameter. The `loadBidEntities` option flag determines if the full bid instance (with all entities) should be loaded for each bid in the project. Performance can be increased by setting this flag to false when loading a project with many bids. `loadBidEntities` is set to true by default. Bids loaded without entities may still be renamed, cloned, activated/deactivated, and deleted. They CANNOT be assessed or edited.
- **Bid:** Bids will need to be loaded before they can be edited or assessed if they are loaded without entities using the `loadBidEntities = false` flag detailed above. The asynchronous `bid.load()` method will fetch the full bid and return a promise which resolves once loading is complete.
- **Bid:** Bids now have an `isLoaded` property to indicate whether it has been loaded yet or not.

### 1.1.20 (2019-05-13)

Improvements:

- **LineItem:** The default value of perQuantity has been changed from 0 to 1. This is a step to encourage users to favor Scalar over perQuantity. PerQuantity will be deprecated in a future release due to its limitations compared to Scalar.

### 1.1.19 (2019-04-30)

Features:
**Repositories:** `datatables.findById` and `datatables.save` methods are now supported.
**Datatable:** Introducing _Inventory Links_. Datatables may now contain reference to items in a shared PVBid inventory. If a datatable is linked, the `inventoryLink` property will indicate which inventory the datatable is linked to. Linked datatables will be able to reference the _columns_ of the linked inventory and rows within the datatable that reference specific inventory items will contain all the data associated with that item. All the existing datatable methods (`getValue`, `getOptions`, `getColumnValues`) support this feature. To access the raw row or column data, the `datatable.columns` and `datatable.rows` properties must be used. Rows and columns should NOT be accessed through the `datatable.config` property.
**Datatable:** `datatable.reload()` is an async method that persists and reloads the datatable entity. This is useful in scenarios where an inventory link changes and fresh data is required. Modifying inventory links on a datatable instance is not recommended but it is possible with a Bulk Update in the PVBid application.
**Datatable:** add `datatable.findRowByExternalPartId` method to lookup a row in a datatable by its linked part's 3rd party vendor ID. This is useful for making field list selections based on information coming from an external source.

### 1.1.18 (2019-04-29)

Improvements:

- **Bid:** Immediately trigger a save upon toggling the bid's active state.

### 1.1.17 (2019-04-17)

Improvements:

- **Bid:** `reassessAsync` will force assess the bid and all its entities until the price has converged. It returns a promise that resolves when the reassessment is complete. It rejects if the price has not converged within a limited number of reassessments.

### 1.1.16 (2019-04-04)

Bug Fixes:

- **Bid:** Fixes bug that prevented watts from automatically recalculating after removing assemblies on some occasions.

### 1.1.15 (2019-04-01)

Bug Fixes:

- **pvbid.getAuthToken:** Skips setting the auth token for this request.

### 1.1.14 (2019-03-25)

Bug Fixes:

- **LineItem:** `isPredicted(prop)` now checks all properties prediction statuses if the prop is omitted.
- **Bid:** `markupPercent` is calculated based on the bids line items and can be dynamically overridden.

Features:

- **PVBid:** It is now possible to generate virtual clones/copies of a project instance. These virtual clones are fully assessable but have restricted access to repository and persistence related methods. They are useful for "what if" scenarios. For instance, you could make a virtual clone and reset all line items and metrics to see what the bid total would be had you not made any overwrites without affecting the original bid. To generate a virtual clone from a project instance: `pvbid.getVirtualProjectClone(projectInstance)`. Optionally, you can limit the bids that will be included in the clone by passing an inclusive array of bid ids as the second parameter.
- **Assembly:** `getFieldByAnchor(anchor)` is now available to quickly find a field belonging to an assembly by it's anchor string value.

Improvements:

- **Bid:** The bid data object can now be exported from a Bid instance including all its entities with `bid.exportDataWithEntities()`
- **BidEntity:** The `exportData()` method now accepts a boolean parameter to ensure that the entity's config object is included in the export if set to true. If false, the config will only be included if a change has been detected (this helps with save performance). This parameter is false by default.

### 1.1.13 (2019-03-19)

Bug Fixes:

- **Bid:** Resolves an issue that prevented locked bids from saving their active/included status.

### 1.1.12 (2019-02-27)

Bug Fixes:

- **Project:** `createBid()` now returns the newly created Bid entity

### 1.1.11 (2019-02-25)

Features:

- **Component:** Expose `actualCostConfidenceFactor` and `actualHoursConfidenceFactor` which indicate the confidence of the `actualCost` and `actualHours`. The confidence values are set automatically when the actual values are imported. A confidence of `1` means the value was manually input. Confidence values of `2+` indicate that the actual value was propagated from a related actual value. Higher numbers mean lower confidence. A confidence of `0` indicates that no actual value was given or propagated and the actual value was taken from the bids estimation.

### 1.1.10 (2019-02-22)

Bug Fixes:

- **LineItem:** `isDirty()` better indicates changes to the `config` property

### 1.1.9 (2019-02-19)

Features:

- **Component:** Add an `isOverridden()` method that returns the override status of the component. A component is considered to be overridden if any of its sub-components or line items are overridden.

Improvements:

- **LineItem:** `isOverridden()`'s parameter is now optional. Calling `isOverridden` without a param returns the override status of the whole line item.

### 1.1.8 (2019-01-30)

Documentation:

- Added summary of bid and cost breakdown with code examples.
- Improved anchors documentation

### 1.1.7 (2019-01-28)

Improvements:

- **BidEntities:** Add flag for `exactMatch` when searching for a bid entity by title (`bid.entities.searchByTitle(type, query, exactMatch)`). The exact match flag defaults to false. Think of `exactMatch=false` as wrapping wildcard characters around the query string (`(%<query>%)`). Note that both methods are case insensitive.

### 1.1.7 (2019-01-28)

Improvements:

- **BidEntities:** Add flag for `exactMatch` when searching for a bid entity by title (`bid.entities.searchByTitle(type, query, exactMatch)`). The exact match flag defaults to false. Think of `exactMatch=false` as wrapping wildcard characters around the query string (`(%<query>%)`). Note that both methods are case insensitive.

### 1.1.6 (2019-01-14)

Features:

- **Bid Variable:** Add a new bid variables to a bid with `bid.addBidVariable()`.
- **LineItem:** Labor type line items may now consider tax if the `taxable_labor` bid variable is set to true (false by default).

### 1.1.5 (2019-01-11)

Features:

- **Field:** Introduced the `anchor` property. `Anchors` are a means for identifying similar entities universally across any assembly and any account

Improvements:

- **Bid:** `bid.addAssemblies()` now returns the newly created entities.
- **Assembly:** Exposed `assembly.definitionId`

### 1.1.4 (2018-11-02)

Bug Fixes:

- **Formula Constant Evaluation:** Fixed problem with variables and math constants (e.g. `pi`) conflicting during evaluation

### 1.1.3 (2018-10-24)

Features:

- **PredictionModels Repository:** `repositories.predictionModels.getData(id)` retrieves specific prediction model and the model data

### 1.1.2 (2018-10-23)

Improvements:

- **Documentation:** Add additional examples to the Getting Started section of the Manual

Bug Fixes:

- **Documentation:** Fix broken links

### 1.1.1 (2018-10-18)

Features:

- **Predictive Pricing:** Introduced services to handle the evaluation of prediction models
- **LineItem:** Line items can now determine their value by evaluating a prediction model if configured to do so. A **predicted value** will be used if the `predictive_pricing` bid variable is `true` and the line item's value cannot be computed by evaluating its dependencies. The computed value may be overridden by setting the `use_computed` bid variable to `false` or `lineItem.useComputedValueWhenAvailable` to `false`. The bid must have a non-zero value for Watts.
- **LineItem:** `LineItem.isWeighted` determine or set a line items weighted switch. Predicted line items can optionally be weighted by their total historic inclusion count
- **LineItem:** `LineItem.getPredicted('cost')` determines the predicted cost of the line item using its prediction models
- **Bid|LineItem|Component:** `Bid|LineItem|Component.isPredicted(property)` determines if a property is being predicted
- **BidEntity:** `BidEntity.hasNullDependency(property)` determines if the property depends on an undefined dependency

Improvements:

- **BidVariable:** Expose `isReserved` property
- **PredictionModels Repository:** `repositories.predictionModels.get()` retrieves prediction models for account or specified lineItemDefId
- **Project:** `predictionModels` property allows access to project's prediction models

Bug Fixes:

- **BidVariable:** execute a full reassessment when `markup_strategy` is changed
- **Bid:** `bid.entities.getDependencyValue` now returns `null` instead of `0` for undefined dependencies

### 1.0.39 (2018-08-30)

Bug Fixes:

- **Project:** Improve tracking of changes to the data while project is saving

### 1.0.38 (2018-08-29)

Bug Fixes:

- **Bid:** Fix bug in submargin back-calculation

### 1.0.37 (2018-08-20)

Changes:

- **Field:** For number type fields, getters return value typed as number (instead of string)

### 1.0.36 (2018-07-12)

Bug Fixes:

- **Bid Validation** Improved formula reference validation

### 1.0.35 (2018-06-21)

Improvements:

- **LineItem & Component** Added new editable and computable `costWatt` and `priceWatt` properties.
- **LineItem & Component** Added new read-only `costWithTax` property.

### 1.0.34 (2018-06-19)

Bug Fixes:

- **ProjectRepository:** Project `save()` hotfix to prevent saving when a project is pristine.

### 1.0.33 (2018-06-18)

Bug Fixes:

- **ProjectRepository:** Project `save()` persists changes even if no bids were modified

### 1.0.32 (2018-05-30)

Changes:

- **Component:** Expose the componentGroupId property

### 1.0.31 (2018-05-29)

Bug Fixes:

- **Snapshot:** Expose the save() method from the snapshot repository
- **CacheRepository:** The cache is invalidated when the `create()` method is used

### 1.0.30 (2018-05-24)

Bug Fixes:

- **Documentation:** Link to the changelog from the docs

### 1.0.29 (2018-05-24)

Bug Fixes:

- **Bid:** Return a promise rejection from the `bid.lock()` method if the bid cannot be locked
