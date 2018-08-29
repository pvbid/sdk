# CHANGELOG

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
