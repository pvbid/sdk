# Repositories
Included in the SDK are multiple repositories to easily access data from the server. The repositories are initialized within the [PVBidContext].

**Available Repositories**
* `pvbid.repositories.bids` See [BidRepository]
* `pvbid.repositories.projects` See [ProjectRepository]
* `pvbid.repositories.projectStatuses` See [ProjectStatusRepository]
* `pvbid.repositories.tags` See [TagRepository]
* `pvbid.repositories.snapshots` See [SnapshotRepository]
* `pvbid.repositories.assemblies` See [AssemblyRepository]
* `pvbid.repositories.users` See [UserRepository]
* `pvbid.repositories.predictionModels` See [PredictionModelRepository]

These repositories are available as read-only (they should be modified through the pvbid application):
* `pvbid.repositories.assemblyDefs` See [AssemblyDefRepository]
* `pvbid.repositories.lineItemDefs` See [LineItemDefRepository]
* `pvbid.repositories.fieldDefs` See [FieldDefRepository]
* `pvbid.repositories.fieldGroupDefs` See [FieldGroupDefRepository]
* `pvbid.repositories.metricDefs` See [MetricDefRepository]
* `pvbid.repositories.componentDefs` See [ComponentDefRepository]
* `pvbid.repositories.componentGroupDefs` See [ComponentGroupDefRepository]

### Code Examples

**Retrieving an array of projects**
```javascript
let params = {
    order_by: "created_at",
    sort_order: "asc",
    per_page: 50
}

try {
    let projects = await pvbid.repositories.projects.get(params);
    console.log(projects) //prints an array of project data.
} catch(error) {
    //handle error;
}
```

**Retrieving a line item definition**
```javascript
const lineItemDefId = 123;
try {
    const lineItemDef = await pvbid.repositories.lineItemDefs.findById(lineItemDefId);
} catch (e) {
    // handle error
}
```


[BidRepository]: ../class/src/repositories/BidRepository.js~BidRepository.html
[ProjectRepository]: ../class/src/repositories/ProjectRepository.js~ProjectRepository.html
[ProjectStatusRepository]: ../class/src/repositories/ProjectStatusRepository.js~ProjectStatusRepository.html
[TagRepository]: ../class/src/repositories/TagRepository.js~TagRepository.html
[SnapshotRepository]: ../class/src/repositories/SnapshotRepository.js~SnapshotRepository.html
[AssemblyRepository]: ../class/src/repositories/AssemblyRepository.js~AssemblyRepository.html
[UserRepository]: ../class/src/repositories/UserRepository.js~UserRepository.html
[PredictionModelRepository]: ../class/src/repositories/PredictionModelRepository.js~PredictionModelRepository.html
[PVBidContext]: ../class/src/PVBidContext.js~PVBidContext.html
[AssemblyDefRepository]: ../class/src/repositories/AssemblyDefRepository.js~AssemblyDefRepository.html
[LineItemDefRepository]: ../class/src/repositories/LineItemDefRepository.js~LineItemDefRepository.html
[FieldDefRepository]: ../class/src/repositories/FieldDefRepository.js~FieldDefRepository.html
[FieldGroupDefRepository]: ../class/src/repositories/FieldGroupDefRepository.js~FieldGroupDefRepository.html
[MetricDefRepository]: ../class/src/repositories/MetricDefRepository.js~MetricDefRepository.html
[ComponentDefRepository]: ../class/src/repositories/ComponentDefRepository.js~ComponentDefRepository.html
[ComponentGroupDefRepository]: ../class/src/repositories/ComponentGroupDefRepository.js~ComponentGroupDefRepository.html
