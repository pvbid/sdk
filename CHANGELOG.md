# CHANGELOG


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
