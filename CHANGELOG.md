# CHANGELOG

### 1.1.5 (2019-01-11)
Features:
* **Field:** Introduced the `anchor` property. `Anchors` are a means for identifying similar entities universally across any assembly and any account

Improvements:
* **Bid:** `bid.addAssemblies()` now returns the newly created entities.
* **Assembly:** Exposed `assembly.definitionId`

### 1.1.4 (2018-11-02)
Bug Fixes:
* **Formula Constant Evaluation:** Fixed problem with variables and math constants (e.g. `pi`) conflicting during evaluation

### 1.1.3 (2018-10-24)
Features:
* **PredictionModels Repository:** `repositories.predictionModels.getData(id)` retrieves specific prediction model and the model data

### 1.1.2 (2018-10-23)
Improvements:
* **Documentation:** Add additional examples to the Getting Started section of the Manual

Bug Fixes:
* **Documentation:** Fix broken links

### 1.1.1 (2018-10-18)
Features:
* **Predictive Pricing:** Introduced services to handle the evaluation of prediction models
* **LineItem:** Line items can now determine their value by evaluating a prediction model if configured to do so. A **predicted value** will be used if the `predictive_pricing` bid variable is `true` and the line item's value cannot be computed by evaluating it's dependencies. The computed value may be overriden by setting the `use_computed` bid variable to `false` or `lineItem.useComputedValueWhenAvailable` to `false`. The bid must have a non-zero value for Watts.
* **LineItem:** `LineItem.isWeighted` determine or set a line items weighted switch. Predicted line items can optionally be weighted by their total historic inclusion count
* **LineItem:** `LineItem.getPredicted('cost')` determines the predicted cost of the line item using its prediction models
* **Bid|LineItem|Component:** `Bid|LineItem|Component.isPredicted(property)` determines if a property is being predicted
* **BidEntity:** `BidEntity.hasNullDependency(property)` determines if the property depends on an undefined dependency

Improvements:
* **BidVariable:** Expose `isReserved` property
* **PredictionModels Repository:** `repositories.predictionModels.get()` retrieves prediction models for account or specified lineItemDefId
* **Project:** `predictionModels` property allows access to project's prediction models

Bug Fixes:
* **BidVariable:** execute a full reassessment when `markup_strategy` is changed
* **Bid:** `bid.entities.getDependencyValue` now returns `null` instead of `0` for undefined dependencies

### 1.0.39 (2018-08-30)
Bug Fixes:
* **Project:** Improve tracking of changes to the data while project is saving

### 1.0.38 (2018-08-29)
Bug Fixes:
* **Bid:** Fix bug in submargin back-calculation

### 1.0.37 (2018-08-20)
Changes:
* **Field:** For number type fields, getters return value typed as number (instead of string)

### 1.0.36 (2018-07-12)
Bug Fixes:
* **Bid Validation** Improved formula reference validation

### 1.0.35 (2018-06-21)
Improvements:
* **LineItem & Component** Added new editable and computable `costWatt` and `priceWatt` properties.
* **LineItem & Component** Added new readonly `costWithTax` property.


### 1.0.34 (2018-06-19)
Bug Fixes:
* **ProjectRepository:** Project `save()` hotfix to prevent saving when a project is pristine.

### 1.0.33 (2018-06-18)
Bug Fixes:
* **ProjectRepository:** Project `save()` persists changes even if no bids were modified

### 1.0.32 (2018-05-30)
Changes:
* **Component:** Expose the componentGroupId property

### 1.0.31 (2018-05-29)
Bug Fixes:
* **Snapshot:** Expose the save() method from the snapshot repository
* **CacheRepository:** The cache is invalidated when the `create()` method is used

### 1.0.30 (2018-05-24)
Bug Fixes:
* **Documentation:** Link to the changelog from the docs

### 1.0.29 (2018-05-24)
Bug Fixes:
* **Bid:** Return a promise rejection from the `bid.lock()` method if the bid cannot be locked
